import { db } from "@/lib/db";
import FeedClient from "./FeedClient";

export default async function DiscoverPage() {
  const featuredCourses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { totalEnrollments: "desc" },
    take: 5,
    select: {
      id: true,
      slug: true,
      title: true,
      totalEnrollments: true,
    },
  });

  return <FeedClient featuredCourses={featuredCourses} />;
}
