import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Sidebar from "@/components/layout/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const searchCourses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      modules: {
        select: {
          title: true,
          _count: { select: { lessons: true } },
          lessons: {
            select: { id: true, title: true, type: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const courses = searchCourses.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    moduleCount: c.modules.length,
    lessonCount: c.modules.reduce((s, m) => s + m._count.lessons, 0),
    lessons: c.modules.flatMap((m) =>
      m.lessons.map((l) => ({ id: l.id, title: l.title, moduleTitle: m.title, type: l.type }))
    ),
  }));

  return (
    <div className="platform-grid grid grid-cols-[256px_1fr] min-h-screen bg-background">
      <Sidebar user={session.user} />
      <main className="overflow-y-auto">{children}</main>
      <GlobalSearch courses={courses} />
    </div>
  );
}
