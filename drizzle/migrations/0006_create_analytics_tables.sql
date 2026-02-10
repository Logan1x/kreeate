CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "eventType" text NOT NULL,
  "status" text NOT NULL,
  "sessionId" text,
  "repoOwner" text,
  "repoName" text,
  "label" text,
  "latencyMs" integer,
  "errorCode" text,
  "metadata" jsonb,
  "occurredAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "analytics_events_user_occurred_idx"
  ON "analytics_events" ("userId", "occurredAt");
CREATE INDEX IF NOT EXISTS "analytics_events_type_occurred_idx"
  ON "analytics_events" ("eventType", "occurredAt");
CREATE INDEX IF NOT EXISTS "analytics_events_status_occurred_idx"
  ON "analytics_events" ("status", "occurredAt");

CREATE TABLE IF NOT EXISTS "issue_content_logs" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "generationRequestId" text,
  "repoOwner" text,
  "repoName" text,
  "label" text,
  "rawInput" text,
  "generatedTitle" text,
  "generatedBody" text,
  "finalTitle" text,
  "finalBody" text,
  "rawInputLength" integer,
  "generatedBodyLength" integer,
  "finalBodyLength" integer,
  "issueUrl" text,
  "issueNumber" integer,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "issue_content_logs_user_created_idx"
  ON "issue_content_logs" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "issue_content_logs_generation_request_idx"
  ON "issue_content_logs" ("generationRequestId");
CREATE INDEX IF NOT EXISTS "issue_content_logs_repo_created_idx"
  ON "issue_content_logs" ("repoOwner", "repoName", "createdAt");
