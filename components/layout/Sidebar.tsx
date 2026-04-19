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
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22">
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="brand-word">
          <div className="brand-name">Viare</div>
          <div className="brand-sub">aprenda o que quiser, como quiser</div>
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
