import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userPreferences } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import {
  fetchGitHubProjectBoard,
  normalizePinnedProjects,
  parseGitHubProjectUrl,
  pinnedProjectSchema,
} from "@/lib/github-projects"

const MAX_PINNED_PROJECTS = 10

const addProjectSchema = z.object({
  action: z.literal("add"),
  url: z.string().url(),
})

const removeProjectSchema = z.object({
  action: z.literal("remove"),
  project: pinnedProjectSchema,
})

const updateProjectsSchema = z.union([addProjectSchema, removeProjectSchema])

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
    })

    const savedBoards = normalizePinnedProjects(prefs?.pinnedProjects)

    if (savedBoards.length === 0) {
      return NextResponse.json({ boards: [] })
    }

    const boards = await Promise.all(
      savedBoards.map(async (board) => {
        try {
          const data = await fetchGitHubProjectBoard(session.accessToken!, board)
          const lastUpdatedAt = data.items.reduce<string | null>((latest, item) => {
            if (!item.updatedAt) return latest
            if (!latest) return item.updatedAt
            return new Date(item.updatedAt).getTime() > new Date(latest).getTime() ? item.updatedAt : latest
          }, null)

          return {
            owner: data.owner,
            number: data.number,
            ownerType: data.ownerType,
            title: data.title,
            url: data.url,
            stats: data.stats,
            lastUpdatedAt,
            hasAccess: true,
            error: null,
          }
        } catch (error) {
          return {
            owner: board.owner,
            number: board.number,
            ownerType: board.ownerType,
            title: `${board.owner} / Project ${board.number}`,
            url: `https://github.com/${board.ownerType === "org" ? "orgs" : "users"}/${board.owner}/projects/${board.number}`,
            stats: {
              total: 0,
              pending: 0,
              assignedToViewer: 0,
              done: 0,
            },
            lastUpdatedAt: null,
            hasAccess: false,
            error: error instanceof Error ? error.message : "Unable to fetch board data.",
          }
        }
      })
    )

    return NextResponse.json({ boards })
  } catch (error) {
    console.error("Error fetching saved project boards:", error)
    return NextResponse.json({ error: "Failed to fetch saved project boards" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await req.json()
    const parsed = updateProjectsSchema.parse(payload)

    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
    })

    const currentBoards = normalizePinnedProjects(prefs?.pinnedProjects)
    let nextBoards = currentBoards

    if (parsed.action === "add") {
      const board = parseGitHubProjectUrl(parsed.url)
      const key = `${board.owner.toLowerCase()}#${board.number}`
      const withoutDuplicate = currentBoards.filter((item) => `${item.owner.toLowerCase()}#${item.number}` !== key)
      nextBoards = [board, ...withoutDuplicate].slice(0, MAX_PINNED_PROJECTS)
    } else {
      const target = `${parsed.project.owner.toLowerCase()}#${parsed.project.number}`
      nextBoards = currentBoards.filter((item) => `${item.owner.toLowerCase()}#${item.number}` !== target)
    }

    if (prefs) {
      await db
        .update(userPreferences)
        .set({
          pinnedProjects: nextBoards,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, session.user.id))
    } else {
      await db.insert(userPreferences).values({
        userId: session.user.id,
        pinnedProjects: nextBoards,
      })
    }

    return NextResponse.json({ pinnedProjects: nextBoards })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes("project URL")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error("Error updating saved project boards:", error)
    return NextResponse.json({ error: "Failed to update saved project boards" }, { status: 500 })
  }
}
