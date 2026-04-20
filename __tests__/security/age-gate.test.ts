import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/courses/enroll/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    course: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SESSION = { user: { id: "user-1", role: "STUDENT" } };

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/courses/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CONTENT-07 — age gate enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(SESSION as never);
  });

  it("bloqueia enroll em curso MATURE sem ageConfirmedAt — CONTENT-07", async () => {
    vi.mocked(db.course.findUnique).mockResolvedValue({
      id: "course-1",
      maturityRating: "MATURE",
    } as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({ ageConfirmedAt: null } as never);

    const res = await POST(makeRequest({ courseId: "course-1" }));

    expect(res.status).toBe(403);
    expect(vi.mocked(db.$transaction)).not.toHaveBeenCalled();
  });

  it("bloqueia quando user.ageConfirmedAt é null (user existe mas não confirmou)", async () => {
    vi.mocked(db.course.findUnique).mockResolvedValue({
      id: "course-1",
      maturityRating: "MATURE",
    } as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({ ageConfirmedAt: null } as never);

    const res = await POST(makeRequest({ courseId: "course-1" }));

    expect(res.status).toBe(403);
  });

  it("bloqueia quando user não existe no DB (ageConfirmedAt ausente)", async () => {
    vi.mocked(db.course.findUnique).mockResolvedValue({
      id: "course-1",
      maturityRating: "MATURE",
    } as never);
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest({ courseId: "course-1" }));

    expect(res.status).toBe(403);
  });

  it("permite enroll em curso MATURE com ageConfirmedAt definido", async () => {
    vi.mocked(db.course.findUnique).mockResolvedValue({
      id: "course-1",
      maturityRating: "MATURE",
    } as never);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      ageConfirmedAt: new Date("2000-01-01"),
    } as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "e-1" } as never);

    const res = await POST(makeRequest({ courseId: "course-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.enrolled).toBe(true);
  });

  it("permite enroll em curso GENERAL sem age confirmation — sem db.user.findUnique", async () => {
    vi.mocked(db.course.findUnique).mockResolvedValue({
      id: "course-1",
      maturityRating: "GENERAL",
    } as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "e-1" } as never);

    const res = await POST(makeRequest({ courseId: "course-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.enrolled).toBe(true);
    expect(vi.mocked(db.user.findUnique)).not.toHaveBeenCalled();
  });
});
