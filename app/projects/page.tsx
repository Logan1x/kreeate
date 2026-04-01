"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { IconLoader2, IconRefresh, IconAlertCircle, IconExternalLink } from "@tabler/icons-react"
import { TopNav } from "@/components/home/top-nav"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SavedProjectBoardCard } from "@/types/projects"

interface BoardsResponse {
  boards: SavedProjectBoardCard[]
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const [boards, setBoards] = useState<SavedProjectBoardCard[]>([])
  const [projectUrl, setProjectUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchBoards = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to fetch boards")
      }

      const payload: BoardsResponse = await response.json()
      setBoards(payload.boards || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch boards")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!session) return
    void fetchBoards()
  }, [session])

  const addBoard = async () => {
    if (!projectUrl.trim()) return

    setIsSaving(true)
    setError("")
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", url: projectUrl.trim() }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to add board")
      }

      setProjectUrl("")
      await fetchBoards()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add board")
    } finally {
      setIsSaving(false)
    }
  }

  const removeBoard = async (board: Pick<SavedProjectBoardCard, "owner" | "number" | "ownerType">) => {
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          project: {
            owner: board.owner,
            number: board.number,
            ownerType: board.ownerType,
          },
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to remove board")
      }

      await fetchBoards()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove board")
    } finally {
      setIsSaving(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Sign in required</h1>
          <p className="mt-2 text-white/60">Please sign in to manage and view GitHub project boards.</p>
          <Link href="/" className="mt-4 inline-flex text-white underline hover:text-white/80">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 md:py-12 flex flex-col items-center">
        <TopNav session={session} />

        <section className="w-full max-w-5xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Project Boards</h1>
              <p className="mt-2 text-white/60">Add multiple GitHub Project URLs and track pending or assigned work from one place.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={fetchBoards}
              disabled={isLoading}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              {isLoading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconRefresh className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-sm text-white/80">Add board URL</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="https://github.com/users/<owner>/projects/<number>"
                value={projectUrl}
                onChange={(event) => setProjectUrl(event.target.value)}
                className="font-mono text-sm bg-white/10 border-white/10 text-white placeholder:text-white/40 rounded-xl"
              />
              <Button
                type="button"
                onClick={addBoard}
                disabled={isSaving || !projectUrl.trim()}
                className="bg-white text-black hover:bg-white/90 cursor-pointer"
              >
                {isSaving ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add board
              </Button>
            </div>
            <p className="mt-2 text-xs text-white/45">Supports both user and organization boards.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4 border-red-400/35 bg-red-500/15 text-red-100">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <article key={`${board.owner}-${board.number}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">{board.title}</h2>
                    <p className="mt-1 text-xs font-mono text-white/50">{board.owner} / #{board.number}</p>
                  </div>
                  <a href={board.url} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white">
                    <IconExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {!board.hasAccess && board.error ? (
                  <p className="mt-4 text-sm text-red-200">{board.error}</p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <Stat label="Total" value={board.stats.total} />
                    <Stat label="Pending" value={board.stats.pending} />
                    <Stat label="Assigned" value={board.stats.assignedToViewer} />
                    <Stat label="Done" value={board.stats.done} />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Link
                    href={`/projects/${encodeURIComponent(board.owner)}/${board.number}`}
                    className="inline-flex h-8 items-center rounded-md bg-white px-3 text-xs font-medium text-black hover:bg-white/90"
                  >
                    Open board
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBoard(board)}
                    disabled={isSaving}
                    className="text-white/65 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {!isLoading && boards.length === 0 && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              No boards added yet. Paste a GitHub project URL to get started.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
      <p className="text-white/45">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  )
}
