import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import GeneratingClient from "./GeneratingClient";

type Params = Promise<{ slug: string }>;

export default async function GeneratingPage({ params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

  if (!course) notFound();

  const isCreator = course.createdById === session.user.id;
  if (!isCreator) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      select: { id: true },
    });
    if (!enrollment) notFound();
  }

  if (course.status === "PUBLISHED") redirect(`/courses/${slug}`);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const completedLessons = allLessons.filter((l) => l.content !== null);
  const lastCompleted = completedLessons.at(-1);

  return (
    <GeneratingClient
      slug={slug}
      initialData={{
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
            hasContent: l.content !== null,
          })),
        })),
        totalLessons: allLessons.length,
        completedLessons: completedLessons.length,
        firstLessonId: allLessons[0]?.id ?? null,
        previewLesson: lastCompleted
          ? {
              id: lastCompleted.id,
              title: lastCompleted.title,
              contentPreview: lastCompleted.content!.slice(0, 800),
            }
          : null,
      }}
    />
  );
}
