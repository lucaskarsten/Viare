import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { generateSingleLesson } from "@/lib/generation";
import { classifyGeneratedContent } from "@/lib/content-safety";
import { LESSON_GENERATION_CAP } from "@/lib/generation-config";
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
      labVariant: true,
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
        lessonGenerationStatus: "READY",
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
      WHERE id = ${courseId} AND "generatingLessonCount" < ${LESSON_GENERATION_CAP}
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
      labVariant: (lesson.labVariant as "CTF" | "INTERACTIVE" | undefined) ?? undefined,
      lessonOrdinal,
    });

    // RULE: CS-01 — classify inline; clean→READY, blocked→FAILED; exceptions rethrow into catch
    const generated = await db.lesson.findUnique({
      where: { id: lessonId },
      select: { content: true },
    });
    const classifyResult = classifyGeneratedContent(generated?.content ?? "");
    const isSafe = classifyResult.verdict === "clean";

    await db.lesson.update({
      where: { id: lessonId },
      data: {
        lessonGenerationStatus: isSafe ? "READY" : "FAILED",
        claimedAt: null,
        lastGenerationError: isSafe ? null : `content_safety_${classifyResult.verdict}`,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
    });

    // Lightweight next-lesson trigger — fires after this response is sent.
    // Cron sweeper (Phase 2) is the mandatory safety net if this fails silently.
    after(async () => {
      if (!process.env.CRON_SECRET) {
        console.error(
          "[LESSON_CHAIN_BROKEN] CRON_SECRET is not set — next-lesson trigger will fail. Set CRON_SECRET in environment variables."
        );
        return;
      }
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ??
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

        // Re-read active count after the finally block has already decremented it.
        // Fill all open slots so a single completion unblocks as many pending lessons as possible.
        const course = await db.course.findUnique({
          where: { id: courseId },
          select: { generatingLessonCount: true },
        });
        const active = course?.generatingLessonCount ?? 0;
        const slots = LESSON_GENERATION_CAP - active;
        if (slots <= 0) return;

        const pending = await db.lesson.findMany({
          where: { courseId, lessonGenerationStatus: "PENDING" },
          select: { id: true },
          orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
          take: slots,
        });
        if (pending.length === 0) return;

        await Promise.allSettled(
          pending.map((l) =>
            fetch(`${baseUrl}/api/courses/${slug}/lessons/${l.id}/generate`, {
              method: "POST",
              headers: { authorization: `Bearer ${process.env.CRON_SECRET!}` },
            }).then((res) => {
              if (!res.ok)
                console.error(
                  "[LESSON_CHAIN_FAILED]",
                  JSON.stringify({ lessonId: l.id, status: res.status })
                );
            })
          )
        );
      } catch (e) {
        console.error("[LESSON_CHAIN_ERROR]", String(e));
      }
    });

    return Response.json({ status: "done" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isEmptyToolInput = message.startsWith("[EMPTY_TOOL_INPUT]");
    const exhausted = !isEmptyToolInput && generationAttempts >= 3;

    await db.lesson.update({
      where: { id: lessonId },
      data: {
        lessonGenerationStatus: exhausted ? "FAILED" : "PENDING",
        claimedAt: null,
        lastGenerationError: message,
        // Don't charge the attempt quota for empty tool inputs — model didn't really try.
        ...(isEmptyToolInput ? { generationAttempts: { decrement: 1 } } : {}),
      },
    });

    console.error(
      "[LESSON_GENERATE_ERROR]",
      JSON.stringify({
        lessonId,
        courseId,
        attempt: generationAttempts,
        exhausted,
        isEmptyToolInput,
        message,
      })
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
