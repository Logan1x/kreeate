import { z } from "zod"

export const ownerTypeSchema = z.enum(["user", "org"])

export const pinnedProjectSchema = z.object({
  owner: z.string().trim().min(1),
  number: z.number().int().positive(),
  ownerType: ownerTypeSchema,
})

export type PinnedProject = z.infer<typeof pinnedProjectSchema>

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

export interface ProjectBoardData {
  id: string
  title: string
  url: string
  owner: string
  number: number
  ownerType: "user" | "org"
  viewerLogin: string
  stats: {
    total: number
    pending: number
    assignedToViewer: number
    done: number
  }
  items: ProjectBoardItem[]
}

export function normalizePinnedProjects(value: unknown): PinnedProject[] {
  if (!Array.isArray(value)) return []

  const parsed = value
    .map((entry) => pinnedProjectSchema.safeParse(entry))
    .filter((result) => result.success)
    .map((result) => result.data)

  const unique = new Map<string, PinnedProject>()
  for (const board of parsed) {
    unique.set(`${board.owner.toLowerCase()}#${board.number}`, board)
  }

  return Array.from(unique.values())
}

export function parseGitHubProjectUrl(value: string): PinnedProject {
  const raw = value.trim()
  const parsed = new URL(raw)

  if (parsed.hostname !== "github.com") {
    throw new Error("Only github.com project URLs are supported.")
  }

  const match = parsed.pathname.match(/^\/(users|orgs)\/([^/]+)\/projects\/(\d+)\/?$/i)
  if (!match) {
    throw new Error("Use a GitHub project URL like https://github.com/users/<owner>/projects/<number>.")
  }

  const [, ownerScope, owner, number] = match
  return {
    owner,
    number: Number(number),
    ownerType: ownerScope.toLowerCase() === "orgs" ? "org" : "user",
  }
}

const PROJECT_QUERY = `
query ProjectBoard($owner: String!, $number: Int!) {
  viewer {
    login
  }
  user(login: $owner) {
    projectV2(number: $number) {
      ...ProjectBoardFields
    }
  }
  organization(login: $owner) {
    projectV2(number: $number) {
      ...ProjectBoardFields
    }
  }
}

fragment ProjectBoardFields on ProjectV2 {
  id
  title
  url
  items(first: 100) {
    nodes {
      id
      isArchived
      fieldValues(first: 20) {
        nodes {
          __typename
          ... on ProjectV2ItemFieldSingleSelectValue {
            name
            optionId
            field {
              ... on ProjectV2SingleSelectField {
                name
              }
            }
          }
        }
      }
      content {
        __typename
        ... on Issue {
          title
          url
          state
          updatedAt
          repository {
            nameWithOwner
          }
          assignees(first: 10) {
            nodes {
              login
              avatarUrl
            }
          }
        }
        ... on PullRequest {
          title
          url
          state
          updatedAt
          repository {
            nameWithOwner
          }
          assignees(first: 10) {
            nodes {
              login
              avatarUrl
            }
          }
        }
        ... on DraftIssue {
          title
        }
      }
    }
  }
}
`

interface GitHubGraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

interface GraphQLProjectFieldValue {
  __typename?: string
  name?: string | null
  field?: { name?: string | null } | null
}

interface GraphQLProjectNode {
  id: string
  isArchived?: boolean
  fieldValues?: { nodes?: GraphQLProjectFieldValue[] | null } | null
  content?: {
    __typename?: string
    title?: string | null
    url?: string | null
    state?: string | null
    updatedAt?: string | null
    repository?: { nameWithOwner?: string | null } | null
    assignees?: { nodes?: Array<{ login?: string | null; avatarUrl?: string | null }> | null } | null
  } | null
}

interface GraphQLProjectResult {
  viewer?: { login?: string | null } | null
  user?: { projectV2?: { id: string; title: string; url: string; items?: { nodes?: GraphQLProjectNode[] | null } | null } | null } | null
  organization?: { projectV2?: { id: string; title: string; url: string; items?: { nodes?: GraphQLProjectNode[] | null } | null } | null } | null
}

