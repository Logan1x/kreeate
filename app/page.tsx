"use client"

import React, { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { IconLoader2 } from "@tabler/icons-react"
import { LOCAL_SELECTED_REPO_KEY } from "@/components/home/constants"
import { IssueWorkspace } from "@/components/home/issue-workspace"
import { LandingSection } from "@/components/home/landing-section"
import { TopNav } from "@/components/home/top-nav"
import type { IssueType, MessageType, RecentIssue, RepoSelection, StatusMessage } from "@/components/home/types"

export default function Home() {
  const { data: session, status } = useSession()

  const [input, setInput] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedLabel, setSelectedLabel] = useState("P2-Normal")
  const [selectedIssueType, setSelectedIssueType] = useState<IssueType>("bug")
  const [suggestedPriority, setSuggestedPriority] = useState("")
  const [selectedRepo, setSelectedRepo] = useState<RepoSelection | null>(null)
  const [lastRepo, setLastRepo] = useState<RepoSelection | null>(null)
  const [pinnedRepos, setPinnedRepos] = useState<RepoSelection[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<StatusMessage>("")
  const [messageType, setMessageType] = useState<MessageType>("success")
  const [openAccordion, setOpenAccordion] = useState<string[]>(["describe"])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [generationRequestId, setGenerationRequestId] = useState("")
  const [recentIssues, setRecentIssues] = useState<RecentIssue[]>([])
  const [isLoadingRecentIssues, setIsLoadingRecentIssues] = useState(false)
  const [recentIssuesError, setRecentIssuesError] = useState("")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [carouselPageCount, setCarouselPageCount] = useState(1)
  const [carouselIndex, setCarouselIndex] = useState(0)

  const recentIssuesScrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!session) return

    try {
      const savedRepo = window.localStorage.getItem(LOCAL_SELECTED_REPO_KEY)
      if (savedRepo) {
        const parsed = JSON.parse(savedRepo) as { owner?: string; name?: string }
        if (parsed.owner && parsed.name) {
          setSelectedRepo({ owner: parsed.owner, name: parsed.name })
        }
      }
    } catch (error) {
      console.error("Failed to restore local repository selection:", error)
    }

    void fetchUserPreferences()
    void fetchRecentIssues()
  }, [session])

  useEffect(() => {
    if (!session) return

    try {
      if (selectedRepo) {
        window.localStorage.setItem(LOCAL_SELECTED_REPO_KEY, JSON.stringify(selectedRepo))
      } else {
        window.localStorage.removeItem(LOCAL_SELECTED_REPO_KEY)
      }
    } catch (error) {
      console.error("Failed to persist local repository selection:", error)
    }
  }, [selectedRepo, session])

  useEffect(() => {
    const scroller = recentIssuesScrollerRef.current

    if (!scroller) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      setCarouselPageCount(1)
      setCarouselIndex(0)
      return
    }

    const updateScrollState = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth
      setCanScrollLeft(scroller.scrollLeft > 4)
      setCanScrollRight(scroller.scrollLeft < maxScrollLeft - 4)

      const step = 320
      const pages = Math.max(1, Math.ceil(maxScrollLeft / step) + 1)
      const index = Math.min(pages - 1, Math.max(0, Math.round(scroller.scrollLeft / step)))
      setCarouselPageCount(pages)
      setCarouselIndex(index)
    }

    updateScrollState()
    scroller.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)

    return () => {
      scroller.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [recentIssues.length])

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch("/api/preferences")
      if (!response.ok) return

      const data = await response.json()
      if (data.lastRepo) {
        setLastRepo(data.lastRepo)
      }
      if (Array.isArray(data.pinnedRepos)) {
        setPinnedRepos(data.pinnedRepos)
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error)
    }
  }

  const fetchRecentIssues = async () => {
    setIsLoadingRecentIssues(true)
    setRecentIssuesError("")

    try {
      const response = await fetch("/api/recent-issues")
      if (!response.ok) {
        throw new Error("Failed to fetch recent issues")
      }

      const data = await response.json()
      setRecentIssues(data.issues ?? [])
    } catch (error) {
      console.error(error)
      setRecentIssuesError("Could not load recent issues right now.")
    } finally {
      setIsLoadingRecentIssues(false)
    }
  }

  const formatIssueDate = (value: string) => {
    const date = new Date(value)
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const scrollRecentIssues = (direction: "left" | "right") => {
    if (!recentIssuesScrollerRef.current) return

    const scrollAmount = 320
    recentIssuesScrollerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  const generateIssue = async () => {
    if (!input.trim()) return

    setIsGenerating(true)
    setMessage("")

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, issueType: selectedIssueType }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate issue")
      }

      const data = await response.json()
      setTitle(data.title)
      setBody("Original issue:\n" + input + "\n\n" + data.body)
      if (data.suggestedPriority) {
        setSelectedLabel(data.suggestedPriority)
        setSuggestedPriority(data.suggestedPriority)
      }
      setGenerationRequestId(data.generationRequestId || "")
      setMessage("Issue generated successfully!")
      setMessageType("success")
      setOpenAccordion(["review"])
    } catch (error) {
      console.error(error)
      setGenerationRequestId("")
      setSuggestedPriority("")
      setMessage("Failed to generate issue. Please try again.")
      setMessageType("error")
    } finally {
      setIsGenerating(false)
    }
  }

  const submitIssue = async () => {
    if (!title.trim() || !body.trim() || !selectedRepo) return

    setIsSubmitting(true)
    setMessage("")

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          label: selectedLabel,
          repoOwner: selectedRepo.owner,
          repoName: selectedRepo.name,
          generationRequestId: generationRequestId || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to submit issue" }))
        throw new Error(errorData.error || "Failed to submit issue")
      }

      const data = await response.json()
      setRecentIssues((current) => {
        const newIssue: RecentIssue = {
          id: Date.now(),
          number: data.issueNumber,
          title: data.issueTitle || title,
          url: data.issueUrl,
          state: data.issueState || "open",
          createdAt: data.issueCreatedAt || new Date().toISOString(),
          repoFullName: data.repoFullName || `${selectedRepo.owner}/${selectedRepo.name}`,
        }

        const withoutDuplicate = current.filter((issue) => issue.url !== newIssue.url)
        return [newIssue, ...withoutDuplicate].slice(0, 12)
      })

      setIsSubmitted(true)
      setMessage(
        <span>
          Issue created successfully! View it at{" "}
          <a
            href={data.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline font-medium"
          >
            {data.issueUrl}
          </a>
        </span>
      )
      setMessageType("success")
      setInput("")
      setTitle("")
      setBody("")
      setGenerationRequestId("")
      setSuggestedPriority("")
      setSelectedLabel("P2-Normal")
      setOpenAccordion(["describe"])
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : "Failed to submit issue. Please try again.")
      setMessageType("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] opacity-10" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 md:py-12 flex flex-col items-center">
        <TopNav session={session} />

        {!session ? (
          <LandingSection />
        ) : (
          <IssueWorkspace
            openAccordion={openAccordion}
            onOpenAccordionChange={setOpenAccordion}
            selectedRepo={selectedRepo}
            isSubmitted={isSubmitted}
            selectedIssueType={selectedIssueType}
            onIssueTypeChange={setSelectedIssueType}
            input={input}
            onInputChange={(value) => {
              setInput(value)
              setIsSubmitted(false)
            }}
            onGenerateIssue={generateIssue}
            isGenerating={isGenerating}
            title={title}
            onTitleChange={setTitle}
            body={body}
            onBodyChange={setBody}
            lastRepo={lastRepo}
            pinnedRepos={pinnedRepos}
            onPinnedReposChange={setPinnedRepos}
            onSelectedRepoChange={setSelectedRepo}
            selectedLabel={selectedLabel}
            suggestedPriority={suggestedPriority}
            onSelectPriority={(value) => {
              setSelectedLabel(value)
              setSuggestedPriority("")
            }}
            onSubmitIssue={submitIssue}
            isSubmitting={isSubmitting}
            message={message}
            messageType={messageType}
            recentIssues={recentIssues}
            isLoadingRecentIssues={isLoadingRecentIssues}
            recentIssuesError={recentIssuesError}
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            carouselPageCount={carouselPageCount}
            carouselIndex={carouselIndex}
            recentIssuesScrollerRef={recentIssuesScrollerRef}
            onRefreshRecentIssues={fetchRecentIssues}
            onScrollRecentIssues={scrollRecentIssues}
            formatIssueDate={formatIssueDate}
          />
        )}

        <footer className="mt-20 w-full text-center py-12 border-t border-white/5">
          <p className="text-white/40 text-sm">© 2026 Kreeate. Describe it. We format it.</p>
        </footer>
      </div>
    </div>
  )
}
