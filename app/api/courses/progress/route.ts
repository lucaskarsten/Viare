import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateFlashcards as generateFlashcardsSpec } from "@/lib/prompts/specs/flashcards";

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
      module: { select: { courseId: true, course: { select: { language: true } } } },
    },
  });
  if (!lesson) return new Response("Lesson not found", { status: 404 });

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
    db.lesson.count({ where: { module: { courseId } } }),
    db.userProgress.count({
      where: { userId: session.user.id, status: "COMPLETED", lesson: { module: { courseId } } },
    }),
  ]);

  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const status = progressPercent === 100 ? "COMPLETED" : "IN_PROGRESS";

  await db.enrollment.update({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    data: { progressPercent, status, lastAccessedAt: new Date() },
  });

  return Response.json({ progressPercent });
}
