import { describe, expect, test, vi } from "vitest"
import { checkRateLimit } from "@/lib/rate-limit"

describe("checkRateLimit", () => {
  test("allows requests under the limit", () => {
    const key = `rate-limit-allow-${Date.now()}`

    const first = checkRateLimit({ key, limit: 2, windowMs: 60_000 })
    const second = checkRateLimit({ key, limit: 2, windowMs: 60_000 })

    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(1)
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(0)
  })

  test("blocks once the limit is reached", () => {
    const key = `rate-limit-block-${Date.now()}`

    checkRateLimit({ key, limit: 1, windowMs: 60_000 })
    const blocked = checkRateLimit({ key, limit: 1, windowMs: 60_000 })

    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  test("resets after the time window passes", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-02-11T00:00:00.000Z"))

    const key = "rate-limit-window-reset"
    checkRateLimit({ key, limit: 1, windowMs: 1_000 })

    const blocked = checkRateLimit({ key, limit: 1, windowMs: 1_000 })
    expect(blocked.allowed).toBe(false)

    vi.setSystemTime(new Date("2026-02-11T00:00:01.100Z"))
    const allowedAgain = checkRateLimit({ key, limit: 1, windowMs: 1_000 })

    expect(allowedAgain.allowed).toBe(true)
    expect(allowedAgain.remaining).toBe(0)

    vi.useRealTimers()
  })
})
