export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false

  const configuredAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  if (configuredAdmins.length === 0) {
    return process.env.NODE_ENV !== "production"
  }

  return configuredAdmins.includes(email.toLowerCase())
}
