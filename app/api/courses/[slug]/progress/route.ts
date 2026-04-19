import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              slug: true,
              title: true,
              type: true,
              order: true,
              content: true,
            },
          },
        },
      },
    },
  });

  if (!course) return new Response("Not found", { status: 404 });

  const isCreator = course.createdById === session.user.id;
  if (!isCreator) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      select: { id: true },
    });
    if (!enrollment) return new Response("Forbidden", { status: 403 });
  }

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.content !== null).length;
  const lastCompletedLesson = allLessons.filter((l) => l.content !== null).at(-1);
  const firstLessonId = allLessons[0]?.id ?? null;

  return NextResponse.json({
    status: course.status,
    title: course.title,
    description: course.description,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        type: l.type,
        order: l.order,
        hasContent: l.content !== null,
      })),
    })),
    totalLessons,
    completedLessons,
    firstLessonId,
    previewLesson: lastCompletedLesson
      ? {
          id: lastCompletedLesson.id,
          title: lastCompletedLesson.title,
          contentPreview: lastCompletedLesson.content!.slice(0, 800),
        }
      : null,
  });
}
