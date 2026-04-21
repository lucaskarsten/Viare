import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { generateSingleLesson } from "@/lib/generation";
import { after } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  const { slug, lessonId } = await params;

  // Accept user session OR internal trigger (after() / Cron sweeper)
  const authHeader = req.headers.get("authorization");
  const isInternalTrigger =
    !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  let session: Awaited<ReturnType<typeof auth>> | null = null;
  if (!isInternalTrigger) {
    session = await auth();
    if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  }

  const course = await db.course.findUnique({
    where: { slug },
    select: {
      id: true,
      createdById: true,
      language: true,
      generationPrompt: true,
      title: true,
      maturityRating: true,
    },
  });

  if (!course) return new Response("Not found", { status: 404 });
  if (!isInternalTrigger && course.createdById !== session!.user!.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      type: true,
      courseId: true,
      module: { select: { title: true, order: true } },
    },
  });

  if (!lesson) return new Response("Not found", { status: 404 });
  if (lesson.courseId !== course.id) return new Response("Forbidden", { status: 403 });

  const courseId = course.id;

  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const existing = await db.lesson.findFirst({
      where: {
        idempotencyKey,
        lessonGenerationStatus: "DONE",
        updatedAt: { gte: new Date(Date.now() - 60_000) },
      },
      select: { id: true },
    });
    if (existing) {
      return Response.json({ status: "already_done", cached: true });
    }
  }

  // Atomic claim: lock course row (FOR UPDATE), claim lesson, increment advisory mutex counter.
  // The FOR UPDATE on Course prevents two concurrent transactions from both passing
  // the generatingLessonCount < 2 check (eliminates TOCTOU race).
  type ClaimOutcome =
    | { success: false; reason: "mutex_full" | "already_claimed" }
    | { success: true; generationAttempts: number };

  const claimResult: ClaimOutcome = await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Course"
      WHERE id = ${courseId} AND "generatingLessonCount" < 2
      FOR UPDATE
    `;
    if (locked.length === 0) {
      return { success: false as const, reason: "mutex_full" as const };
    }

    const claimed = await tx.$queryRaw<Array<{ generationAttempts: number }>>`
      UPDATE "Lesson"
      SET "lessonGenerationStatus" = 'GENERATING'::"LessonGenerationStatus",
          "claimedAt" = NOW(),
          "generationAttempts" = "generationAttempts" + 1
      WHERE id = ${lessonId}
        AND "lessonGenerationStatus" IN ('PENDING'::"LessonGenerationStatus", 'FAILED'::"LessonGenerationStatus")
        AND "generationAttempts" < 3
      RETURNING "generationAttempts"
    `;
    if (claimed.length === 0) {
      return { success: false as const, reason: "already_claimed" as const };
    }

    await tx.$executeRaw`
      UPDATE "Course"
      SET "generatingLessonCount" = "generatingLessonCount" + 1
      WHERE id = ${courseId}
    `;

    return {
      success: true as const,
      generationAttempts: Number(claimed[0].generationAttempts),
    };
  });

  if (!claimResult.success) {
    return Response.json({ reason: claimResult.reason }, { status: 409 });
  }

  const { generationAttempts } = claimResult;

  // Resolve lesson ordinal for THEORY opener-mode rotation — RULE: AI-08
  const allLessons = await db.lesson.findMany({
    where: { courseId },
    select: { id: true },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });
  const lessonOrdinal = Math.max(
    0,
    allLessons.findIndex((l) => l.id === lessonId)
  );

  const language = course.language ?? "pt";
  const topic = course.generationPrompt?.split("\n")[0] ?? course.title;

  try {
    await generateSingleLesson({
      lessonId,
      lessonType: lesson.type,
      language,
      topic,
      moduleTitle: lesson.module.title,
      lessonTitle: lesson.title,
      maturityRating: course.maturityRating as "GENERAL" | "MATURE",
      lessonOrdinal,
    });

    await db.lesson.update({
      where: { id: lessonId },
      data: {
        lessonGenerationStatus: "DONE",
        claimedAt: null,
        lastGenerationError: null,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
    });

    // Lightweight next-lesson trigger — fires after this response is sent.
    // Cron sweeper (Phase 2) is the mandatory safety net if this fails silently.
    after(async () => {
      try {
        const next = await db.lesson.findFirst({
          where: { courseId, lessonGenerationStatus: "PENDING" },
          select: { id: true },
          orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
        });
        if (!next) return;

        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ??
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

        await fetch(`${baseUrl}/api/courses/${slug}/lessons/${next.id}/generate`, {
          method: "POST",
          headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
        });
      } catch {
        // Cron sweeper reclaims any missed lessons within 2 min
      }
    });

    return Response.json({ status: "done" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const exhausted = generationAttempts >= 3;

    await db.lesson.update({
      where: { id: lessonId },
      data: {
        lessonGenerationStatus: exhausted ? "FAILED" : "PENDING",
        claimedAt: null,
        lastGenerationError: message,
      },
    });

    console.error(
      "[LESSON_GENERATE_ERROR]",
      JSON.stringify({ lessonId, courseId, attempt: generationAttempts, exhausted, message })
    );

    return Response.json(
      { status: exhausted ? "failed" : "retryable", error: message },
      { status: 500 }
    );
  } finally {
    // RULE: LG-01 — always decrement the advisory mutex counter, clamped to ≥ 0
    await db.$executeRaw`
      UPDATE "Course"
      SET "generatingLessonCount" = GREATEST("generatingLessonCount" - 1, 0)
      WHERE id = ${courseId}
    `.catch((e: unknown) => {
      console.error(
        "[LESSON_MUTEX_DECREMENT_FAILED]",
        JSON.stringify({ courseId, lessonId, error: String(e) })
      );
    });
  }
}
