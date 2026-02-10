import type React from "react"

export interface RepoSelection {
  owner: string
  name: string
}

export interface RecentIssue {
  id: number
  number: number
  title: string
  url: string
  state: "open" | "closed"
  createdAt: string
  repoFullName: string
}

export type IssueType = "bug" | "feature" | "task"

export type MessageType = "success" | "error"

export type StatusMessage = string | React.ReactNode
