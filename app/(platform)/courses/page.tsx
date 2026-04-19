import { db } from "@/lib/db";
import CatalogClient from "./CatalogClient";

export default async function CoursesPage() {
  const dbCourses = await db.course.findMany({
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
    },
  });

  return (
    <div className="page catalog">
      <CatalogClient dbCourses={dbCourses} />
    </div>
  );
}
