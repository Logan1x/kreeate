import type { IssueType } from "@/components/home/types"

export const PRIORITY_LABELS = [
  { value: "P0-Unbreak Now", label: "P0", color: "bg-red-500", description: "Unbreak Now" },
  { value: "P1-Must Have", label: "P1", color: "bg-orange-500", description: "Must Have" },
  { value: "P2-Normal", label: "P2", color: "bg-yellow-500", description: "Normal" },
  { value: "P3-Low Priority", label: "P3", color: "bg-blue-500", description: "Low Priority" },
] as const

export const ISSUE_TYPE_PRESETS: Array<{ value: IssueType; label: string }> = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "task", label: "Task" },
]

export const LOCAL_SELECTED_REPO_KEY = "kreeate:selected-repo"
