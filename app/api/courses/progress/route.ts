import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateFlashcards as generateFlashcardsSpec } from "@/lib/prompts/specs/flashcards";
import { issueCertificate } from "@/lib/certificates";
import { forwardOnlyPercent } from "@/lib/progress";
import { canConsume } from "@/lib/access/lesson-gate";

const BodySchema = z.object({ lessonId: z.string() });

async function generateFlashcards(
  lessonId: string,
  userId: string,
  content: string,
  language: string
) {
  const existing = await db.reviewCard.count({ where: { lessonId, userId } });
  if (existing > 0) return;

  try {
    const cards = await generateFlashcardsSpec({
      lessonContent: content,
      language,
    });
    await db.reviewCard.createMany({
      data: cards.map((c) => ({ userId, lessonId, front: c.front, back: c.back })),
      skipDuplicates: true,
    });
  } catch {
    // non-blocking — do not propagate
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) return new Response("Invalid lessonId", { status: 400 });
  const { lessonId } = parsed.data;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      type: true,
      content: true,
      lessonGenerationStatus: true,
      module: {
        select: { courseId: true, course: { select: { language: true } } },
      },
    },
  });
  if (!lesson) return new Response("Lesson not found", { status: 404 });

  // RULE: AG-01 — progress writes gated on per-lesson READY status
  if (!canConsume(lesson)) {
    return Response.json({ reason: "lesson_not_ready" }, { status: 403 });
  }

  const courseId = lesson.module.courseId;
  const language = lesson.module.course.language ?? "pt";

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (!enrollment) return new Response("Not enrolled", { status: 403 });

  await db.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: { userId: session.user.id, lessonId, status: "COMPLETED", completedAt: new Date() },
    update: { status: "COMPLETED", completedAt: new Date() },
  });

  if (lesson.type === "THEORY" && lesson.content) {
    void generateFlashcards(lessonId, session.user.id, lesson.content, language);
  }

  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({ where: { module: { courseId }, lessonGenerationStatus: "READY" } }),
    db.userProgress.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        lesson: { module: { courseId }, lessonGenerationStatus: "READY" },
      },
    }),
  ]);

  const newPercent =
    totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  // RULE: PROG-01 — forward-only progress
  const progressPercent = forwardOnlyPercent(enrollment.progressPercent, newPercent);
  const status = progressPercent === 100 ? "COMPLETED" : "IN_PROGRESS";

  const updatedEnrollment = await db.enrollment.update({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    data: { progressPercent, status, lastAccessedAt: new Date() },
  });

  // RULE: CERT-01 — emitir certificado automaticamente ao completar curso
  if (status === "COMPLETED") {
    after(async () => {
      try {
        await issueCertificate(updatedEnrollment.id);
        revalidatePath("/certificates");
      } catch (e) {
        console.error("[cert-issue]", e);
      }
    });
  }

  return Response.json({ progressPercent });
}
