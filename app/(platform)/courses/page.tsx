import { db } from "@/lib/db";
import { PLATFORM_LANGUAGES } from "@/lib/catalog";
import CatalogClient from "./CatalogClient";

export default async function CoursesPage() {
  const raw = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ avgRating: "desc" }, { totalEnrollments: "desc" }],
    take: 100,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      difficulty: true,
      estimatedHours: true,
      totalEnrollments: true,
      avgRating: true,
      totalRatings: true,
      category: true,
      modules: {
        select: {
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  const courses = raw.map(({ modules, ...c }) => ({
    ...c,
    lessonCount: modules.reduce((s, m) => s + m._count.lessons, 0),
  }));

  return (
    <div className="flex flex-col gap-14 pb-20">
      <CatalogClient courses={courses} languageCount={PLATFORM_LANGUAGES} />
    </div>
  );
}
