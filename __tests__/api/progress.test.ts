import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/courses/progress/route";

vi.mock("next/server", () => ({
  after: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/certificates", () => ({
  issueCertificate: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/prompts/specs/flashcards", () => ({
  generateFlashcards: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lesson: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    enrollment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userProgress: {
      upsert: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/courses/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const MOCK_LESSON = {
  id: "lesson-1",
  type: "THEORY",
  content: null,
  module: { courseId: "course-1", course: { language: "pt" } },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/courses/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AUTH-01: identidade sempre via auth()
  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest({ lessonId: "lesson-1" }));

    expect(res.status).toBe(401);
  });

  it("retorna 400 quando lessonId está ausente", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("retorna 404 quando a lição não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest({ lessonId: "inexistente" }));

    expect(res.status).toBe(404);
  });

  // AUTH-03: enrollment valida que usuário tem acesso ao curso
  it("retorna 403 quando usuário não está matriculado", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(MOCK_LESSON as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest({ lessonId: "lesson-1" }));

    expect(res.status).toBe(403);
  });

  it("marca lição como COMPLETED e retorna progressPercent calculado", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(MOCK_LESSON as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "enrollment-1" } as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(10);
    vi.mocked(db.userProgress.count).mockResolvedValue(5);
    vi.mocked(db.enrollment.update).mockResolvedValue({ id: "enrollment-1" } as never);

    const res = await POST(makeRequest({ lessonId: "lesson-1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.progressPercent).toBe(50); // 5/10 = 50%
  });

  // PROG-02: progressPercent é derivado, nunca manual
  it("calcula progressPercent como Math.round(completed/total * 100)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(MOCK_LESSON as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "e-1" } as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(3);
    vi.mocked(db.userProgress.count).mockResolvedValue(2);
    vi.mocked(db.enrollment.update).mockResolvedValue({ id: "e-1" } as never);

    const res = await POST(makeRequest({ lessonId: "lesson-1" }));
    const body = await res.json();

    expect(body.progressPercent).toBe(67); // Math.round(2/3*100) = 67
  });

  // PROG-02: status COMPLETED quando 100%
  it("seta enrollment status COMPLETED quando progressPercent é 100", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(MOCK_LESSON as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "e-1" } as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(5);
    vi.mocked(db.userProgress.count).mockResolvedValue(5); // todas concluídas
    vi.mocked(db.enrollment.update).mockResolvedValue({ id: "e-1" } as never);

    await POST(makeRequest({ lessonId: "lesson-1" }));

    expect(vi.mocked(db.enrollment.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETED", progressPercent: 100 }),
      })
    );
  });

  // PROG-01: progresso é forward-only — upsert nunca deve voltar atrás
  it("usa upsert (não create) para garantir idempotência do progresso", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(MOCK_LESSON as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "e-1" } as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(4);
    vi.mocked(db.userProgress.count).mockResolvedValue(1);
    vi.mocked(db.enrollment.update).mockResolvedValue({ id: "e-1" } as never);

    await POST(makeRequest({ lessonId: "lesson-1" }));

    expect(vi.mocked(db.userProgress.upsert)).toHaveBeenCalledOnce();
    expect(vi.mocked(db.userProgress.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: "COMPLETED" }),
        update: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
  });

  it("retorna 0% de progresso quando não há lições no curso", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(MOCK_LESSON as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "e-1" } as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(0); // edge case: curso sem lições
    vi.mocked(db.userProgress.count).mockResolvedValue(0);
    vi.mocked(db.enrollment.update).mockResolvedValue({ id: "e-1" } as never);

    const res = await POST(makeRequest({ lessonId: "lesson-1" }));
    const body = await res.json();

    expect(body.progressPercent).toBe(0);
  });
});
