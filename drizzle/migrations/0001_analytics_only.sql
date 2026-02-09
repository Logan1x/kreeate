-- Safe migration for existing databases where auth tables already exist.
-- This migration only creates analytics tables/indexes needed for Phase 1.

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
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

CREATE TABLE IF NOT EXISTS "issue_content_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'analytics_events_userId_user_id_fk'
  ) THEN
    ALTER TABLE "analytics_events"
      ADD CONSTRAINT "analytics_events_userId_user_id_fk"
      FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'issue_content_logs_userId_user_id_fk'
  ) THEN
    ALTER TABLE "issue_content_logs"
      ADD CONSTRAINT "issue_content_logs_userId_user_id_fk"
      FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "analytics_events_user_occurred_idx"
  ON "analytics_events" USING btree ("userId", "occurredAt");

CREATE INDEX IF NOT EXISTS "analytics_events_type_occurred_idx"
  ON "analytics_events" USING btree ("eventType", "occurredAt");

CREATE INDEX IF NOT EXISTS "analytics_events_status_occurred_idx"
  ON "analytics_events" USING btree ("status", "occurredAt");

CREATE INDEX IF NOT EXISTS "issue_content_logs_user_created_idx"
  ON "issue_content_logs" USING btree ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "issue_content_logs_generation_request_idx"
  ON "issue_content_logs" USING btree ("generationRequestId");

CREATE INDEX IF NOT EXISTS "issue_content_logs_repo_created_idx"
  ON "issue_content_logs" USING btree ("repoOwner", "repoName", "createdAt");
