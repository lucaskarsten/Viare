import { db } from "@/lib/db";

export type SidebarUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type SidebarData = {
  user: SidebarUser;
  enrollments: Array<{ id: string; course: { slug: string; title: string; status: string } }>;
  currentStreak: number;
  enrollmentCount: number;
  catalogCount: number;
  reviewCount: number;
  weeklyProgressCount: number;
};

export async function getSidebarData(user: SidebarUser): Promise<SidebarData> {
  const userId = user?.id ?? undefined;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const [streakData, enrollments, enrollmentCount, catalogCount, reviewCount, weeklyProgressCount] =
    await Promise.all([
      userId
        ? db.userStreak.findUnique({ where: { userId }, select: { currentStreak: true } })
        : null,
      userId
        ? db.enrollment.findMany({
            where: { userId, status: { not: "ABANDONED" } },
            orderBy: { lastAccessedAt: "desc" },
            take: 5,
            include: { course: { select: { slug: true, title: true, status: true } } },
          })
        : [],
      userId ? db.enrollment.count({ where: { userId, status: { not: "ABANDONED" } } }) : 0,
      db.course.count({ where: { status: "PUBLISHED" } }),
      userId ? db.userProgress.count({ where: { userId, status: "COMPLETED" } }) : 0,
      userId
        ? db.userProgress.count({
            where: { userId, status: "COMPLETED", updatedAt: { gte: startOfWeek } },
          })
        : 0,
    ]);

  return {
    user,
    enrollments: enrollments.map((e) => ({
      id: e.id,
      course: { slug: e.course.slug, title: e.course.title, status: e.course.status },
    })),
    currentStreak: streakData?.currentStreak ?? 0,
    enrollmentCount,
    catalogCount,
    reviewCount,
    weeklyProgressCount,
  };
}
