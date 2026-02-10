CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "account"
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE "session"
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE "account"
  ALTER COLUMN account_id DROP NOT NULL,
  ALTER COLUMN provider_id DROP NOT NULL,
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE "session"
  ALTER COLUMN token DROP NOT NULL,
  ALTER COLUMN expires_at DROP NOT NULL,
  ALTER COLUMN user_id DROP NOT NULL;
