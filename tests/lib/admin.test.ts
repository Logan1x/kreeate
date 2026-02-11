import { afterEach, describe, expect, test } from "vitest"
import { isAdminEmail } from "@/lib/admin"

const originalAdminEmails = process.env.ADMIN_EMAILS
const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.ADMIN_EMAILS = originalAdminEmails
  ;(process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
})

describe("isAdminEmail", () => {
  test("allows configured admin email", () => {
    process.env.ADMIN_EMAILS = "admin@example.com,owner@example.com"
    ;(process.env as Record<string, string | undefined>).NODE_ENV = "production"

    expect(isAdminEmail("owner@example.com")).toBe(true)
  })

  test("denies non-admin when allowlist is set", () => {
    process.env.ADMIN_EMAILS = "admin@example.com"
    ;(process.env as Record<string, string | undefined>).NODE_ENV = "production"

    expect(isAdminEmail("user@example.com")).toBe(false)
  })

  test("allows in non-production when no admins are configured", () => {
    process.env.ADMIN_EMAILS = ""
    ;(process.env as Record<string, string | undefined>).NODE_ENV = "development"

    expect(isAdminEmail("anyone@example.com")).toBe(true)
  })

  test("denies in production when no admins are configured", () => {
    process.env.ADMIN_EMAILS = ""
    ;(process.env as Record<string, string | undefined>).NODE_ENV = "production"

    expect(isAdminEmail("admin@example.com")).toBe(false)
  })
})
