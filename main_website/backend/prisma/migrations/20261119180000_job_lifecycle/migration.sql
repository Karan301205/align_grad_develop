-- Job lifecycle and job credits (2026-11-19).
-- Company.jobsPosted counts job/internship posts so closing or deleting a job never returns a credit.
-- Job.expiresAt = createdAt + activeDays (default 30); archivedAt / retainedAt are set by the retention task.
-- Adds columns and an index, then fills them for existing rows. No row is deleted.

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "jobsPosted" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "archivedAt" TIMESTAMPTZ(3),
ADD COLUMN     "expiresAt" TIMESTAMPTZ(3),
ADD COLUMN     "retainedAt" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "Job_expiresAt_idx" ON "Job"("expiresAt");


-- Backfill: when each existing job expires.
UPDATE "Job" SET "expiresAt" = "createdAt" + make_interval(days => COALESCE("activeDays", 30)) WHERE "expiresAt" IS NULL;

-- Backfill: job/internship posts each company has made (gigs excluded, as the credit check always did).
UPDATE "Company" c SET "jobsPosted" = (
  SELECT count(*)::int FROM "Job" j
   WHERE j."companyId" = c."id" AND (j."opportunityType" IS NULL OR j."opportunityType" <> 'GIG')
);
