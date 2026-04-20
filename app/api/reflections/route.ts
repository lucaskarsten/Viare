import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { z } from "zod";

const PostBodySchema = z.object({
  lessonId: z.string().min(1),
  content: z.string(),
});

export async function POST(request: Request) {
  // RULE: AUTH-01 — identidade sempre via auth()
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const parsed = PostBodySchema.safeParse(await request.json());
  if (!parsed.success) return new Response("Invalid body", { status: 400 });
  const { lessonId, content } = parsed.data;

  // RULE: PROG-04 — reflection requires min 50 chars to count as completion
  if (content.trim().length < 50) {
    return new Response("Reflection too short", { status: 400 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return new Response("Lesson not found", { status: 404 });

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: lesson.module.courseId },
    },
  });
  if (!enrollment) return new Response("Not enrolled", { status: 403 });

  const now = new Date();
  await db.reflectionResponse.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: { userId: session.user.id, lessonId, content },
    update: { content, updatedAt: now },
  });

  await db.userProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: { userId: session.user.id, lessonId, status: "COMPLETED", completedAt: now },
    update: { status: "COMPLETED", completedAt: now },
  });

  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  // RULE: AUTH-01 — identidade sempre via auth()
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lessonId");
  if (!lessonId) return new Response("Missing lessonId", { status: 400 });

  // RULE: AUTH-03 — userId always in where clause
  const reflection = await db.reflectionResponse.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    select: { content: true },
  });

  return Response.json({ content: reflection?.content ?? null });
}
