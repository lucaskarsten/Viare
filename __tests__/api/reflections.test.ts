import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/reflections/route";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findUnique: vi.fn() },
    enrollment: { findUnique: vi.fn() },
    reflectionResponse: { upsert: vi.fn(), findUnique: vi.fn() },
    userProgress: { upsert: vi.fn() },
  },
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { id: "user-1", role: "STUDENT" } };
const MOCK_LESSON = {
  id: "lesson-1",
  module: { courseId: "course-1", course: { finalizedAt: new Date() } },
};
const LONG_CONTENT = "a".repeat(50);

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/reflections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(lessonId?: string) {
  const url = lessonId
    ? `http://localhost/api/reflections?lessonId=${lessonId}`
    : "http://localhost/api/reflections";
  return new Request(url, { method: "GET" });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/reflections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.reflectionResponse.upsert).mockResolvedValue({} as never);
    vi.mocked(db.userProgress.upsert).mockResolvedValue({} as never);
  });

  // AUTH-01
  it("retorna 401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await POST(makePostRequest({ lessonId: "l-1", content: LONG_CONTENT }));

    expect(res.status).toBe(401);
  });

  it("retorna 400 com body inválido (lessonId ausente)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makePostRequest({ content: LONG_CONTENT }));

    expect(res.status).toBe(400);
  });

  // PROG-04: mínimo 50 chars
  it("retorna 400 quando content tem menos de 50 chars — PROG-04", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await POST(makePostRequest({ lessonId: "l-1", content: "Muito curto." }));

    expect(res.status).toBe(400);
  });

  it("retorna 400 quando content com espaços tem menos de 50 chars após trim", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    const padded = "   " + "curto" + "   "; // 5 chars sem espaços

    const res = await POST(makePostRequest({ lessonId: "l-1", content: padded }));

    expect(res.status).toBe(400);
  });

  it("retorna 404 quando lição não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(null);

    const res = await POST(makePostRequest({ lessonId: "l-1", content: LONG_CONTENT }));

    expect(res.status).toBe(404);
  });

  // AUTH-03: matrícula verifica userId
  it("retorna 403 quando não matriculado", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(MOCK_LESSON as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue(null);

    const res = await POST(makePostRequest({ lessonId: "l-1", content: LONG_CONTENT }));

    expect(res.status).toBe(403);
  });

  it("upsert ReflectionResponse e UserProgress COMPLETED — PROG-04", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.lesson.findUnique).mockResolvedValue(MOCK_LESSON as never);
    vi.mocked(db.enrollment.findUnique).mockResolvedValue({ id: "e-1" } as never);

    const res = await POST(makePostRequest({ lessonId: "l-1", content: LONG_CONTENT }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(vi.mocked(db.reflectionResponse.upsert)).toHaveBeenCalledOnce();
    expect(vi.mocked(db.userProgress.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: "COMPLETED" }),
        update: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
  });
});

describe("GET /api/reflections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await GET(makeGetRequest("l-1"));

    expect(res.status).toBe(401);
  });

  it("retorna 400 quando lessonId está ausente", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);

    const res = await GET(makeGetRequest());

    expect(res.status).toBe(400);
  });

  // AUTH-03: sempre filtra por userId da sessão
  it("query filtra por session.user.id — AUTH-03", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.reflectionResponse.findUnique).mockResolvedValue({
      content: "Minha reflexão sobre o tema aprendido.",
    } as never);

    const res = await GET(makeGetRequest("lesson-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.content).toBe("Minha reflexão sobre o tema aprendido.");
    expect(vi.mocked(db.reflectionResponse.findUnique)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_lessonId: expect.objectContaining({ userId: "user-1" }),
        }),
      })
    );
  });

  it("retorna { content: null } quando não existe reflexão", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.reflectionResponse.findUnique).mockResolvedValue(null);

    const res = await GET(makeGetRequest("lesson-1"));
    const body = await res.json();

    expect(body.content).toBeNull();
  });
});
