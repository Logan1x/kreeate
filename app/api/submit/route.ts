import { NextResponse } from "next/server"
import { z } from "zod"

// Schema for validating the request body
const requestSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  body: z.string().min(1, "Body cannot be empty"),
  label: z.enum(["P0-Unbreak Now", "P1-Must Have", "P2-Normal", "P3-Low Priority"]),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { title, body, label } = requestSchema.parse(json)

    const githubToken = process.env.GITHUB_TOKEN
    const githubOwner = process.env.GITHUB_OWNER
    const githubRepo = process.env.GITHUB_REPO

    if (!githubToken || !githubOwner || !githubRepo) {
      throw new Error("GitHub configuration missing")
    }

    // First check if the repository exists and is accessible
    const repoCheckResponse = await fetch(
      `https://api.github.com/repos/${githubOwner}/${githubRepo}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          "User-Agent": "Issue-Generator-App",
        },
      }
    )

    if (!repoCheckResponse.ok) {
      if (repoCheckResponse.status === 404) {
        throw new Error(`Repository '${githubOwner}/${githubRepo}' not found. Check the owner and repository names.`)
      } else if (repoCheckResponse.status === 403) {
        throw new Error("Cannot access repository. Check your GitHub token permissions.")
      } else {
        throw new Error(`Cannot access repository: ${repoCheckResponse.statusText}`)
      }
    }

    const response = await fetch(
      `https://api.github.com/repos/${githubOwner}/${githubRepo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          "User-Agent": "Issue-Generator-App",
        },
        body: JSON.stringify({
          title,
          body,
          labels: [label], // include the selected priority label
          assignees: [], // hardcoded assignees
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("GitHub API error details:", errorData)

      if (response.status === 403) {
        throw new Error("GitHub API Forbidden: Check your token permissions. Make sure it has 'repo' or 'public_repo' scope for the target repository.")
      } else if (response.status === 404) {
        throw new Error("GitHub API Not Found: Check that the repository exists and the owner/repo names are correct.")
      } else if (response.status === 401) {
        throw new Error("GitHub API Unauthorized: Check that your token is valid and not expired.")
      } else {
        throw new Error(`GitHub API error (${response.status}): ${response.statusText}`)
      }
    }

    const issue = await response.json()

    return NextResponse.json({
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    })
  } catch (error) {
    console.error("Error submitting issue:", error)
    return NextResponse.json(
      { error: "Failed to submit issue" },
      { status: 500 }
    )
  }
}