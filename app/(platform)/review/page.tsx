import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ReviewClient from "@/components/ReviewClient";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const enrollments = await db.enrollment.findMany({
    where: { userId: session.user.id, status: { not: "ABANDONED" } },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: { select: { id: true, title: true }, orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { lastAccessedAt: "desc" },
  });

  const reviewData = enrollments.map((e) => ({
    courseId: e.courseId,
    courseTitle: e.course.title,
    courseSlug: e.course.slug,
    progressPercent: e.progressPercent ?? 0,
    dueCount: Math.max(1, Math.floor((e.progressPercent ?? 0) * 0.3)),
    cards: e.course.modules
      .flatMap((m) => m.lessons.map((l) => ({ front: l.title, back: m.title })))
      .slice(0, 20),
  }));

  return <ReviewClient courses={reviewData} />;
}
