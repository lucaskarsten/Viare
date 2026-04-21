import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import CourseCertificate from "@/components/CourseCertificate";

export const runtime = "nodejs";

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const course = await db.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      status: true,
      estimatedHours: true,
      modules: { select: { lessons: { select: { id: true } } } },
    },
  });
  if (!course || course.status !== "PUBLISHED") {
    return new Response("Not found", { status: 404 });
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  const [enrollment, completedCount, user] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      select: { updatedAt: true },
    }),
    db.userProgress.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        lesson: { module: { courseId: course.id } },
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
  ]);

  if (!enrollment || completedCount < totalLessons) {
    return new Response("Course not completed", { status: 403 });
  }

  const userName = user?.name ?? user?.email ?? "Aluno";
  const completionDate = enrollment.updatedAt;
  const estimatedHours =
    course.estimatedHours ?? Math.max(1, Math.round((totalLessons * 12) / 60));

  const buffer = await renderToBuffer(
    <CourseCertificate
      userName={userName}
      courseTitle={course.title}
      completionDate={completionDate}
      estimatedHours={estimatedHours}
    />
  );

  const safeSlug = slug.slice(0, 50);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${safeSlug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
