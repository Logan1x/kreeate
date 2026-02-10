import { NextResponse } from "next/server"
import { gte, sql } from "drizzle-orm"
import { analyticsEvents } from "@/drizzle/schema"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isAdminEmail } from "@/lib/admin"

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [totals] = await db
      .select({
        generateSuccess: sql<number>`sum(case when ${analyticsEvents.eventType} = 'issue_generate' and ${analyticsEvents.status} = 'success' then 1 else 0 end)`,
        generateFailed: sql<number>`sum(case when ${analyticsEvents.eventType} = 'issue_generate' and ${analyticsEvents.status} = 'failed' then 1 else 0 end)`,
        fallbackUsed: sql<number>`sum(case when ${analyticsEvents.eventType} = 'issue_generate' and ${analyticsEvents.status} = 'success' and coalesce(${analyticsEvents.metadata}->>'fallbackUsed', 'false') = 'true' then 1 else 0 end)`,
        rateLimited: sql<number>`sum(case when ${analyticsEvents.errorCode} = 'rate_limited' then 1 else 0 end)`,
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.occurredAt, since))

    const dailyRows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${analyticsEvents.occurredAt}), 'YYYY-MM-DD')`,
        generateSuccess: sql<number>`sum(case when ${analyticsEvents.eventType} = 'issue_generate' and ${analyticsEvents.status} = 'success' then 1 else 0 end)`,
        generateFailed: sql<number>`sum(case when ${analyticsEvents.eventType} = 'issue_generate' and ${analyticsEvents.status} = 'failed' then 1 else 0 end)`,
        fallbackUsed: sql<number>`sum(case when ${analyticsEvents.eventType} = 'issue_generate' and ${analyticsEvents.status} = 'success' and coalesce(${analyticsEvents.metadata}->>'fallbackUsed', 'false') = 'true' then 1 else 0 end)`,
        rateLimited: sql<number>`sum(case when ${analyticsEvents.errorCode} = 'rate_limited' then 1 else 0 end)`,
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.occurredAt, since))
      .groupBy(sql`date_trunc('day', ${analyticsEvents.occurredAt})`)
      .orderBy(sql`date_trunc('day', ${analyticsEvents.occurredAt}) asc`)

    const generateSuccess = Number(totals?.generateSuccess ?? 0)
    const generateFailed = Number(totals?.generateFailed ?? 0)
    const fallbackUsed = Number(totals?.fallbackUsed ?? 0)
    const rateLimited = Number(totals?.rateLimited ?? 0)
    const generateTotal = generateSuccess + generateFailed

    return NextResponse.json({
      range: "7d",
      generatedAt: new Date().toISOString(),
      totals: {
        generateSuccess,
        generateFailed,
        generateTotal,
        generateSuccessRate: generateTotal > 0 ? Number(((generateSuccess / generateTotal) * 100).toFixed(1)) : 0,
        fallbackUsed,
        fallbackUsageRate: generateSuccess > 0 ? Number(((fallbackUsed / generateSuccess) * 100).toFixed(1)) : 0,
        rateLimited,
      },
      daily: dailyRows.map((row) => ({
        day: row.day,
        generateSuccess: Number(row.generateSuccess ?? 0),
        generateFailed: Number(row.generateFailed ?? 0),
        fallbackUsed: Number(row.fallbackUsed ?? 0),
        rateLimited: Number(row.rateLimited ?? 0),
      })),
    })
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: string }).code)
      : ""

    if (code === "42P01") {
      return NextResponse.json(
        {
          error: "Analytics tables are missing. Run `npx drizzle-kit migrate` to create them.",
        },
        { status: 503 }
      )
    }

    console.error("Failed to fetch admin analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
