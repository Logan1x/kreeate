"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { IconLoader2, IconRefresh, IconArrowLeft, IconExternalLink } from "@tabler/icons-react"
import { TopNav } from "@/components/home/top-nav"
import { Button } from "@/components/ui/button"
import type { ProjectBoard, ProjectBoardItem } from "@/types/projects"

type ItemFilter = "all" | "pending" | "assigned"

interface BoardResponse {
  board: ProjectBoard
}

export default function ProjectBoardPage() {
  const { data: session, status } = useSession()
  const params = useParams<{ owner: string; number: string }>()
  const owner = params?.owner || ""
  const number = params?.number || ""

  const [board, setBoard] = useState<ProjectBoard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<ItemFilter>("all")

  useEffect(() => {
    if (!session || !owner || !number) return

    let ignore = false
    const fetchBoard = async () => {
      setIsLoading(true)
      setError("")

      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(owner)}/${number}`)
        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error || "Failed to fetch board")
        }

        const payload: BoardResponse = await response.json()
        if (!ignore) {
          setBoard(payload.board)
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to fetch board")
          setBoard(null)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void fetchBoard()

    return () => {
      ignore = true
    }
  }, [session, owner, number])

  const refreshBoard = async () => {
    if (!owner || !number) return

    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(owner)}/${number}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to fetch board")
      }

      const payload: BoardResponse = await response.json()
      setBoard(payload.board)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch board")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = useMemo(() => {
    if (!board) return []

    if (filter === "pending") {
      return board.items.filter((item) => item.isPending)
    }
    if (filter === "assigned") {
      return board.items.filter((item) => item.isAssignedToViewer)
    }
    return board.items
  }, [board, filter])

  const groupedByStatus = useMemo(() => {
    const groups = new Map<string, ProjectBoardItem[]>()

    for (const item of filteredItems) {
      const status = item.status || "No status"
      if (!groups.has(status)) {
        groups.set(status, [])
      }
      groups.get(status)!.push(item)
    }

    return Array.from(groups.entries())
      .map(([status, items]) => ({ status, items }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [filteredItems])

  if (status === "loading" || (isLoading && !board && !error)) {
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
          <p className="mt-2 text-white/60">Please sign in to view project boards.</p>
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

        <section className="w-full">
          <div className="flex items-center justify-between gap-3">
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
              <IconArrowLeft className="h-4 w-4" />
              All boards
            </Link>
            <Button
              type="button"
              variant="secondary"
              onClick={refreshBoard}
              disabled={isLoading}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            >
              {isLoading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconRefresh className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>

          {board && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">{board.title}</h1>
                  <p className="mt-1 text-sm font-mono text-white/50">{board.owner} / #{board.number}</p>
                </div>
                <a href={board.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-white/75 hover:text-white">
                  View on GitHub
                  <IconExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <Metric label="Total" value={board.stats.total} />
                <Metric label="Pending" value={board.stats.pending} />
                <Metric label="Assigned to me" value={board.stats.assignedToViewer} />
                <Metric label="Done" value={board.stats.done} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <FilterButton label="All" active={filter === "all"} onClick={() => setFilter("all")} />
                <FilterButton label="Pending" active={filter === "pending"} onClick={() => setFilter("pending")} />
                <FilterButton label="Assigned to me" active={filter === "assigned"} onClick={() => setFilter("assigned")} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
          )}

          {board && groupedByStatus.length === 0 && !isLoading && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              No items match this filter.
            </div>
          )}

          {groupedByStatus.length > 0 && (
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {groupedByStatus.map((group) => (
                <section key={group.status} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">{group.status}</h2>
                    <span className="text-xs text-white/50">{group.items.length}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <article key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white hover:text-white/85">
                          {item.title}
                        </a>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                          <span>{item.contentType === "pull_request" ? "PR" : item.contentType === "issue" ? "Issue" : "Draft"}</span>
                          {item.repoFullName ? <span>{item.repoFullName}</span> : null}
                          {item.state ? <span>{item.state.toLowerCase()}</span> : null}
                          {item.updatedAt ? <span>{new Date(item.updatedAt).toLocaleDateString()}</span> : null}
                        </div>
                        {item.assignees.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.assignees.map((assignee) => (
                              <span key={assignee.login} className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
                                @{assignee.login}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex rounded-md border px-3 py-1 text-xs transition-colors cursor-pointer ${
        active ? "border-white/30 bg-white/20 text-white" : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  )
}
