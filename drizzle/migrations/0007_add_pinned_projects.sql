ALTER TABLE "user_preferences"
ADD COLUMN IF NOT EXISTS "pinnedProjects" jsonb DEFAULT '[]'::jsonb NOT NULL;
