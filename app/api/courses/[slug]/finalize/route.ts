import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { classifyGeneratedContent } from "@/lib/content-safety";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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
    select: { id: true, createdById: true, finalizedAt: true },
  });
  if (!course) return new Response("Not found", { status: 404 });
  if (!isInternalTrigger && course.createdById !== session!.user!.id) {
    return new Response("Forbidden", { status: 403 });
  }

  if (course.finalizedAt) {
    return Response.json({ ok: true, alreadyFinalized: true });
  }

  const notDoneCount = await db.lesson.count({
    where: { courseId: course.id, lessonGenerationStatus: { not: "DONE" } },
  });
  if (notDoneCount > 0) {
    return Response.json({ ok: false, reason: "lessons_not_done", notDoneCount }, { status: 409 });
  }

  // RULE: CONTENT-03 — content safety pass before publish
  const lessons = await db.lesson.findMany({
    where: { courseId: course.id },
    select: { id: true, content: true },
  });

  const violations = lessons.flatMap((l) => {
    if (!l.content) return [];
    const result = classifyGeneratedContent(l.content);
    return result.verdict !== "clean" ? [{ id: l.id, verdict: result.verdict }] : [];
  });

  if (violations.length > 0) {
    await Promise.all(
      violations.map(({ id, verdict }) =>
        db.lesson.update({
          where: { id },
          data: { lastGenerationError: `content_safety_${verdict}` },
        })
      )
    );
    return Response.json(
      {
        ok: false,
        reason: "content_safety_blocked",
        blockedLessonIds: violations.map((v) => v.id),
      },
      { status: 422 }
    );
  }

  await db.course.update({
    where: { id: course.id },
    data: { finalizedAt: new Date(), status: "PUBLISHED" },
  });

  return Response.json({ ok: true });
}
