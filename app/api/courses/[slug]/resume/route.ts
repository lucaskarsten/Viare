import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { LESSON_GENERATION_CAP } from "@/lib/generation-config";
import { after } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { slug } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, createdById: true, status: true, requiresReview: true },
  });

  if (!course) return new Response("Not found", { status: 404 });
  if (course.createdById !== session.user.id) return new Response("Forbidden", { status: 403 });

  const isResumable = course.status === "DRAFT" || course.status === "GENERATING";
  if (!isResumable) {
    return new Response("Course is not in a resumable state", { status: 409 });
  }

  // Reset course to GENERATING and clear advisory mutex (stuck GENERATING lessons abandoned)
  await db.course.update({
    where: { id: course.id },
    data: {
      status: "GENERATING",
      requiresReview: false,
      reviewReason: null,
      generatingLessonCount: 0,
    },
  });

  // Reset stuck/failed lessons so the chain can pick them up again.
  // Also reset generationAttempts so exhausted lessons get another shot on resume.
  await db.lesson.updateMany({
    where: {
      module: { courseId: course.id },
      lessonGenerationStatus: { in: ["FAILED", "GENERATING"] },
    },
    data: {
      lessonGenerationStatus: "PENDING",
      claimedAt: null,
      lastGenerationError: null,
      generationAttempts: 0,
    },
  });

  // Trigger the first pending lesson after this response is sent.
  // The after() chain in the generate route handles the rest.
  after(async () => {
    if (!process.env.CRON_SECRET) {
      console.error("[RESUME_CHAIN_BROKEN] CRON_SECRET is not set — lesson chain will not start.");
      return;
    }
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

      // Flood all slots immediately on resume so generation starts at full parallelism.
      const pending = await db.lesson.findMany({
        where: { module: { courseId: course.id }, lessonGenerationStatus: "PENDING" },
        select: { id: true },
        orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
        take: LESSON_GENERATION_CAP,
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
                "[RESUME_CHAIN_FAILED]",
                JSON.stringify({ lessonId: l.id, status: res.status })
              );
          })
        )
      );
    } catch (e) {
      console.error("[RESUME_CHAIN_ERROR]", String(e));
    }
  });

  return Response.json({ status: "resumed" });
}
