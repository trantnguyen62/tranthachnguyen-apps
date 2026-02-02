-- Add monorepo support fields to Project table
-- Run on LXC 203: psql -U cloudify -d cloudify -f add_monorepo_support.sql

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "monorepoTool" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "monorepoPackage" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "Project"."monorepoTool" IS 'Monorepo tool: turborepo, nx, lerna, pnpm, yarn, npm';
COMMENT ON COLUMN "Project"."monorepoPackage" IS 'Package name within monorepo (for filtering builds)';
