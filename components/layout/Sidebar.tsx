import { db } from "@/lib/db";
import SidebarNav from "./SidebarNav";

type SidebarUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default async function Sidebar({ user }: { user: SidebarUser }) {
  const userId = user?.id ?? undefined;

  const [streakData, enrollments, enrollmentCount, catalogCount] = await Promise.all([
    userId
      ? db.userStreak.findUnique({ where: { userId }, select: { currentStreak: true } })
      : null,
    userId
      ? db.enrollment.findMany({
          where: { userId, status: { not: "ABANDONED" } },
          orderBy: { lastAccessedAt: "desc" },
          take: 5,
          include: { course: { select: { slug: true, title: true } } },
        })
      : [],
    userId
      ? db.enrollment.count({ where: { userId, status: { not: "ABANDONED" } } })
      : 0,
    db.course.count({ where: { status: "PUBLISHED" } }),
  ]);

  const currentStreak = streakData?.currentStreak ?? 0;

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto flex flex-col gap-5 bg-card border-r border-border px-[18px] py-6">
      <div className="flex items-center gap-2.5 px-1.5">
        <div className="text-accent flex" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22">
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div>
          <div className="text-base font-semibold leading-none tracking-tight text-foreground">Viare</div>
          <div className="text-[11px] text-muted-foreground tracking-[0.02em] mt-0.5">aprenda o que quiser, como quiser</div>
        </div>
      </div>

      <SidebarNav
        enrollments={enrollments}
        currentStreak={currentStreak}
        user={user}
        enrollmentCount={enrollmentCount}
        catalogCount={catalogCount}
      />
    </aside>
  );
}
