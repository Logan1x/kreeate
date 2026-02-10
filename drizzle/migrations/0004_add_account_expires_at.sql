ALTER TABLE "account"
ADD COLUMN IF NOT EXISTS "expires_at" integer;

UPDATE "account"
SET "expires_at" = COALESCE(
  "expires_at",
  CASE
    WHEN access_token_expires_at IS NOT NULL THEN EXTRACT(EPOCH FROM access_token_expires_at)::integer
    ELSE NULL
  END
);
