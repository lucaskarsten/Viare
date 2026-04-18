import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/courses/enroll/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    enrollment: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/courses/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const MOCK_COURSE = { id: "course-1" };

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/courses/enroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AUTH-01
  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest({ courseId: "course-1" }));

    expect(res.status).toBe(401);
  });

  it("retorna 400 quando courseId está ausente", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  // COURSE-04: cursos não PUBLISHED são invisíveis
  it("retorna 404 para curso inexistente ou não publicado", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest({ courseId: "draft-course" }));

    expect(res.status).toBe(404);
  });

  // Idempotência: já matriculado retorna enrolled:true sem criar duplicata
  it("retorna enrolled:true sem criar nova matrícula quando já matriculado", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "existing-enrollment" } as never);

    const res = await POST(makeRequest({ courseId: "course-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.enrolled).toBe(true);
    expect(vi.mocked(db.$transaction)).not.toHaveBeenCalled();
  });

  // COURSE-03: totalEnrollments incrementado em transaction
  it("cria matrícula e incrementa totalEnrollments em transaction atômica", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);
    vi.mocked(db.$transaction).mockResolvedValue([{}, {}] as never);

    const res = await POST(makeRequest({ courseId: "course-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.enrolled).toBe(true);
    expect(vi.mocked(db.$transaction)).toHaveBeenCalledOnce();
  });

  it("query de curso filtra por status PUBLISHED (COURSE-04)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(null);

    await POST(makeRequest({ courseId: "course-1" }));

    expect(vi.mocked(db.course.findUnique)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PUBLISHED" }),
      })
    );
  });
});
