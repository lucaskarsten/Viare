import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/labs/[labId]/complete/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lab: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn(), update: vi.fn() },
    userProgress: { upsert: vi.fn(), count: vi.fn() },
    lesson: { count: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const PARAMS = { params: Promise.resolve({ labId: "lab-1" }) };

const INTERACTIVE_LAB = {
  id: "lab-1",
  lessonId: "lesson-1",
  type: "INTERACTIVE",
  lesson: {
    lessonGenerationStatus: "READY",
    module: { course: { slug: "my-course", id: "course-1" } },
  },
};

const CTF_LAB = {
  id: "lab-2",
  lessonId: "lesson-2",
  type: "CTF",
  lesson: {
    lessonGenerationStatus: "READY",
    module: { course: { slug: "my-course", id: "course-1" } },
  },
};

function makeRequest() {
  return new Request("http://localhost/api/labs/lab-1/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/labs/[labId]/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest(), PARAMS);

    expect(res.status).toBe(401);
  });

  it("retorna 404 quando lab não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(), PARAMS);

    expect(res.status).toBe(404);
  });

  // LAB-04 — CTF labs devem usar /submit com flag
  it("retorna 400 para lab CTF — LAB-04", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(CTF_LAB as never);

    const res = await POST(makeRequest(), PARAMS);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/submit/i);
  });

  it("retorna 403 quando não matriculado", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(INTERACTIVE_LAB as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(), PARAMS);

    expect(res.status).toBe(403);
  });

  // IT-3: Complete INTERACTIVE → 200 + progress updated
  it("lab INTERACTIVE com usuário matriculado → 200 + progressPercent — IT-3", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(INTERACTIVE_LAB as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      id: "enrollment-1",
      progressPercent: 0,
    } as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(4);
    vi.mocked(db.userProgress.count).mockResolvedValue(2);
    vi.mocked(db.enrollment.update).mockResolvedValue({} as never);

    const res = await POST(makeRequest(), PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.completed).toBe(true);
    expect(body.progressPercent).toBe(50);
    expect(vi.mocked(db.userProgress.upsert)).toHaveBeenCalledOnce();
  });

  // PROG-01 — forward-only progress
  it("não decrementa progressPercent já mais alto — PROG-01", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(INTERACTIVE_LAB as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      id: "enrollment-1",
      progressPercent: 80,
    } as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(10);
    vi.mocked(db.userProgress.count).mockResolvedValue(2); // 20% — menor que 80%
    vi.mocked(db.enrollment.update).mockResolvedValue({} as never);

    const res = await POST(makeRequest(), PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.progressPercent).toBe(80); // mantém 80%, não volta para 20%
    expect(vi.mocked(db.enrollment.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ progressPercent: 80 }),
      })
    );
  });

  it("chama revalidatePath com slug do curso", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(INTERACTIVE_LAB as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({
      id: "enrollment-1",
      progressPercent: 0,
    } as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(1);
    vi.mocked(db.userProgress.count).mockResolvedValue(1);
    vi.mocked(db.enrollment.update).mockResolvedValue({} as never);

    await POST(makeRequest(), PARAMS);

    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/courses/my-course");
  });
});
