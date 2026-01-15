"use client"

import React, { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { IconLoader2 } from "@tabler/icons-react"
import { SignInButton } from "@/components/auth/sign-in-button"
import { UserProfile } from "@/components/auth/user-profile"
import { RepoSelector } from "@/components/repo-selector"
import { SignOutButton } from "@/components/auth/sign-out-button"

const PRIORITY_LABELS = [
  { value: "P0-Unbreak Now", label: "P0-Unbreak Now" },
  { value: "P1-Must Have", label: "P1-Must Have" },
  { value: "P2-Normal", label: "P2-Normal" },
  { value: "P3-Low Priority", label: "P3-Low Priority" },
] as const

export default function Home() {
  const { data: session, status } = useSession()
  const [input, setInput] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedLabel, setSelectedLabel] = useState("P2-Normal")
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; name: string } | null>(null)
  const [lastRepo, setLastRepo] = useState<{ owner: string; name: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | React.ReactNode>("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [openAccordion, setOpenAccordion] = useState<string[]>(["describe"])
  const [showCreator, setShowCreator] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (session) {
      fetchUserPreferences()
    }
  }, [session])

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch("/api/preferences")
      if (response.ok) {
        const data = await response.json()
        if (data.lastRepo) {
          setLastRepo(data.lastRepo)
        }
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error)
    }
  }

  const generateIssue = async () => {
    if (!input.trim()) return

    setIsGenerating(true)
    setMessage("")

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate issue")
      }

      const data = await response.json()
      setTitle(data.title)
      setBody("Original issue:\n" + input + "\n\n" + data.body)
      setMessage("Issue generated successfully!")
      setMessageType("success")
      setOpenAccordion(["review"])
    } catch (error) {
      console.error(error)
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to submit issue" }))
        throw new Error(errorData.error || "Failed to submit issue")
      }

      const data = await response.json()
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
        <nav className="w-full flex justify-between items-center mb-16 md:mb-24 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-1.5 group cursor-default">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" transform="rotate(15)" className="text-white">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 4a4 4 0 0 1 3.995 3.8l.005 .2a1 1 0 0 1 .428 .096l3.033 -1.938a1 1 0 1 1 1.078 1.684l-3.015 1.931a7.17 7.17 0 0 1 .476 2.227h3a1 1 0 0 1 0 2h-3v1a6.01 6.01 0 0 1 -.195 1.525l2.708 1.616a1 1 0 1 1 -1.026 1.718l-2.514 -1.501a6.002 6.002 0 0 1 -3.973 2.56v-5.918a1 1 0 0 0 -2 0v5.917a6.002 6.002 0 0 1 -3.973 -2.56l-2.514 1.503a1 1 0 1 1 -1.026 -1.718l2.708 -1.616a6.01 6.01 0 0 1 -.195 -1.526v-1h-3a1 1 0 0 1 0 -2h3.001v-.055a7 7 0 0 1 .474 -2.173l-3.014 -1.93a1 1 0 1 1 1.078 -1.684l3.032 1.939l.024 -.012l.068 -.027l.019 -.005l.016 -.006l.032 -.008l.04 -.013l.034 -.007l.034 -.004l.045 -.008l.015 -.001l.015 -.002l.087 -.004a4 4 0 0 1 4 -4zm0 2a2 2 0 0 0 -2 2h4a2 2 0 0 0 -2 -2z" />
              </svg>
            </div>
            <span className="font-bold text-2xl tracking-tight text-white group-hover:tracking-wide transition-all duration-300">Kreeate</span>
          </div>
          {session && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-medium text-white">{session.user?.name}</span>
                  {session.user?.email && (
                    <span className="text-xs text-white/40 truncate max-w-[150px]">
                      {session.user.email}
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="secondary"
                size="sm"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 whitespace-nowrap"
              >
                Sign out
              </Button>
            </div>
          )}
        </nav>

        {!session ? (
          <>
            <div className="text-center max-w-4xl mx-auto space-y-8 mb-32 md:mb-40">
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.9] text-white">
                  Writing issues<br />
                  <span className="text-white/50">sucks.</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/60 max-w-xl mx-auto leading-relaxed font-medium">
                  Describe it in plain English. <br />
                  Get a perfectly formatted bug report or feature request. <br />
                  <span className="text-white/40 underline decoration-white/20 underline-offset-4">No more templates.</span>
                </p>
              </div>

              <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in duration-1000 delay-200 fill-mode-both pt-8">
                <SignInButton />
                <p className="mt-6 text-xs text-white/40 font-mono uppercase tracking-widest opacity-60">
                  Free Forever • No Signup • GitHub Only
                </p>
              </div>
            </div>

            <div className="w-full grid md:grid-cols-3 gap-6 mb-32">
              <div className="group p-10 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
                <svg className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <h3 className="text-2xl font-bold mb-3">AI-Powered</h3>
                <p className="text-white/60">Just describe what you want. Our AI formats it perfectly for GitHub.</p>
              </div>
              <div className="group p-10 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
                <svg className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="text-2xl font-bold mb-3">Save Hours</h3>
                <p className="text-white/60">Stop wrestling with markdown. Generate complete issues in seconds.</p>
              </div>
              <div className="group p-10 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors">
                <svg className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <h3 className="text-2xl font-bold mb-3">GitHub Native</h3>
                <p className="text-white/60">Direct integration with your repositories. No setup required.</p>
              </div>
            </div>
          </>
        ) : (
          <>
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
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  openAccordion.includes("review")
                    ? "bg-white/10 text-white/80 border border-white/20"
                    : "bg-white/5 text-white/40 border border-white/5"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    openAccordion.includes("review") ? "bg-white" : "bg-white/30"
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
                onValueChange={setOpenAccordion}
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
                    <Textarea
                      placeholder="Describe the bug or feature request in plain English..."
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value)
                        setIsSubmitted(false)
                      }}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault()
                          if (!isGenerating && input.trim()) {
                            generateIssue()
                          }
                        }
                      }}
                      rows={5}
                      className="mb-4 text-base bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/10 rounded-xl"
                    />
                    <Button
                      onClick={generateIssue}
                      disabled={isGenerating || !input.trim()}
                      className="w-full bg-white text-black hover:bg-white/90 font-semibold"
                    >
                      {isGenerating && <IconLoader2 className="mr-2 animate-spin" />}
                      {isGenerating ? "Generating..." : "Generate Issue"} <kbd className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">⌘ + Enter</kbd>
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
                        onChange={(e) => setTitle(e.target.value)}
                        className="mb-4 text-base bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/10 rounded-xl h-12 px-4"
                      />
                      <Textarea
                        placeholder="Issue description"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={6}
                        className="mb-4 text-base bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/10 rounded-xl"
                      />
                      <div className="mb-4">
                        <RepoSelector
                          value={selectedRepo}
                          onChange={setSelectedRepo}
                          lastRepo={lastRepo}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-2 block text-white/70">Priority</label>
                        <Select value={selectedLabel} onValueChange={(value) => value && setSelectedLabel(value)}>
                          <SelectTrigger className="w-full bg-white/10 border-white/10 text-white rounded-xl h-12 px-4">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-white/10 text-white">
                            {PRIORITY_LABELS.map((label) => (
                              <SelectItem key={label.value} value={label.value}>
                                {label.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={submitIssue}
                        disabled={isSubmitting || !title.trim() || !body.trim() || !selectedRepo}
                        className="w-full bg-white text-black hover:bg-white/90 font-semibold"
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
            </div>
          </>
        )}

        <footer className="mt-20 w-full text-center py-12 border-t border-white/5">
          <p className="text-white/40 text-sm">© 2026 Kreeate. Made for developers.</p>
        </footer>
      </div>
    </div>
  )
}
