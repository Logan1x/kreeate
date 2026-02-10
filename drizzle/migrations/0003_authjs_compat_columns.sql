ALTER TABLE "session"
ADD COLUMN IF NOT EXISTS "sessionToken" text,
ADD COLUMN IF NOT EXISTS "userId" text,
ADD COLUMN IF NOT EXISTS "expires" timestamp;

UPDATE "session"
SET
  "sessionToken" = COALESCE("sessionToken", token),
  "userId" = COALESCE("userId", user_id),
  "expires" = COALESCE("expires", expires_at);

ALTER TABLE "account"
ADD COLUMN IF NOT EXISTS "userId" text,
ADD COLUMN IF NOT EXISTS "type" text,
ADD COLUMN IF NOT EXISTS provider text,
ADD COLUMN IF NOT EXISTS "providerAccountId" text,
ADD COLUMN IF NOT EXISTS "token_type" text,
ADD COLUMN IF NOT EXISTS "session_state" text;

UPDATE "account"
SET
  "userId" = COALESCE("userId", user_id),
  type = COALESCE(type, 'oauth'),
  provider = COALESCE(provider, provider_id),
  "providerAccountId" = COALESCE("providerAccountId", account_id),
  "token_type" = COALESCE("token_type", NULL),
  "session_state" = COALESCE("session_state", NULL);

ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "emailVerified" timestamp;

CREATE INDEX IF NOT EXISTS "session_sessionToken_idx" ON "session" ("sessionToken");
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_provider_providerAccountId_idx" ON "account" (provider, "providerAccountId");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
