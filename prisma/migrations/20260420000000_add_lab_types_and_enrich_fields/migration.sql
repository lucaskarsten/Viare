-- CreateEnum
CREATE TYPE "LabType" AS ENUM ('CTF', 'INTERACTIVE');

-- AlterTable: Lab — add type, make flagHash nullable, add template/config fields
ALTER TABLE "Lab" ADD COLUMN "type" "LabType" NOT NULL DEFAULT 'CTF';
ALTER TABLE "Lab" ADD COLUMN "templateId" TEXT;
ALTER TABLE "Lab" ADD COLUMN "templateVersion" INTEGER;
ALTER TABLE "Lab" ADD COLUMN "config" JSONB;
ALTER TABLE "Lab" ALTER COLUMN "flagHash" DROP NOT NULL;

-- AlterTable: Enrollment — add baseLessonCount for enrich snapshot
ALTER TABLE "Enrollment" ADD COLUMN "baseLessonCount" INTEGER;

-- AlterTable: Course — add enrichCount counter
ALTER TABLE "Course" ADD COLUMN "enrichCount" INTEGER NOT NULL DEFAULT 0;

-- CHECK constraints enforcing type/flagHash invariants (RULE: LAB-05)
ALTER TABLE "Lab" ADD CONSTRAINT lab_ctf_requires_flag
  CHECK (type != 'CTF' OR "flagHash" IS NOT NULL);
ALTER TABLE "Lab" ADD CONSTRAINT lab_interactive_no_flag
  CHECK (type != 'INTERACTIVE' OR "flagHash" IS NULL);
