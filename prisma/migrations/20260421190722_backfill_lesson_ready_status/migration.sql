-- Backfill: lessons in finalized courses that are DONE become READY
UPDATE "Lesson"
SET "lessonGenerationStatus" = 'READY'::"LessonGenerationStatus"
WHERE "courseId" IN (SELECT id FROM "Course" WHERE "finalizedAt" IS NOT NULL)
  AND "lessonGenerationStatus" = 'DONE'::"LessonGenerationStatus";