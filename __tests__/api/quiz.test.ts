import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/quiz/[lessonId]/attempt/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findUnique: vi.fn() },
    quizQuestion: { findMany: vi.fn() },
    quizAttempt: { create: vi.fn() },
    userProgress: { upsert: vi.fn() },
  },
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const PARAMS = { params: Promise.resolve({ lessonId: "lesson-1" }) };
const QUESTIONS = [
  { id: "q-1", correctIndex: 2, explanation: "Porque A" },
  { id: "q-2", correctIndex: 0, explanation: "Porque B" },
];

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/quiz/lesson-1/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/quiz/[lessonId]/attempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.lesson.findUnique).mockResolvedValue({
      lessonGenerationStatus: "READY",
    } as never);
    vi.mocked(db.quizAttempt.create).mockResolvedValue({} as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
  });

  // AUTH-01
  it("retorna 401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makeRequest({ answers: [] }), PARAMS);

    expect(res.status).toBe(401);
  });

  it("retorna 400 com body inválido (answers ausente)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makeRequest({}), PARAMS);

    expect(res.status).toBe(400);
  });

  it("retorna 400 quando não há perguntas para a lição", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.quizQuestion.findMany).mockResolvedValue([]);

    const res = await POST(makeRequest({ answers: [] }), PARAMS);

    expect(res.status).toBe(400);
  });

  it("score 0 para todas erradas", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.quizQuestion.findMany).mockResolvedValue(QUESTIONS as never);

    const res = await POST(
      makeRequest({
        answers: [
          { questionId: "q-1", selectedIndex: 0 },
          { questionId: "q-2", selectedIndex: 1 },
        ],
      }),
      PARAMS
    );
    const body = await res.json();

    expect(body.score).toBe(0);
    expect(body.pct).toBe(0);
  });

  it("score correto para todas certas", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.quizQuestion.findMany).mockResolvedValue(QUESTIONS as never);

    const res = await POST(
      makeRequest({
        answers: [
          { questionId: "q-1", selectedIndex: 2 },
          { questionId: "q-2", selectedIndex: 0 },
        ],
      }),
      PARAMS
    );
    const body = await res.json();

    expect(body.score).toBe(2);
    expect(body.total).toBe(2);
    expect(body.pct).toBe(100);
  });

  it("pct = Math.round(score/total*100) para resultado parcial", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.quizQuestion.findMany).mockResolvedValue([
      { id: "q-1", correctIndex: 0, explanation: null },
      { id: "q-2", correctIndex: 0, explanation: null },
      { id: "q-3", correctIndex: 0, explanation: null },
    ] as never);

    const res = await POST(
      makeRequest({
        answers: [
          { questionId: "q-1", selectedIndex: 0 }, // certa
          { questionId: "q-2", selectedIndex: 1 }, // errada
          { questionId: "q-3", selectedIndex: 1 }, // errada
        ],
      }),
      PARAMS
    );
    const body = await res.json();

    expect(body.score).toBe(1);
    expect(body.pct).toBe(33); // Math.round(1/3*100)
  });

  it("answers retornam correctIndex e explanation", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.quizQuestion.findMany).mockResolvedValue(QUESTIONS as never);

    const res = await POST(
      makeRequest({ answers: [{ questionId: "q-1", selectedIndex: 0 }] }),
      PARAMS
    );
    const body = await res.json();

    expect(body.answers[0].correctIndex).toBe(2);
    expect(body.answers[0].explanation).toBe("Porque A");
    expect(body.answers[0].correct).toBe(false);
  });

  it("cria QuizAttempt com score, total e answers", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.quizQuestion.findMany).mockResolvedValue(QUESTIONS as never);

    await POST(
      makeRequest({
        answers: [
          { questionId: "q-1", selectedIndex: 2 },
          { questionId: "q-2", selectedIndex: 0 },
        ],
      }),
      PARAMS
    );

    expect(vi.mocked(db.quizAttempt.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 2, total: 2 }),
      })
    );
  });

  // PROG-04: quiz = tentativa registrada marca lição completa
  it("upsert UserProgress como COMPLETED — PROG-04", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.quizQuestion.findMany).mockResolvedValue(QUESTIONS as never);

    await POST(makeRequest({ answers: [{ questionId: "q-1", selectedIndex: 0 }] }), PARAMS);

    expect(vi.mocked(db.userProgress.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: "COMPLETED" }),
        update: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
  });
});
