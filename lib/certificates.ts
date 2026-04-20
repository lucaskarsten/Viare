import { db } from "@/lib/db";

// RULE: CERT-01 — Certificado só é emitido para enrollment COMPLETED; idempotente
export async function issueCertificate(enrollmentId: string) {
  const existing = await db.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return existing;

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: { select: { name: true } },
      course: { select: { id: true, title: true, estimatedHours: true } },
    },
  });

  if (!enrollment || enrollment.status !== "COMPLETED") {
    throw new Error("Enrollment not completed");
  }

  return db.certificate.create({
    data: {
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      enrollmentId,
      userNameSnapshot: enrollment.user.name ?? "Estudante",
      courseTitleSnapshot: enrollment.course.title,
      hoursSnapshot: enrollment.course.estimatedHours ?? 4,
    },
  });
}
