import { pgTable, text, primaryKey, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: integer("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)

// Custom table for storing user preferences
export const userPreferences = pgTable("user_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  lastRepoOwner: text("lastRepoOwner"),
  lastRepoName: text("lastRepoName"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
})

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: text("eventType").notNull(),
    status: text("status").notNull(),
    sessionId: text("sessionId"),
    repoOwner: text("repoOwner"),
    repoName: text("repoName"),
    label: text("label"),
    latencyMs: integer("latencyMs"),
    errorCode: text("errorCode"),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurredAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userOccurredIdx: index("analytics_events_user_occurred_idx").on(table.userId, table.occurredAt),
    typeOccurredIdx: index("analytics_events_type_occurred_idx").on(table.eventType, table.occurredAt),
    statusOccurredIdx: index("analytics_events_status_occurred_idx").on(table.status, table.occurredAt),
  })
)

export const issueContentLogs = pgTable(
  "issue_content_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generationRequestId: text("generationRequestId"),
    repoOwner: text("repoOwner"),
    repoName: text("repoName"),
    label: text("label"),
    rawInput: text("rawInput"),
    generatedTitle: text("generatedTitle"),
    generatedBody: text("generatedBody"),
    finalTitle: text("finalTitle"),
    finalBody: text("finalBody"),
    rawInputLength: integer("rawInputLength"),
    generatedBodyLength: integer("generatedBodyLength"),
    finalBodyLength: integer("finalBodyLength"),
    issueUrl: text("issueUrl"),
    issueNumber: integer("issueNumber"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index("issue_content_logs_user_created_idx").on(table.userId, table.createdAt),
    generationRequestIdx: index("issue_content_logs_generation_request_idx").on(table.generationRequestId),
    repoCreatedIdx: index("issue_content_logs_repo_created_idx").on(table.repoOwner, table.repoName, table.createdAt),
  })
)
