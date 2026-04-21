import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";
import { canConsume } from "@/lib/access/lesson-gate";

type Params = Promise<{ lessonId: string }>;

const BodySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedIndex: z.number().int().min(0).max(3),
    })
  ),
});

export async function POST(request: Request, { params }: { params: Params }) {
  const { lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  // RULE: AG-02 — quiz completion gated on per-lesson READY status
  const lessonForGate = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { lessonGenerationStatus: true },
  });
  if (!lessonForGate) return new Response("Not found", { status: 404 });
  if (!canConsume(lessonForGate)) {
    return Response.json({ reason: "lesson_not_ready" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid body", { status: 400 });
  const { answers } = parsed.data;

  const questions = await db.quizQuestion.findMany({
    where: { lessonId },
    orderBy: { order: "asc" },
    select: { id: true, correctIndex: true, explanation: true },
  });

  if (questions.length === 0) {
    return new Response("No questions found for this lesson", { status: 400 });
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  let score = 0;
  const scoredAnswers = answers.map((a) => {
    const q = questionMap.get(a.questionId);
    const correct = q ? a.selectedIndex === q.correctIndex : false;
    if (correct) score++;
    return {
      questionId: a.questionId,
      selectedIndex: a.selectedIndex,
      correct,
      correctIndex: q?.correctIndex ?? null,
      explanation: q?.explanation ?? null,
    };
  });

  const total = questions.length;
  const pct = Math.round((score / total) * 100);

  await db.quizAttempt.create({
    data: {
      userId: session.user.id,
      lessonId,
      score,
      total,
      answers: scoredAnswers,
    },
  });

  await db.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: { userId: session.user.id, lessonId, status: "COMPLETED", completedAt: new Date() },
    update: { status: "COMPLETED", completedAt: new Date() },
  });

  return NextResponse.json({ score, total, pct, answers: scoredAnswers });
}
