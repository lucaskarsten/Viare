import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { lessonId } = await request.json();
  if (!lessonId) return new Response("Invalid lessonId", { status: 400 });

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return new Response("Lesson not found", { status: 404 });

  const courseId = lesson.module.courseId;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!enrollment) return new Response("Not enrolled", { status: 403 });

  // Upsert progress
  await db.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: { userId: session.user.id, lessonId, status: "COMPLETED", completedAt: new Date() },
    update: { status: "COMPLETED", completedAt: new Date() },
  });

  // Recalculate enrollment progress %
  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({ where: { module: { courseId } } }),
    db.userProgress.count({
      where: { userId: session.user.id, status: "COMPLETED", lesson: { module: { courseId } } },
    }),
  ]);

  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const status = progressPercent === 100 ? "COMPLETED" : "IN_PROGRESS";

  await db.enrollment.update({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    data: { progressPercent, status, lastAccessedAt: new Date() },
  });

  return Response.json({ progressPercent });
}
