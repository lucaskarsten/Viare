import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const dev = await db.user.findUnique({ where: { id: "dev-preview-user" } });
  const streak = await db.userStreak.findUnique({ where: { userId: "dev-preview-user" } });
  const enrollments = await db.enrollment.findMany({
    where: { userId: "dev-preview-user" },
    include: {
      course: { select: { slug: true, title: true, _count: { select: { modules: true } } } },
    },
    orderBy: { lastAccessedAt: "desc" },
  });

  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  startOfWeek.setDate(now.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
  startOfWeek.setHours(0, 0, 0, 0);

  const completedTotal = await db.userProgress.count({
    where: { userId: "dev-preview-user", status: "COMPLETED" },
  });
  const completedThisWeek = await db.userProgress.count({
    where: { userId: "dev-preview-user", status: "COMPLETED", updatedAt: { gte: startOfWeek } },
  });
  const courseCount = await db.course.count({ where: { status: "PUBLISHED" } });
  const totalEnrollmentsAllCourses = await db.course.aggregate({
    where: { status: "PUBLISHED" },
    _sum: { totalEnrollments: true },
  });

  console.log("USER:", dev?.name, dev?.email, dev?.id);
  console.log("STREAK:", streak?.currentStreak, "/ record", streak?.longestStreak);
  console.log("COURSES PUBLISHED:", courseCount);
  console.log("TOTAL ENROLLMENTS (sum):", totalEnrollmentsAllCourses._sum.totalEnrollments);
  console.log("COMPLETED TOTAL:", completedTotal, "(% 7 =", completedTotal % 7, ")");
  console.log("COMPLETED THIS WEEK:", completedThisWeek, "(expected 4)");
  console.log("ENROLLMENTS:");
  for (const e of enrollments) {
    console.log(
      `  · ${e.course.title.padEnd(24)} ${e.progressPercent}% · modules=${e.course._count.modules} · last=${e.lastAccessedAt?.toISOString().slice(0, 10)}`
    );
  }
}

main().finally(() => db.$disconnect());
