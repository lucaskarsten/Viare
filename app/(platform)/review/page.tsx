import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ReviewClient from "@/components/ReviewClient";

const COURSE_COLORS = ["#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e", "#a65d4a"];

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

  const courses = enrollments.map((e, i) => {
    const total = e.course.modules.flatMap((m) => m.lessons).length;
    const due = Math.max(1, Math.floor(total * 0.3));
    const overdue = Math.floor(due * 0.3);
    const learning = Math.floor(due * 0.4);
    const newCards = due - overdue - learning;
    const color = COURSE_COLORS[i % COURSE_COLORS.length];
    const cards = e.course.modules
      .flatMap((m) => m.lessons.map((l) => ({ q: l.title, a: m.title, tag: "conceito", course: e.courseId })))
      .slice(0, 20);

    return {
      id: e.courseId,
      name: e.course.title,
      color,
      due,
      total: Math.max(total, due),
      new: Math.max(0, newCards),
      learning,
      overdue,
      cards,
    };
  });

  const totalDue = courses.reduce((s, c) => s + c.due, 0);
  const totalOverdue = courses.reduce((s, c) => s + c.overdue, 0);
  const streak = 0;

  const schedule = [
    { label: "Hoje", count: totalDue, hot: true },
    { label: "Amanhã", count: 9 },
    { label: "Qua", count: 14 },
    { label: "Qui", count: 7 },
    { label: "Sex", count: 11 },
    { label: "Sáb", count: 5 },
    { label: "Dom", count: 8 },
  ];

  const message =
    totalOverdue > 0
      ? `${totalOverdue} estão atrasados — revise primeiro para não cascatear.`
      : "10 minutos por dia constantes mantêm o que você aprendeu no lugar.";

  return (
    <ReviewClient
      courses={courses}
      totalDue={totalDue}
      totalOverdue={totalOverdue}
      streak={streak}
      schedule={schedule}
      message={message}
    />
  );
}
