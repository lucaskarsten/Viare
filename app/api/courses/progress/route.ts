import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const BodySchema = z.object({ lessonId: z.string() });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FlashcardsSchema = z
  .array(z.object({ front: z.string().min(1), back: z.string().min(1) }))
  .min(1)
  .max(5);

function parseJson(raw: string): unknown {
  const clean = raw.startsWith("```") ? raw.replace(/```json?\n?|```/g, "") : raw;
  return JSON.parse(clean.trim());
}

async function generateFlashcards(lessonId: string, userId: string, content: string) {
  const existing = await db.reviewCard.count({ where: { lessonId, userId } });
  if (existing > 0) return;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Generate 3-5 flashcards from this lesson content. Return ONLY valid JSON array, no markdown:
[{ "front": "concept or question", "back": "concise answer or definition" }]

Lesson content:
${content.slice(0, 6000)}`,
        },
      ],
    });
    const raw = (res.content[0] as { text: string }).text.trim();
    const cards = FlashcardsSchema.parse(parseJson(raw));
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
    select: { id: true, type: true, content: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return new Response("Lesson not found", { status: 404 });

  const courseId = lesson.module.courseId;

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
    void generateFlashcards(lessonId, session.user.id, lesson.content);
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
