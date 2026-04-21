-- Migration: lesson_chunked_generation
-- Adds per-lesson generation tracking and per-course finalization gate.
-- All changes are additive (backward-compatible rollback: drop columns, leave enum in place).
--
-- NOTE: LessonGenerationStatus enum is never removed even on rollback.
-- Postgres ALTER TYPE ... DROP VALUE is version-gated and unreliable.

-- CreateEnum
CREATE TYPE "LessonGenerationStatus" AS ENUM ('PENDING', 'GENERATING', 'DONE', 'FAILED');

-- AlterTable: Lesson — generation tracking fields
ALTER TABLE "Lesson"
  ADD COLUMN "courseId"               TEXT,
  ADD COLUMN "lessonGenerationStatus" "LessonGenerationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "claimedAt"              TIMESTAMP(3),
  ADD COLUMN "generationAttempts"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastGenerationError"    TEXT,
  ADD COLUMN "idempotencyKey"         TEXT;

-- AlterTable: Course — mutex counter and finalization gate
ALTER TABLE "Course"
  ADD COLUMN "generatingLessonCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "finalizedAt"           TIMESTAMP(3);

-- CreateIndex: composite index for Cron sweeper queries
CREATE INDEX "Lesson_courseId_lessonGenerationStatus_idx"
  ON "Lesson"("courseId", "lessonGenerationStatus");

-- CreateUniqueIndex: idempotency key dedup
CREATE UNIQUE INDEX "Lesson_idempotencyKey_key"
  ON "Lesson"("idempotencyKey");

-- ── Backfill ─────────────────────────────────────────────────────────────────

-- 1. Set courseId on all existing lessons (denormalized from Module.courseId)
UPDATE "Lesson" l
SET "courseId" = m."courseId"
FROM "Module" m
WHERE l."moduleId" = m."id";

-- 2. Mark lessons with content as DONE (already generated)
UPDATE "Lesson"
SET "lessonGenerationStatus" = 'DONE'
WHERE "content" IS NOT NULL;

-- 3. Set finalizedAt on all already-published courses
--    Using NOW() since we have no publishedAt column; published courses
--    are immediately consumable so any past timestamp is valid.
UPDATE "Course"
SET "finalizedAt" = NOW()
WHERE "status" = 'PUBLISHED';
