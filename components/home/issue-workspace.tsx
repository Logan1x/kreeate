import type React from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RepoSelector } from "@/components/repo-selector"
import { ISSUE_TYPE_PRESETS, PRIORITY_LABELS } from "@/components/home/constants"
import { RecentIssuesCarousel } from "@/components/home/recent-issues-carousel"
import type { IssueType, MessageType, RecentIssue, RepoSelection, StatusMessage } from "@/components/home/types"

interface IssueWorkspaceProps {
  openAccordion: string[]
  onOpenAccordionChange: (value: string[]) => void
  selectedRepo: RepoSelection | null
  isSubmitted: boolean
  selectedIssueType: IssueType
  onIssueTypeChange: (value: IssueType) => void
  input: string
  onInputChange: (value: string) => void
  onGenerateIssue: () => void
  isGenerating: boolean
  title: string
  onTitleChange: (value: string) => void
  body: string
  onBodyChange: (value: string) => void
  lastRepo: RepoSelection | null
  pinnedRepos: RepoSelection[]
  onPinnedReposChange: (repos: RepoSelection[]) => void
  onSelectedRepoChange: (repo: RepoSelection | null) => void
  selectedLabel: string
  suggestedPriority: string
  onSelectPriority: (value: string) => void
  onSubmitIssue: () => void
  isSubmitting: boolean
  message: StatusMessage
  messageType: MessageType
  recentIssues: RecentIssue[]
  isLoadingRecentIssues: boolean
  recentIssuesError: string
  canScrollLeft: boolean
  canScrollRight: boolean
  carouselPageCount: number
  carouselIndex: number
  recentIssuesScrollerRef: React.RefObject<HTMLDivElement | null>
  onRefreshRecentIssues: () => void
  onScrollRecentIssues: (direction: "left" | "right") => void
  formatIssueDate: (value: string) => string
}

export function IssueWorkspace({
  openAccordion,
  onOpenAccordionChange,
  selectedRepo,
  isSubmitted,
  selectedIssueType,
  onIssueTypeChange,
  input,
  onInputChange,
  onGenerateIssue,
  isGenerating,
  title,
  onTitleChange,
  body,
  onBodyChange,
  lastRepo,
  pinnedRepos,
  onPinnedReposChange,
  onSelectedRepoChange,
  selectedLabel,
  suggestedPriority,
  onSelectPriority,
  onSubmitIssue,
  isSubmitting,
  message,
  messageType,
  recentIssues,
  isLoadingRecentIssues,
  recentIssuesError,
  canScrollLeft,
  canScrollRight,
  carouselPageCount,
  carouselIndex,
  recentIssuesScrollerRef,
  onRefreshRecentIssues,
  onScrollRecentIssues,
  formatIssueDate,
}: IssueWorkspaceProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-16">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Create an Issue
        </h1>
        <p className="text-white/60 text-lg">
          Describe what you want and let AI do the rest.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${openAccordion.includes("review")
          ? "bg-white/10 text-white/80 border border-white/20"
          : "bg-white/5 text-white/40 border border-white/5"
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${openAccordion.includes("review") ? "bg-white" : "bg-white/30"
            }`} />
          {openAccordion.includes("review") ? "Generated" : "Drafting"}
        </span>
        {selectedRepo && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-white/40 border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            Repository Selected
          </span>
        )}
        {isSubmitted && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Submitted
          </span>
        )}
      </div>

      <Accordion
        value={openAccordion}
        onValueChange={onOpenAccordionChange}
        className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
      >
        <AccordionItem value="describe" className="border-b border-white/10 px-6">
          <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline text-white/80">
            Describe your issue
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-white/50 text-sm mb-4">
              Provide a detailed description of the bug or feature request.
            </p>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block text-white/70">Issue type</label>
              <div className="grid grid-cols-3 gap-2">
                {ISSUE_TYPE_PRESETS.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => onIssueTypeChange(type.value)}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-center transition-colors cursor-pointer ${selectedIssueType === type.value
                      ? "border-white/35 bg-white/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                  >
                    <p className="text-xs font-semibold leading-tight">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Describe the bug or feature request in plain English..."
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault()
                  if (!isGenerating && input.trim()) {
                    onGenerateIssue()
                  }
                }
              }}
              rows={5}
              className="mb-4 text-base bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/10 rounded-xl"
            />
            <Button
              onClick={onGenerateIssue}
              disabled={isGenerating || !input.trim()}
              className="w-full bg-white text-black hover:bg-white/90 font-semibold cursor-pointer"
            >
              {isGenerating && <IconLoader2 className="mr-2 animate-spin" />}
              {isGenerating ? "Generating..." : "Generate Issue"} <kbd className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">CMD + Enter</kbd>
            </Button>
          </AccordionContent>
        </AccordionItem>

        {(title || body) && (
          <AccordionItem value="review" className="px-6">
            <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline text-white/80">
              Review and Edit
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-white/50 text-sm mb-4">
                Review the generated title and description, then edit as needed.
              </p>
              <Input
                placeholder="Issue title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="mb-4 text-base bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/10 rounded-xl h-12 px-4"
              />
              <Textarea
                placeholder="Issue description"
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                rows={6}
                className="mb-4 text-base bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/10 rounded-xl"
              />
              <div className="mb-4">
                <RepoSelector
                  value={selectedRepo}
                  onChange={onSelectedRepoChange}
                  lastRepo={lastRepo}
                  pinnedRepos={pinnedRepos}
                  onPinnedReposChange={onPinnedReposChange}
                />
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block text-white/70">Priority</label>
                {suggestedPriority && (
                  <p className="text-xs text-white/50 mb-2">Auto-suggested: <span className="text-white/75">{suggestedPriority}</span></p>
                )}
                <div className="flex gap-2">
                  {PRIORITY_LABELS.map((label) => (
                    <button
                      key={label.value}
                      onClick={() => onSelectPriority(label.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border cursor-pointer ${selectedLabel === label.value
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/80"
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${label.color}`} />
                      {label.label}
                      {selectedLabel === label.value && (
                        <span className="text-xs opacity-60 ml-0.5">{label.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={onSubmitIssue}
                disabled={isSubmitting || !title.trim() || !body.trim() || !selectedRepo}
                className="w-full bg-white text-black hover:bg-white/90 font-semibold cursor-pointer"
              >
                {isSubmitting && <IconLoader2 className="mr-2 animate-spin" />}
                {isSubmitting ? "Submitting..." : "Submit Issue"}
              </Button>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {message && (
        <Alert variant={messageType === "error" ? "destructive" : "default"} className="mt-4 bg-white/5 border-white/10 text-white">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <RecentIssuesCarousel
        recentIssues={recentIssues}
        isLoadingRecentIssues={isLoadingRecentIssues}
        recentIssuesError={recentIssuesError}
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        carouselPageCount={carouselPageCount}
        carouselIndex={carouselIndex}
        recentIssuesScrollerRef={recentIssuesScrollerRef}
        onRefresh={onRefreshRecentIssues}
        onScroll={onScrollRecentIssues}
        formatIssueDate={formatIssueDate}
      />
    </div>
  )
}
