export interface ProjectBoardStats {
  total: number
  pending: number
  assignedToViewer: number
  done: number
}

export interface SavedProjectBoardCard {
  owner: string
  number: number
  ownerType: "user" | "org"
  title: string
  url: string
  stats: ProjectBoardStats
  lastUpdatedAt: string | null
  hasAccess: boolean
  error: string | null
}

export interface ProjectBoardItem {
  id: string
  title: string
  url: string
  status: string
  statusType: "done" | "in_progress" | "todo" | "unknown"
  isPending: boolean
  isAssignedToViewer: boolean
  assignees: Array<{ login: string; avatarUrl: string }>
  repoFullName: string | null
  contentType: "issue" | "pull_request" | "draft"
  state: string | null
  updatedAt: string | null
}

export interface ProjectBoard {
  id: string
  title: string
  url: string
  owner: string
  number: number
  ownerType: "user" | "org"
  viewerLogin: string
  stats: ProjectBoardStats
  items: ProjectBoardItem[]
}
