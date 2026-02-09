import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

interface GitHubUserResponse {
  login: string
}

interface GitHubSearchIssueItem {
  id: number
  number: number
  title: string
  html_url: string
  state: "open" | "closed"
  created_at: string
  repository_url: string
  pull_request?: unknown
}

interface GitHubSearchIssuesResponse {
  items: GitHubSearchIssueItem[]
}

const MAX_RECENT_ISSUES = 12

export async function GET() {
  try {
    const session = await auth()

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "User-Agent": "Kreeate-Issue-Generator",
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Failed to identify GitHub user" }, { status: userResponse.status })
    }

    const user = (await userResponse.json()) as GitHubUserResponse
    const query = encodeURIComponent(`is:issue author:${user.login} sort:created-desc`)

    const issuesResponse = await fetch(
      `https://api.github.com/search/issues?q=${query}&per_page=${MAX_RECENT_ISSUES}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "User-Agent": "Kreeate-Issue-Generator",
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!issuesResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch recent issues" }, { status: issuesResponse.status })
    }

    const data = (await issuesResponse.json()) as GitHubSearchIssuesResponse

    const issues = data.items
      .filter((item) => !item.pull_request)
      .map((item) => {
        const repoFullName = item.repository_url.split("/repos/")[1] ?? ""

        return {
          id: item.id,
          number: item.number,
          title: item.title,
          url: item.html_url,
          state: item.state,
          createdAt: item.created_at,
          repoFullName,
        }
      })

    return NextResponse.json({ issues })
  } catch (error) {
    console.error("Error fetching recent issues:", error)
    return NextResponse.json({ error: "Failed to fetch recent issues" }, { status: 500 })
  }
}