async function queryGitHubGraphQL<T>(accessToken: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "User-Agent": "Kreeate-Issue-Generator",
    },
    cache: "no-store",
    body: JSON.stringify({ query, variables }),
  })

  const payload: GitHubGraphQLResponse<T> = await response.json().catch(() => ({}))

  if (!response.ok) {
    const detail = payload.errors?.map((entry) => entry.message).join("; ")
    throw new Error(detail || `GitHub GraphQL error: ${response.status}`)
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((entry) => entry.message).join("; "))
  }

  if (!payload.data) {
    throw new Error("GitHub GraphQL response did not include data.")
  }

  return payload.data
}

function deriveStatus(values: GraphQLProjectFieldValue[]): { status: string; statusType: ProjectBoardItem["statusType"] } {
  const statusField = values.find(
    (entry) =>
      entry.__typename === "ProjectV2ItemFieldSingleSelectValue" &&
      entry.field?.name?.trim().toLowerCase() === "status"
  )

  const status = statusField?.name?.trim() || "No status"
  const lower = status.toLowerCase()

  if (["done", "closed", "complete", "completed", "merged", "shipped"].some((token) => lower.includes(token))) {
    return { status, statusType: "done" }
  }
  if (["in progress", "active", "review", "blocked"].some((token) => lower.includes(token))) {
    return { status, statusType: "in_progress" }
  }
  if (["todo", "to do", "backlog", "ready", "next"].some((token) => lower.includes(token))) {
    return { status, statusType: "todo" }
  }

  return { status, statusType: "unknown" }
}

export async function fetchGitHubProjectBoard(
  accessToken: string,
  board: Pick<PinnedProject, "owner" | "number"> & Partial<Pick<PinnedProject, "ownerType">>
): Promise<ProjectBoardData> {
  const data = await queryGitHubGraphQL<GraphQLProjectResult>(accessToken, PROJECT_QUERY, {
    owner: board.owner,
    number: board.number,
  })

  const projectNode = data.user?.projectV2 || data.organization?.projectV2

  if (!projectNode) {
    throw new Error("Project board not found or access denied.")
  }

  const viewerLogin = data.viewer?.login || ""
  const ownerType: "user" | "org" = data.user?.projectV2 ? "user" : "org"
  const nodes = projectNode.items?.nodes || []

  const items = nodes.map<ProjectBoardItem>((node) => {
    const content = node.content
    const fieldValues = node.fieldValues?.nodes || []
    const { status, statusType } = deriveStatus(fieldValues)

    const assignees = (content?.assignees?.nodes || [])
      .map((entry) => ({
        login: entry.login || "",
        avatarUrl: entry.avatarUrl || "",
      }))
      .filter((entry) => entry.login.length > 0)

    const contentType: ProjectBoardItem["contentType"] =
      content?.__typename === "Issue" ? "issue" : content?.__typename === "PullRequest" ? "pull_request" : "draft"

    const state = content?.state || null
    const closedState = state === "CLOSED" || state === "MERGED"
    const pending = !node.isArchived && statusType !== "done" && !closedState
    const assignedToViewer = viewerLogin.length > 0 && assignees.some((entry) => entry.login.toLowerCase() === viewerLogin.toLowerCase())

    return {
      id: node.id,
      title: content?.title?.trim() || "Untitled",
      url: content?.url || projectNode.url,
      status,
      statusType,
      isPending: pending,
      isAssignedToViewer: assignedToViewer,
      assignees,
      repoFullName: content?.repository?.nameWithOwner || null,
      contentType,
      state,
      updatedAt: content?.updatedAt || null,
    }
  })

  const stats = {
    total: items.length,
    pending: items.filter((item) => item.isPending).length,
    assignedToViewer: items.filter((item) => item.isAssignedToViewer).length,
    done: items.filter((item) => item.statusType === "done").length,
  }

  return {
    id: projectNode.id,
    title: projectNode.title,
    url: projectNode.url,
    owner: board.owner,
    number: board.number,
    ownerType,
    viewerLogin,
    stats,
    items,
  }
}
