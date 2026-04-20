import { describe, it, expect, vi, beforeEach } from "vitest";
import { issueCertificate } from "@/lib/certificates";

vi.mock("@/lib/db", () => ({
  db: {
    certificate: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    enrollment: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";

const COMPLETED_ENROLLMENT = {
  id: "enrollment-1",
  userId: "user-1",
  courseId: "course-1",
  status: "COMPLETED",
  user: { name: "João Silva" },
  course: { id: "course-1", title: "TypeScript Avançado", estimatedHours: 8 },
};

describe("issueCertificate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CERT-02 — idempotência
  it("retorna certificado existente sem criar outro — CERT-02", async () => {
    const existing = { id: "cert-1", enrollmentId: "enrollment-1" };
    vi.mocked(db.certificate.findUnique).mockResolvedValue(existing as never);

    const result = await issueCertificate("enrollment-1");

    expect(result).toEqual(existing);
    expect(vi.mocked(db.certificate.create)).not.toHaveBeenCalled();
  });

  // CERT-01 — somente COMPLETED
  it("lança Error se enrollment.status !== COMPLETED — CERT-01", async () => {
    vi.mocked(db.certificate.findUnique).mockResolvedValue(null);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      ...COMPLETED_ENROLLMENT,
      status: "IN_PROGRESS",
    } as never);

    await expect(issueCertificate("enrollment-1")).rejects.toThrow("Enrollment not completed");
  });

  it("lança Error se enrollment não existe — CERT-01", async () => {
    vi.mocked(db.certificate.findUnique).mockResolvedValue(null);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    await expect(issueCertificate("enrollment-1")).rejects.toThrow("Enrollment not completed");
  });

  // CERT-03 — snapshots imutáveis
  it("snapshot correto: userNameSnapshot, courseTitleSnapshot, hoursSnapshot — CERT-03", async () => {
    vi.mocked(db.certificate.findUnique).mockResolvedValue(null);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(COMPLETED_ENROLLMENT as never);
    vi.mocked(db.certificate.create).mockResolvedValue({ id: "cert-new" } as never);

    await issueCertificate("enrollment-1");

    expect(vi.mocked(db.certificate.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userNameSnapshot: "João Silva",
          courseTitleSnapshot: "TypeScript Avançado",
          hoursSnapshot: 8,
        }),
      })
    );
  });

  it("fallback 'Estudante' quando user.name é null", async () => {
    vi.mocked(db.certificate.findUnique).mockResolvedValue(null);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      ...COMPLETED_ENROLLMENT,
      user: { name: null },
    } as never);
    vi.mocked(db.certificate.create).mockResolvedValue({ id: "cert-new" } as never);

    await issueCertificate("enrollment-1");

    expect(vi.mocked(db.certificate.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userNameSnapshot: "Estudante" }),
      })
    );
  });

  it("fallback 4h quando estimatedHours é null", async () => {
    vi.mocked(db.certificate.findUnique).mockResolvedValue(null);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      ...COMPLETED_ENROLLMENT,
      course: { ...COMPLETED_ENROLLMENT.course, estimatedHours: null },
    } as never);
    vi.mocked(db.certificate.create).mockResolvedValue({ id: "cert-new" } as never);

    await issueCertificate("enrollment-1");

    expect(vi.mocked(db.certificate.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hoursSnapshot: 4 }),
      })
    );
  });
});
