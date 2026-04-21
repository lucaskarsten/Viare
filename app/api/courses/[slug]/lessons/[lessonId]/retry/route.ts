import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { after } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  const { slug, lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, createdById: true, status: true },
  });
  if (!course) return new Response("Not found", { status: 404 });
  if (course.createdById !== session.user.id) return new Response("Forbidden", { status: 403 });

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, lessonGenerationStatus: true },
  });
  if (!lesson) return new Response("Not found", { status: 404 });
  if (lesson.courseId !== course.id) return new Response("Forbidden", { status: 403 });

  if (lesson.lessonGenerationStatus !== "FAILED") {
    return Response.json({ reason: "not_failed" }, { status: 409 });
  }

  await db.lesson.update({
    where: { id: lessonId },
    data: { lessonGenerationStatus: "PENDING", generationAttempts: 0, lastGenerationError: null },
  });

  // Cron reverts all-FAILED courses to DRAFT (COURSE-05). Restore GENERATING so Cron picks it up.
  if (course.status === "DRAFT") {
    await db.course.update({
      where: { id: course.id },
      data: { status: "GENERATING" },
    });
  }

  after(async () => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      await fetch(`${baseUrl}/api/courses/${slug}/lessons/${lessonId}/generate`, {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
      });
    } catch {
      // cron picks up within 2 min
    }
  });

  return Response.json({ ok: true });
}
