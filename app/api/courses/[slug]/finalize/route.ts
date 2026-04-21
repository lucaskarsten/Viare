import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";

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

  const notReadyCount = await db.lesson.count({
    where: { courseId: course.id, lessonGenerationStatus: { not: "READY" } },
  });
  if (notReadyCount > 0) {
    return Response.json(
      { ok: false, reason: "lessons_not_ready", notReadyCount },
      { status: 409 }
    );
  }

  await db.course.update({
    where: { id: course.id },
    data: { finalizedAt: new Date(), status: "PUBLISHED" },
  });

  return Response.json({ ok: true });
}
