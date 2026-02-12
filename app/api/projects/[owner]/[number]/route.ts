import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { fetchGitHubProjectBoard } from "@/lib/github-projects"

const paramsSchema = z.object({
  owner: z.string().trim().min(1),
  number: z.coerce.number().int().positive(),
})

export async function GET(
  _req: Request,
  context: { params: Promise<{ owner: string; number: string }> }
) {
  try {
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await context.params
    const { owner, number } = paramsSchema.parse(resolvedParams)

    const board = await fetchGitHubProjectBoard(session.accessToken, { owner, number })

    return NextResponse.json({ board })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid board route parameters", details: error.issues }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "Failed to fetch project board"
    const status = message.toLowerCase().includes("access") || message.toLowerCase().includes("not found") ? 404 : 500

    return NextResponse.json({ error: message }, { status })
  }
}
