import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userPreferences } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

const pinnedRepoSchema = z.object({
  owner: z.string().trim().min(1),
  name: z.string().trim().min(1),
})

const updatePinnedReposSchema = z.object({
  action: z.enum(["pin", "unpin"]),
  repo: pinnedRepoSchema,
})

const MAX_PINNED_REPOS = 10

type PinnedRepo = z.infer<typeof pinnedRepoSchema>

function normalizePinnedRepos(value: unknown): PinnedRepo[] {
  if (!Array.isArray(value)) return []

  const parsed = value
    .map((entry) => pinnedRepoSchema.safeParse(entry))
    .filter((result) => result.success)
    .map((result) => result.data)

  const unique = new Map<string, PinnedRepo>()
  for (const repo of parsed) {
    unique.set(`${repo.owner}/${repo.name}`.toLowerCase(), repo)
  }

  return Array.from(unique.values()).slice(0, MAX_PINNED_REPOS)
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
    })

    const pinnedRepos = normalizePinnedRepos(prefs?.pinnedRepos)

    if (!prefs || !prefs.lastRepoOwner || !prefs.lastRepoName) {
      return NextResponse.json({ lastRepo: null, pinnedRepos })
    }

    return NextResponse.json({
      lastRepo: {
        owner: prefs.lastRepoOwner,
        name: prefs.lastRepoName,
      },
      pinnedRepos,
    })
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payload = await req.json()
    const { action, repo } = updatePinnedReposSchema.parse(payload)

    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
    })

    const currentPinnedRepos = normalizePinnedRepos(prefs?.pinnedRepos)
    const repoKey = `${repo.owner}/${repo.name}`.toLowerCase()

    let nextPinnedRepos: PinnedRepo[]

    if (action === "pin") {
      const withoutRepo = currentPinnedRepos.filter(
        (item) => `${item.owner}/${item.name}`.toLowerCase() !== repoKey
      )
      nextPinnedRepos = [repo, ...withoutRepo].slice(0, MAX_PINNED_REPOS)
    } else {
      nextPinnedRepos = currentPinnedRepos.filter(
        (item) => `${item.owner}/${item.name}`.toLowerCase() !== repoKey
      )
    }

    if (prefs) {
      await db
        .update(userPreferences)
        .set({
          pinnedRepos: nextPinnedRepos,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, session.user.id))
    } else {
      await db.insert(userPreferences).values({
        userId: session.user.id,
        pinnedRepos: nextPinnedRepos,
      })
    }

    return NextResponse.json({ pinnedRepos: nextPinnedRepos })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating user preferences:", error)
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}
