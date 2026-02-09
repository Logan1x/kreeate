import OpenAI from 'openai'
import { z } from "zod"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createIssueContentLog, trackEvent } from "@/lib/analytics"

// Schema for validating the request body
const requestSchema = z.object({
  input: z.string().min(1, "Input cannot be empty").max(5000, "Input is too long"),
})

// Schema for validating the AI response
const responseSchema = z.object({
  title: z.string(),
  body: z.string(),
})

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://localhost:3000', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': 'Bug Report Generator', // Optional. Site title for rankings on openrouter.ai.
  },
})

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

    const json = await req.json()
    const { input } = requestSchema.parse(json)

    await trackEvent({
      userId: session.user.id,
      eventType: "issue_generate",
      status: "requested",
      metadata: {
        inputLength: input.length,
      },
    })

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-safeguard-20b',
      messages: [
        {
          role: "system",
          content:
            `You are an assistant that converts raw bug reports or feature requests into a SHORT GitHub issue.
            Respond with STRICT JSON only. No markdown headers. No extra text.

            Format:
            {
              "title": string,
              "body": string
            }

            Rules:
            - Title: concise, actionable, max 80 characters
            - Body:
              - One short paragraph summary (2–3 sentences max)
              - Followed by 3–5 simple bullet points using "-"
            - No sections like Goals, Acceptance Criteria, Notes
            - Do not invent process, metrics, approvals, or team coordination
            - Keep it minimal. The user will add details later.
            - Never mention AI or yourself`,
        },
        {
          role: "user",
          content: input,
        },
      ],
    })

    const content = completion.choices[0].message.content

    if (!content) {
      throw new Error("No content received from AI")
    }

    // Try to extract JSON from the response
    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error("AI response is not valid JSON")
      }
    }

    const validResponse = responseSchema.parse(parsedContent)

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
        model: "openai/gpt-oss-safeguard-20b",
        inputLength: input.length,
        generatedTitleLength: validResponse.title.length,
        generatedBodyLength: validResponse.body.length,
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
