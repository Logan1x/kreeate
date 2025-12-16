"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader2 } from "@tabler/icons-react"

const PRIORITY_LABELS = [
  { value: "P0-Unbreak Now", label: "P0-Unbreak Now" },
  { value: "P1-Must Have", label: "P1-Must Have" },
  { value: "P2-Normal", label: "P2-Normal" },
  { value: "P3-Low Priority", label: "P3-Low Priority" },
] as const

export default function Home() {
  const [input, setInput] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedLabel, setSelectedLabel] = useState("P2-Normal")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | React.ReactNode>("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")

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
      setBody(data.body)
      setMessage("Issue generated successfully!")
      setMessageType("success")
    } catch (error) {
      console.error(error)
      setMessage("Failed to generate issue. Please try again.")
      setMessageType("error")
    } finally {
      setIsGenerating(false)
    }
  }

  const submitIssue = async () => {
    if (!title.trim() || !body.trim()) return

    setIsSubmitting(true)
    setMessage("")

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, label: selectedLabel }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit issue")
      }

      const data = await response.json()
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
      // Reset form
      setInput("")
      setTitle("")
      setBody("")
      setSelectedLabel("P2-Normal")
    } catch (error) {
      console.error(error)
      setMessage("Failed to submit issue. Please try again.")
      setMessageType("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Bug Report / Feature Request</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Describe your issue</CardTitle>
          <CardDescription>
            Provide a detailed description of the bug or feature request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your bug report or feature request..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="mb-4"
          />
          <Button onClick={generateIssue} disabled={isGenerating || !input.trim()}>
            {isGenerating && <IconLoader2 className="mr-2 animate-spin" />}
            {isGenerating ? "Generating..." : "Generate Issue"}
          </Button>
        </CardContent>
      </Card>

      {(title || body) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Review and Edit</CardTitle>
            <CardDescription>
              Review the generated title and description, then edit as needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-4"
            />
            <Textarea
              placeholder="Issue description"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="mb-4"
            />
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={selectedLabel} onValueChange={(value) => value && setSelectedLabel(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              disabled={isSubmitting || !title.trim() || !body.trim()}
            >
              {isSubmitting && <IconLoader2 className="mr-2 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit Issue"}
            </Button>
          </CardContent>
        </Card>
      )}

      {message && (
        <Alert variant={messageType === "error" ? "destructive" : "default"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}