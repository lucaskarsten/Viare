import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) return new Response("Invalid courseId", { status: 400 });

  const course = await db.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!course) return new Response("Course not found", { status: 404 });

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (existing) return Response.json({ enrolled: true });

  await db.$transaction([
    db.enrollment.create({ data: { userId: session.user.id, courseId } }),
    db.course.update({
      where: { id: courseId },
      data: { totalEnrollments: { increment: 1 } },
    }),
  ]);

  return Response.json({ enrolled: true });
}
