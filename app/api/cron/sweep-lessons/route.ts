import { db } from "@/lib/db";
import { after } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const STALE_CLAIM_MS = 3 * 60 * 1000; // 3 min — claim older than this is reclaimed
const THROTTLE_WINDOW_MS = 90 * 1000; // 90 s — skip course if client is actively generating

export async function GET(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tickStart = Date.now();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const courses = await db.course.findMany({
    where: { finalizedAt: null, status: "GENERATING" },
    select: { id: true, slug: true },
  });
  if (courses.length === 0) {
    console.info(
      "[CRON_SWEEP]",
      JSON.stringify({ early_exit: true, cron_tick_duration_ms: Date.now() - tickStart })
    );
    return Response.json({ ok: true, early_exit: true });
  }

  const staleThreshold = new Date(Date.now() - STALE_CLAIM_MS);
  const throttleThreshold = new Date(Date.now() - THROTTLE_WINDOW_MS);

  let stuckCount = 0;
  const triggerUrls: string[] = [];
  const finalizeUrls: string[] = [];

  for (const course of courses) {
    // 1. Reclaim stale GENERATING claims (claimedAt older than 3 min)
    const reclaimed = await db.$executeRaw`
      UPDATE "Lesson"
      SET "lessonGenerationStatus" = 'PENDING'::"LessonGenerationStatus",
          "claimedAt" = NULL
      WHERE "courseId" = ${course.id}
        AND "lessonGenerationStatus" = 'GENERATING'::"LessonGenerationStatus"
        AND "claimedAt" < ${staleThreshold}
    `;
    stuckCount += Number(reclaimed);

    // 2. Retire exhausted lessons first so the reconcile reflects their removal
    await db.$executeRaw`
      UPDATE "Lesson"
      SET "lessonGenerationStatus" = 'FAILED'::"LessonGenerationStatus",
          "lastGenerationError" = 'max_attempts_exceeded'
      WHERE "courseId" = ${course.id}
        AND "lessonGenerationStatus" IN ('PENDING'::"LessonGenerationStatus", 'GENERATING'::"LessonGenerationStatus")
        AND "generationAttempts" >= 3
    `;

    // 3. Reconcile advisory counter AFTER reclaim + retire for an accurate active count
    await db.$executeRaw`
      UPDATE "Course"
      SET "generatingLessonCount" = (
        SELECT count(*)::int FROM "Lesson"
        WHERE "courseId" = ${course.id}
          AND "lessonGenerationStatus" = 'GENERATING'::"LessonGenerationStatus"
      )
      WHERE id = ${course.id}
    `;

    // Reload course after reconciliation
    const updated = await db.course.findUnique({
      where: { id: course.id },
      select: { generatingLessonCount: true },
    });
    if (!updated) continue;

    const activeCount = updated.generatingLessonCount;

    // 4. Self-throttle: if slots are busy and recently claimed, client is still working — skip
    if (activeCount > 0) {
      const recentClaim = await db.lesson.findFirst({
        where: {
          courseId: course.id,
          lessonGenerationStatus: "GENERATING",
          claimedAt: { gte: throttleThreshold },
        },
        select: { id: true },
      });
      if (recentClaim) continue;
    }

    // 5. Pick up PENDING lessons up to the 2-slot cap
    const slots = 2 - activeCount;
    if (slots > 0) {
      const pending = await db.lesson.findMany({
        where: { courseId: course.id, lessonGenerationStatus: "PENDING" },
        select: { id: true },
        orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
        take: slots,
      });
      for (const lesson of pending) {
        triggerUrls.push(`${baseUrl}/api/courses/${course.slug}/lessons/${lesson.id}/generate`);
      }
    }

    // 6. Auto-finalize when every lesson is READY
    const notReadyCount = await db.lesson.count({
      where: { courseId: course.id, lessonGenerationStatus: { not: "READY" } },
    });
    if (notReadyCount === 0) {
      finalizeUrls.push(`${baseUrl}/api/courses/${course.slug}/finalize`);
    } else {
      // All-FAILED terminal state: no PENDING/GENERATING lessons remain but some are FAILED.
      // Nothing can recover without user retry — revert to DRAFT per COURSE-05.
      const activeRemaining = await db.lesson.count({
        where: { courseId: course.id, lessonGenerationStatus: { in: ["PENDING", "GENERATING"] } },
      });
      if (activeRemaining === 0) {
        await db.course.update({
          where: { id: course.id },
          data: { status: "DRAFT", generatingLessonCount: 0 },
        });
      }
    }
  }

  // Fire all triggers after this response is sent.
  // AbortSignal.timeout(2000) initiates the request without blocking on the 90s generation response.
  const allTriggers = [...triggerUrls, ...finalizeUrls];
  if (allTriggers.length > 0) {
    after(async () => {
      await Promise.allSettled(
        allTriggers.map((url) =>
          fetch(url, {
            method: "POST",
            headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
            signal: AbortSignal.timeout(2_000),
          }).catch(() => {})
        )
      );
    });
  }

  const metrics = {
    cron_tick_duration_ms: Date.now() - tickStart,
    claimedAt_stuck_count: stuckCount,
    generate_triggers_fired: triggerUrls.length,
    finalize_triggers_fired: finalizeUrls.length,
    courses_processed: courses.length,
  };

  console.info("[CRON_SWEEP]", JSON.stringify(metrics));

  return Response.json({ ok: true, metrics });
}
