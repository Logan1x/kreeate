import type React from "react"
import { IconChevronLeft, IconChevronRight, IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { RecentIssue } from "@/components/home/types"

interface RecentIssuesCarouselProps {
  recentIssues: RecentIssue[]
  isLoadingRecentIssues: boolean
  recentIssuesError: string
  canScrollLeft: boolean
  canScrollRight: boolean
  carouselPageCount: number
  carouselIndex: number
  recentIssuesScrollerRef: React.RefObject<HTMLDivElement | null>
  onRefresh: () => void
  onScroll: (direction: "left" | "right") => void
  formatIssueDate: (value: string) => string
}

export function RecentIssuesCarousel({
  recentIssues,
  isLoadingRecentIssues,
  recentIssuesError,
  canScrollLeft,
  canScrollRight,
  carouselPageCount,
  carouselIndex,
  recentIssuesScrollerRef,
  onRefresh,
  onScroll,
  formatIssueDate,
}: RecentIssuesCarouselProps) {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wider text-white/60 font-semibold">Recently Created Issues</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoadingRecentIssues}
          aria-label="Refresh recent issues"
          className="border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <IconRefresh className={`h-4 w-4 ${isLoadingRecentIssues ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {recentIssuesError && (
        <p className="mb-3 text-sm text-red-300/90">{recentIssuesError}</p>
      )}

      {isLoadingRecentIssues && recentIssues.length === 0 ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="min-w-[260px] h-28 rounded-xl border border-white/10 bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : recentIssues.length > 0 ? (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-14 bg-gradient-to-r from-black via-black/85 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-14 bg-gradient-to-l from-black via-black/85 to-transparent" />
          <Button
            type="button"
            size="icon"
            onClick={() => onScroll("left")}
            disabled={!canScrollLeft}
            className="absolute left-2 top-[40%] -translate-y-1/2 z-10 bg-white/35 text-white hover:bg-white hover:text-black rounded-full h-9 w-9 cursor-pointer transition-all disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/70"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            onClick={() => onScroll("right")}
            disabled={!canScrollRight}
            className="absolute right-2 top-[40%] -translate-y-1/2 z-10 bg-white/35 text-white hover:bg-white hover:text-black rounded-full h-9 w-9 cursor-pointer transition-all disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/70"
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <div
            ref={recentIssuesScrollerRef}
            className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-3 snap-x snap-mandatory px-12">
              {recentIssues.map((issue) => (
                <a
                  key={issue.url}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="snap-start min-w-[260px] max-w-[320px] flex-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 flex flex-col"
                >
                  <p className="text-xs text-white/50 mb-2 font-mono truncate">{issue.repoFullName} #{issue.number}</p>
                  <p className="text-sm text-white leading-snug max-h-10 overflow-hidden mb-2">{issue.title}</p>
                  <div className="mt-auto pt-2 flex items-center justify-between text-xs">
                    <span className={`inline-flex px-2 py-0.5 rounded-full ${issue.state === "open" ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-500/30 text-zinc-200"}`}>
                      {issue.state}
                    </span>
                    <span className="text-white/45">{formatIssueDate(issue.createdAt)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
          {carouselPageCount > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2">
              {Array.from({ length: carouselPageCount }).map((_, index) => (
                <span
                  key={index}
                  className={index === carouselIndex ? "h-1.5 w-6 rounded-full bg-white/80" : "h-1.5 w-1.5 rounded-full bg-white/35"}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-white/45 rounded-xl border border-dashed border-white/15 bg-white/5 p-4">
          No recent issues yet. Your newly submitted issues will show up here.
        </p>
      )}
    </div>
  )
}
