import { beforeEach, describe, expect, test, vi } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  createIssueContentLog: vi.fn(),
  attachSubmitDataToIssueContentLog: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      userPreferences: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = {
      completions: {
        create: vi.fn(),
      },
    }
  },
}))

import { auth } from "@/lib/auth"
import { POST as generateIssue } from "@/app/api/generate/route"
import { POST as submitIssue } from "@/app/api/submit/route"

const mockedAuth = auth as unknown as {
  mockReset: () => void
  mockImplementation: (fn: () => Promise<null>) => void
}

describe("API auth guards", () => {
  beforeEach(() => {
    mockedAuth.mockReset()
  })

  test("returns 401 for unauthenticated /api/generate", async () => {
    mockedAuth.mockImplementation(async () => null)

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "broken login", issueType: "bug" }),
    })

    const response = await generateIssue(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toMatch(/Unauthorized/i)
  })

  test("returns 401 for unauthenticated /api/submit", async () => {
    mockedAuth.mockImplementation(async () => null)

    const request = new Request("http://localhost/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test issue",
        body: "Issue body",
        label: "P2-Normal",
        repoOwner: "owner",
        repoName: "repo",
      }),
    })

    const response = await submitIssue(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toMatch(/Unauthorized/i)
  })
})
