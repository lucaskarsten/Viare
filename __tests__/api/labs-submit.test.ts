import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/labs/[labId]/submit/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lab: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn(), update: vi.fn() },
    labAttempt: { create: vi.fn(), count: vi.fn() },
    userProgress: { upsert: vi.fn(), count: vi.fn() },
    lesson: { count: vi.fn() },
    course: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/lab", () => ({
  validateFlag: vi.fn(),
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { validateFlag } from "@/lib/lab";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const PARAMS = { params: Promise.resolve({ labId: "lab-1" }) };
const VALID_BODY = { flag: "FLAG{test}", lessonId: "lesson-1", courseId: "course-1" };

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/labs/lab-1/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setupBase(correct: boolean) {
  vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
  vi.mocked(db.lab.findUnique).mockResolvedValue({ flagHash: "hashed_flag", type: "CTF" } as never);
  vi.mocked(db.enrollment.findUnique).mockResolvedValue({
    id: "enrollment-1",
    progressPercent: 0,
  } as never);
  vi.mocked(db.course.findUnique).mockResolvedValue({ finalizedAt: new Date() } as never);
  vi.mocked(validateFlag).mockResolvedValue(correct);
  vi.mocked(db.labAttempt.create).mockResolvedValue({} as never);
  vi.mocked(db.labAttempt.count).mockResolvedValue(1);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/labs/[labId]/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AUTH-01
  it("retorna 401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest(VALID_BODY), PARAMS);

    expect(res.status).toBe(401);
  });

  it("retorna 400 com body inválido (flag ausente)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makeRequest({ lessonId: "l-1", courseId: "c-1" }), PARAMS);

    expect(res.status).toBe(400);
  });

  it("retorna 400 com body inválido (lessonId ausente)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makeRequest({ flag: "x", courseId: "c-1" }), PARAMS);

    expect(res.status).toBe(400);
  });

  it("retorna 404 quando lab não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(VALID_BODY), PARAMS);

    expect(res.status).toBe(404);
  });

  // AUTH-03: enrollment verifica userId
  it("retorna 403 quando não matriculado no curso", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({ flagHash: "hash", type: "CTF" } as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(VALID_BODY), PARAMS);

    expect(res.status).toBe(403);
  });

  // LAB-04: INTERACTIVE labs rejeitados no /submit
  it("retorna 400 para lab INTERACTIVE — LAB-04", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lab.findUnique).mockResolvedValue({
      flagHash: null,
      type: "INTERACTIVE",
    } as never);

    const res = await POST(makeRequest(VALID_BODY), PARAMS);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/complete/i);
  });

  it("flag errada: retorna { correct: false } e registra attempt", async () => {
    setupBase(false);

    const res = await POST(makeRequest(VALID_BODY), PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.correct).toBe(false);
    expect(vi.mocked(db.labAttempt.create)).toHaveBeenCalledOnce();
    expect(vi.mocked(db.userProgress.upsert)).not.toHaveBeenCalled();
  });

  // LAB-03: validação antes de marcar completo
  it("flag correta: retorna { correct: true } e atualiza UserProgress — LAB-03", async () => {
    setupBase(true);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(5);
    vi.mocked(db.userProgress.count).mockResolvedValue(3);
    vi.mocked(db.enrollment.update).mockResolvedValue({} as never);

    const res = await POST(makeRequest(VALID_BODY), PARAMS);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.correct).toBe(true);
    expect(vi.mocked(db.userProgress.upsert)).toHaveBeenCalledOnce();
  });

  // PROG-02: progressPercent derivado
  it("flag correta: recalcula progressPercent — PROG-02", async () => {
    setupBase(true);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(4);
    vi.mocked(db.userProgress.count).mockResolvedValue(2);
    vi.mocked(db.enrollment.update).mockResolvedValue({} as never);

    await POST(makeRequest(VALID_BODY), PARAMS);

    expect(vi.mocked(db.enrollment.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ progressPercent: 50, status: "IN_PROGRESS" }),
      })
    );
  });

  it("flag correta 100%: seta status COMPLETED", async () => {
    setupBase(true);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
    vi.mocked(db.lesson.count).mockResolvedValue(5);
    vi.mocked(db.userProgress.count).mockResolvedValue(5);
    vi.mocked(db.enrollment.update).mockResolvedValue({} as never);

    await POST(makeRequest(VALID_BODY), PARAMS);

    expect(vi.mocked(db.enrollment.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ progressPercent: 100, status: "COMPLETED" }),
      })
    );
  });

  it("contador de attempts incrementa em cada submissão", async () => {
    setupBase(false);
    vi.mocked(db.labAttempt.count).mockResolvedValue(3);

    const res = await POST(makeRequest(VALID_BODY), PARAMS);
    const body = await res.json();

    expect(body.attempts).toBe(3);
  });

  // LAB-01: validateFlag usa hash do servidor, não do body
  it("validateFlag é chamado com flagHash do servidor, não do body — LAB-01", async () => {
    setupBase(false);

    await POST(makeRequest({ ...VALID_BODY, flag: "FLAG{submitted}" }), PARAMS);

    expect(vi.mocked(validateFlag)).toHaveBeenCalledWith("FLAG{submitted}", "hashed_flag");
  });
});
