import { z } from "zod";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { validateFlag } from "@/lib/lab";
import { forwardOnlyPercent } from "@/lib/progress";

const SubmitSchema = z.object({
  flag: z.string().min(1),
  lessonId: z.string().min(1),
  courseId: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: Promise<{ labId: string }> }) {
  // RULE: AUTH-01 — userId from session only
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { labId } = await params;
  const body = await req.json();
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid body", { status: 400 });

  const { flag, lessonId, courseId } = parsed.data;

  // RULE: LAB-01 — flagHash fetched server-side, never returned
  const lab = await db.lab.findUnique({
    where: { id: labId },
    select: { flagHash: true, type: true },
  });
  if (!lab) return new Response("Lab not found", { status: 404 });

  // RULE: LAB-04 — INTERACTIVE labs use /complete, not /submit
  if (lab.type === "INTERACTIVE") {
    return Response.json({ error: "Use /complete for interactive labs" }, { status: 400 });
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!enrollment) return new Response("Not enrolled", { status: 403 });

  // RULE: LAB-03 — flag validation required before marking complete
  const correct = await validateFlag(flag, lab.flagHash);

  await db.labAttempt.create({
    data: { userId: session.user.id, labId, isCorrect: correct },
  });

  const attempts = await db.labAttempt.count({
    where: { userId: session.user.id, labId },
  });

  if (correct) {
    await db.userProgress.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
      create: { userId: session.user.id, lessonId, status: "COMPLETED", completedAt: new Date() },
      update: { status: "COMPLETED", completedAt: new Date() },
    });

    const [totalLessons, completedLessons] = await Promise.all([
      db.lesson.count({ where: { module: { courseId } } }),
      db.userProgress.count({
        where: { userId: session.user.id, status: "COMPLETED", lesson: { module: { courseId } } },
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
  }

  return Response.json({ correct, attempts });
}
