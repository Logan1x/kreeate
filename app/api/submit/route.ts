import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userPreferences } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { attachSubmitDataToIssueContentLog, createIssueContentLog, trackEvent } from "@/lib/analytics"

// Schema for validating the request body
const requestSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  body: z.string().min(1, "Body cannot be empty"),
  label: z.enum(["P0-Unbreak Now", "P1-Must Have", "P2-Normal", "P3-Low Priority"]),
  repoOwner: z.string().min(1, "Repository owner is required"),
  repoName: z.string().min(1, "Repository name is required"),
  generationRequestId: z.string().uuid().optional(),
})

export async function POST(req: Request) {
  const startedAt = Date.now()

  try {
    const session = await auth()

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in with GitHub." },
        { status: 401 }
      )
    }

    const json = await req.json()
    const { title, body, label, repoOwner, repoName, generationRequestId } = requestSchema.parse(json)

    await trackEvent({
      userId: session.user.id,
      eventType: "issue_submit",
      status: "requested",
      repoOwner,
      repoName,
      label,
      metadata: {
        titleLength: title.length,
        bodyLength: body.length,
        hasGenerationRequestId: Boolean(generationRequestId),
      },
    })

    // First check if the repository exists and is accessible
    const repoCheckResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "User-Agent": "Kreeate-Issue-Generator",
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!repoCheckResponse.ok) {
      if (repoCheckResponse.status === 404) {
        return NextResponse.json(
          { error: `Repository '${repoOwner}/${repoName}' not found. Check the owner and repository names.` },
          { status: 404 }
        )
      } else if (repoCheckResponse.status === 403) {
        return NextResponse.json(
          { error: "Cannot access repository. Check your GitHub permissions." },
          { status: 403 }
        )
      } else {
        return NextResponse.json(
          { error: `Cannot access repository: ${repoCheckResponse.statusText}` },
          { status: repoCheckResponse.status }
        )
      }
    }

    // Create the issue
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
          "User-Agent": "Kreeate-Issue-Generator",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          title,
          body,
          labels: [label],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("GitHub API error details:", errorData)

      if (response.status === 403) {
        return NextResponse.json(
          { error: "GitHub API Forbidden: Check your token permissions. Make sure it has 'repo' scope for the target repository." },
          { status: 403 }
        )
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: "GitHub API Not Found: Check that the repository exists and the owner/repo names are correct." },
          { status: 404 }
        )
      } else if (response.status === 401) {
        return NextResponse.json(
          { error: "GitHub API Unauthorized: Your token may be expired. Please sign out and sign in again." },
          { status: 401 }
        )
      } else {
        return NextResponse.json(
          { error: `GitHub API error (${response.status}): ${response.statusText}` },
          { status: response.status }
        )
      }
    }

    const issue = await response.json()

    if (generationRequestId) {
      const updated = await attachSubmitDataToIssueContentLog({
        userId: session.user.id,
        generationRequestId,
        repoOwner,
        repoName,
        label,
        finalTitle: title,
        finalBody: body,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
      })

      if (!updated) {
        await createIssueContentLog({
          userId: session.user.id,
          generationRequestId,
          repoOwner,
          repoName,
          label,
          finalTitle: title,
          finalBody: body,
          issueUrl: issue.html_url,
          issueNumber: issue.number,
        })
      }
    } else {
      await createIssueContentLog({
        userId: session.user.id,
        repoOwner,
        repoName,
        label,
        finalTitle: title,
        finalBody: body,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
      })
    }

    // Update user preferences with last selected repo
    try {
      const existingPreference = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, session.user.id),
      })

      if (existingPreference) {
        await db
          .update(userPreferences)
          .set({
            lastRepoOwner: repoOwner,
            lastRepoName: repoName,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, session.user.id))
      } else {
        await db.insert(userPreferences).values({
          userId: session.user.id,
          lastRepoOwner: repoOwner,
          lastRepoName: repoName,
        })
      }
    } catch (dbError) {
      // Log but don't fail the request if preferences update fails
      console.error("Failed to update user preferences:", dbError)
    }

    await trackEvent({
      userId: session.user.id,
      eventType: "issue_submit",
      status: "success",
      repoOwner,
      repoName,
      label,
      latencyMs: Date.now() - startedAt,
      metadata: {
        issueNumber: issue.number,
        issueUrl: issue.html_url,
      },
    })

    return NextResponse.json({
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      issueTitle: issue.title,
      issueState: issue.state,
      issueCreatedAt: issue.created_at,
      repoFullName: `${repoOwner}/${repoName}`,
    })
  } catch (error) {
    console.error("Error submitting issue:", error)

    const session = await auth().catch(() => null)
    if (session) {
      await trackEvent({
        userId: session.user.id,
        eventType: "issue_submit",
        status: "failed",
        latencyMs: Date.now() - startedAt,
        errorCode: error instanceof Error ? error.name : "unknown_error",
        metadata: {
          message: error instanceof Error ? error.message : String(error),
        },
      })
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to submit issue" },
      { status: 500 }
    )
  }
}
