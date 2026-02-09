import { and, eq } from "drizzle-orm"
import { analyticsEvents, issueContentLogs } from "@/drizzle/schema"
import { db } from "@/lib/db"

interface TrackEventInput {
  userId: string
  eventType: string
  status: "requested" | "success" | "failed"
  sessionId?: string
  repoOwner?: string
  repoName?: string
  label?: string
  latencyMs?: number
  errorCode?: string
  metadata?: Record<string, unknown>
}

interface CreateIssueContentLogInput {
  userId: string
  generationRequestId?: string
  repoOwner?: string
  repoName?: string
  label?: string
  rawInput?: string
  generatedTitle?: string
  generatedBody?: string
  finalTitle?: string
  finalBody?: string
  issueUrl?: string
  issueNumber?: number
}

export async function trackEvent(input: TrackEventInput) {
  try {
    await db.insert(analyticsEvents).values({
      userId: input.userId,
      eventType: input.eventType,
      status: input.status,
      sessionId: input.sessionId,
      repoOwner: input.repoOwner,
      repoName: input.repoName,
      label: input.label,
      latencyMs: input.latencyMs,
      errorCode: input.errorCode,
      metadata: input.metadata,
    })
  } catch (error) {
    console.error("Failed to track analytics event:", error)
  }
}

export async function createIssueContentLog(input: CreateIssueContentLogInput) {
  try {
    await db.insert(issueContentLogs).values({
      userId: input.userId,
      generationRequestId: input.generationRequestId,
      repoOwner: input.repoOwner,
      repoName: input.repoName,
      label: input.label,
      rawInput: input.rawInput,
      generatedTitle: input.generatedTitle,
      generatedBody: input.generatedBody,
      finalTitle: input.finalTitle,
      finalBody: input.finalBody,
      rawInputLength: input.rawInput?.length,
      generatedBodyLength: input.generatedBody?.length,
      finalBodyLength: input.finalBody?.length,
      issueUrl: input.issueUrl,
      issueNumber: input.issueNumber,
    })
  } catch (error) {
    console.error("Failed to create issue content log:", error)
  }
}

export async function attachSubmitDataToIssueContentLog(input: {
  userId: string
  generationRequestId: string
  repoOwner: string
  repoName: string
  label: string
  finalTitle: string
  finalBody: string
  issueUrl?: string
  issueNumber?: number
}) {
  try {
    const updateResult = await db
      .update(issueContentLogs)
      .set({
        repoOwner: input.repoOwner,
        repoName: input.repoName,
        label: input.label,
        finalTitle: input.finalTitle,
        finalBody: input.finalBody,
        finalBodyLength: input.finalBody.length,
        issueUrl: input.issueUrl,
        issueNumber: input.issueNumber,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(issueContentLogs.userId, input.userId),
          eq(issueContentLogs.generationRequestId, input.generationRequestId)
        )
      )
      .returning({ id: issueContentLogs.id })

    return updateResult.length > 0
  } catch (error) {
    console.error("Failed to attach submit data to issue content log:", error)
    return false
  }
}
