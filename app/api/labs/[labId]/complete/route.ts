import { revalidatePath } from "next/cache";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { forwardOnlyPercent } from "@/lib/progress";
import { canConsume } from "@/lib/access/lesson-gate";

export async function POST(req: Request, { params }: { params: Promise<{ labId: string }> }) {
  // RULE: AUTH-01 — userId from session only
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { labId } = await params;

  const lab = await db.lab.findUnique({
    where: { id: labId },
    select: {
      id: true,
      lessonId: true,
      type: true,
      lesson: {
        select: {
          module: {
            select: {
              course: {
                select: { slug: true, id: true, finalizedAt: true },
              },
            },
          },
        },
      },
    },
  });
  if (!lab) return new Response("Lab not found", { status: 404 });

  // RULE: LAB-04 — INTERACTIVE completion via self-declaration, no flag
  if (lab.type !== "INTERACTIVE") {
    return Response.json(
      { error: "CTF labs use /submit with flag, not /complete" },
      { status: 400 }
    );
  }

  const courseId = lab.lesson.module.course.id;
  const courseSlug = lab.lesson.module.course.slug;

  // RULE: LAB-01 — interactive lab completion blocked until course finalizes
  if (!canConsume(lab.lesson.module.course)) {
    return Response.json({ reason: "course_not_finalized" }, { status: 409 });
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!enrollment) return new Response("Not enrolled", { status: 403 });

  await db.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: lab.lessonId } },
    create: {
      userId: session.user.id,
      lessonId: lab.lessonId,
      status: "COMPLETED",
      completedAt: new Date(),
    },
    update: { status: "COMPLETED", completedAt: new Date() },
  });

  console.info("[LAB_COMPLETE_INTERACTIVE]", { labId, userId: session.user.id });

  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({ where: { module: { courseId } } }),
    db.userProgress.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        lesson: { module: { courseId } },
      },
    }),
  ]);

  const newPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  // RULE: PROG-01 — forward-only progress
  const progressPercent = forwardOnlyPercent(enrollment.progressPercent, newPercent);
  const status = progressPercent === 100 ? "COMPLETED" : "IN_PROGRESS";

  await db.enrollment.update({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    data: { progressPercent, status, lastAccessedAt: new Date() },
  });

  revalidatePath(`/courses/${courseSlug}`);

  return Response.json({ completed: true, progressPercent });
}
