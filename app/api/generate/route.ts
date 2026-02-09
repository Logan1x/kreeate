import OpenAI from "openai"
import { z } from "zod"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createIssueContentLog, trackEvent } from "@/lib/analytics"
import { checkRateLimit } from "@/lib/rate-limit"

const requestSchema = z.object({
  input: z.string().min(1, "Input cannot be empty").max(5000, "Input is too long"),
  issueType: z.enum(["bug", "feature", "task"]).default("bug"),
})

const responseSchema = z.object({
  title: z.string(),
  body: z.string(),
  suggestedPriority: z.enum(["P0-Unbreak Now", "P1-Must Have", "P2-Normal", "P3-Low Priority"]),
})

const primaryModel = process.env.OPENROUTER_PRIMARY_MODEL ?? "openai/gpt-oss-safeguard-20b"
const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL ?? "openai/gpt-4o-mini"

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://localhost:3000",
    "X-Title": "Bug Report Generator",
  },
})

function getIssueTypeInstruction(issueType: "bug" | "feature" | "task") {
  if (issueType === "bug") {
    return "Focus on observed behavior and impact. Include reproducible context when available."
  }

  if (issueType === "feature") {
    return "Focus on user value and expected outcome. Keep scope concrete and implementation-neutral."
  }

  return "Focus on maintenance or operational work with clear expected result."
}

function buildSystemPrompt(issueType: "bug" | "feature" | "task") {
  const issueTypeInstruction = getIssueTypeInstruction(issueType)

  return `You are an assistant that converts raw bug reports or feature requests into a SHORT GitHub issue.
Respond with STRICT JSON only. No markdown headers. No extra text.

Format:
{
  "title": string,
  "body": string,
  "suggestedPriority": "P0-Unbreak Now" | "P1-Must Have" | "P2-Normal" | "P3-Low Priority"
}

Rules:
- Issue Type: ${issueType}
- Type Guidance: ${issueTypeInstruction}
- Title: concise, actionable, max 80 characters
- Body:
  - One short paragraph summary (2-3 sentences max)
  - Followed by 3-5 simple bullet points using "-"
- Priority guidance:
  - P0-Unbreak Now: production outage, security breach, or critical user path broken
  - P1-Must Have: major functionality broken or a release blocker
  - P2-Normal: meaningful improvement or non-blocking bug
  - P3-Low Priority: minor polish, cleanup, or low-impact request
- Always return exactly one suggestedPriority value from the allowed list
- No sections like Goals, Acceptance Criteria, Notes
- Do not invent process, metrics, approvals, or team coordination
- Keep it minimal. The user will add details later.
- Never mention AI or yourself`
}

function parseJsonContent(content: string) {
  try {
    return JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("AI response is not valid JSON")
    }

    return JSON.parse(jsonMatch[1] || jsonMatch[0])
  }
}

async function generateIssueWithModel(params: {
  model: string
  input: string
  issueType: "bug" | "feature" | "task"
}) {
  const completion = await openai.chat.completions.create({
    model: params.model,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(params.issueType),
      },
      {
        role: "user",
        content: params.input,
      },
    ],
  })

  const content = completion.choices[0].message.content

  if (!content) {
    throw new Error("No content received from AI")
  }

  const parsed = parseJsonContent(content)
  return responseSchema.parse(parsed)
}

export async function POST(req: Request) {
  const startedAt = Date.now()

  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in with GitHub." },
        { status: 401 }
      )
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const generateRateLimit = checkRateLimit({
      key: `generate:${session.user.id}:${clientIp}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    })

    if (!generateRateLimit.allowed) {
      await trackEvent({
        userId: session.user.id,
        eventType: "issue_generate",
        status: "failed",
        errorCode: "rate_limited",
        metadata: {
          retryAfterSeconds: generateRateLimit.retryAfterSeconds,
        },
      })

      return NextResponse.json(
        {
          error: "Too many generation requests. Please try again shortly.",
          retryAfterSeconds: generateRateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(generateRateLimit.retryAfterSeconds),
          },
        }
      )
    }

    const json = await req.json()
    const { input, issueType } = requestSchema.parse(json)

    await trackEvent({
      userId: session.user.id,
      eventType: "issue_generate",
      status: "requested",
      metadata: {
        inputLength: input.length,
        issueType,
      },
    })

    let validResponse: z.infer<typeof responseSchema>
    let modelUsed = primaryModel
    let fallbackUsed = false
    let primaryErrorMessage: string | null = null

    try {
      validResponse = await generateIssueWithModel({
        model: primaryModel,
        input,
        issueType,
      })
    } catch (primaryError) {
      primaryErrorMessage = primaryError instanceof Error ? primaryError.message : String(primaryError)
      validResponse = await generateIssueWithModel({
        model: fallbackModel,
        input,
        issueType,
      })
      modelUsed = fallbackModel
      fallbackUsed = true
    }

    const generationRequestId = crypto.randomUUID()

    await createIssueContentLog({
      userId: session.user.id,
      generationRequestId,
      rawInput: input,
      generatedTitle: validResponse.title,
      generatedBody: validResponse.body,
    })

    await trackEvent({
      userId: session.user.id,
      eventType: "issue_generate",
      status: "success",
      latencyMs: Date.now() - startedAt,
      metadata: {
        model: modelUsed,
        primaryModel,
        fallbackModel,
        fallbackUsed,
        primaryErrorMessage,
        inputLength: input.length,
        issueType,
        generatedTitleLength: validResponse.title.length,
        generatedBodyLength: validResponse.body.length,
        suggestedPriority: validResponse.suggestedPriority,
      },
    })

    return NextResponse.json({
      ...validResponse,
      generationRequestId,
    })
  } catch (error) {
    console.error("Error generating issue:", error)

    const session = await auth().catch(() => null)
    if (session) {
      await trackEvent({
        userId: session.user.id,
        eventType: "issue_generate",
        status: "failed",
        latencyMs: Date.now() - startedAt,
        errorCode: error instanceof Error ? error.name : "unknown_error",
        metadata: {
          message: error instanceof Error ? error.message : String(error),
        },
      })
    }

    return NextResponse.json(
      { error: "Failed to generate issue", details: error instanceof Error ? error : String(error) },
      { status: 500 }
    )
  }
}
