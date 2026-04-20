import { auth } from "@/lib/dev-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import SidebarView from "@/components/layout/SidebarView";
import SidebarSheet from "@/components/layout/SidebarSheet";
import MobileTopBar from "@/components/layout/MobileTopBar";
import GlobalSearch from "@/components/GlobalSearch";
import { getSidebarData } from "@/lib/sidebar-data";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sidebarData = await getSidebarData(session.user);

  const searchCourses = await db.course.findMany({
    where: { status: "PUBLISHED", maturityRating: "GENERAL" },
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

  const desktopSidebarClass =
    "hidden md:flex sticky top-0 h-screen overflow-y-auto flex-col gap-5 bg-card border-r border-border px-[18px] py-6";
  const mobileSidebarClass = "flex h-full flex-col gap-5 px-[18px] py-6";

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[256px_1fr]">
      <SidebarView {...sidebarData} className={desktopSidebarClass} />
      <SidebarSheet>
        <SidebarView {...sidebarData} className={mobileSidebarClass} />
      </SidebarSheet>
      <div className="flex flex-col min-w-0">
        <MobileTopBar />
        <main className="px-4 sm:px-6 md:px-12 lg:px-16 pt-4 md:pt-12 pb-16 md:pb-24 w-full max-w-full md:max-w-[1200px]">
          {children}
        </main>
      </div>
      <GlobalSearch courses={courses} />
    </div>
  );
}
