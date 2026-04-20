import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/courses/[slug]/enrich/route";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/dev-auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/subscription", () => ({
  isPro: vi.fn(),
}));

vi.mock("@tavily/core", () => ({
  tavily: vi.fn(() => ({
    search: vi.fn().mockResolvedValue({ results: [] }),
  })),
}));

vi.mock("@/lib/prompts/specs/enrich-modules", () => ({
  generateEnrichModules: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/theory", () => ({
  generateTheoryLesson: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/quiz", () => ({
  generateQuiz: vi.fn(),
}));

vi.mock("@/lib/content-safety", () => ({
  checkInputSafety: vi.fn().mockReturnValue({ status: "ok" }),
  classifyGeneratedContent: vi.fn().mockReturnValue({ verdict: "ok" }),
  SAFETY_MESSAGES: { content_blocked: "Content blocked" },
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    enrollment: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    module: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    lesson: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    quizQuestion: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { isPro } from "@/lib/subscription";
import { generateEnrichModules } from "@/lib/prompts/specs/enrich-modules";
import { generateTheoryLesson } from "@/lib/prompts/specs/theory";
import { classifyGeneratedContent } from "@/lib/content-safety";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, slug = "test-course") {
  return new Request(`http://localhost/api/courses/${slug}/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const MOCK_SESSION = { user: { id: "user-1" } };

const MOCK_COURSE = {
  id: "course-1",
  slug: "test-course",
  title: "Test Course",
  topic: "testing",
  language: "pt",
  status: "PUBLISHED",
  createdById: "user-1",
  enrichCount: 0,
  requiresReview: false,
  modules: [{ id: "module-1", order: 0, title: "Module 1" }],
};

const MOCK_MODULE_SHELL = {
  title: "Advanced Module",
  description: "Description",
  lessons: [{ title: "Lesson 1", type: "THEORY" }],
};

// ── Auth tests ────────────────────────────────────────────────────────────────

describe("POST /api/courses/[slug]/enrich — auth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });
    expect(res.status).toBe(401);
  });

  it("retorna 404 quando curso não existe", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "not-found" }) });
    expect(res.status).toBe(404);
  });

  it("retorna 400 quando body é inválido", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    const res = await POST(makeRequest({ action: "unknown-action" }), {
      params: Promise.resolve({ slug: "test-course" }),
    });
    expect(res.status).toBe(400);
  });

  it("retorna 400 quando curso não está publicado", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue({
      ...MOCK_COURSE,
      status: "DRAFT",
    } as never);
    vi.mocked(isPro).mockResolvedValue(true);
    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });
    expect(res.status).toBe(400);
  });
});

// ── Pro gate (SUB-03) ─────────────────────────────────────────────────────────

describe("POST /api/courses/[slug]/enrich — Pro gate (SUB-03)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 403 quando usuário não é Pro (append-modules)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(false);

    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("pro_required");
    expect(body.upgradeUrl).toBe("/pricing");
    // LLM/Tavily must NOT be called
    expect(vi.mocked(generateEnrichModules)).not.toHaveBeenCalled();
  });

  it("retorna 403 quando usuário não é Pro (insert-lesson)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(false);

    const res = await POST(
      makeRequest({
        action: "insert-lesson",
        moduleId: "module-1",
        referenceLessonId: "lesson-1",
        position: "after",
        lessonType: "THEORY",
      }),
      { params: Promise.resolve({ slug: "test-course" }) }
    );

    expect(res.status).toBe(403);
    expect(vi.mocked(generateTheoryLesson)).not.toHaveBeenCalled();
  });
});

// ── enrichCount cap (CA-D2) ───────────────────────────────────────────────────

describe("POST /api/courses/[slug]/enrich — enrichCount cap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 429 quando enrichCount >= 20", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue({
      ...MOCK_COURSE,
      enrichCount: 20,
    } as never);
    vi.mocked(isPro).mockResolvedValue(true);

    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("enrich_limit_reached");
    expect(vi.mocked(generateEnrichModules)).not.toHaveBeenCalled();
  });
});

// ── append-modules happy path ─────────────────────────────────────────────────

describe("POST /api/courses/[slug]/enrich — append-modules (Pro)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 200 e cria módulos (Pro user)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);
    vi.mocked(generateEnrichModules).mockResolvedValue([MOCK_MODULE_SHELL] as never);
    vi.mocked(generateTheoryLesson).mockResolvedValue({ text: "Generated content" } as never);
    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      await fn({
        lesson: {
          count: vi.fn().mockResolvedValue(3),
          create: vi.fn().mockResolvedValue({ id: "new-lesson" }),
          updateMany: vi.fn(),
        },
        enrollment: { updateMany: vi.fn() },
        module: { create: vi.fn().mockResolvedValue({ id: "new-module" }) },
        quizQuestion: { createMany: vi.fn() },
        course: { update: vi.fn() },
      } as never);
    });

    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.addedModules).toBe(1);
    expect(body.enrichCount).toBe(1);
  });

  it("retorna 500 e não persiste quando LLM falha na FASE 1", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);
    vi.mocked(generateEnrichModules).mockRejectedValue(new Error("LLM timeout"));

    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });

    expect(res.status).toBe(500);
    // $transaction must NOT be called — FASE 2 never executes
    expect(vi.mocked(db.$transaction)).not.toHaveBeenCalled();
  });
});

// ── insert-lesson ─────────────────────────────────────────────────────────────

describe("POST /api/courses/[slug]/enrich — insert-lesson", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 404 quando moduleId não existe no curso", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);

    const res = await POST(
      makeRequest({
        action: "insert-lesson",
        moduleId: "non-existent-module",
        referenceLessonId: "lesson-1",
        position: "after",
        lessonType: "THEORY",
      }),
      { params: Promise.resolve({ slug: "test-course" }) }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("module_not_found");
  });

  it("retorna 404 quando referenceLessonId não existe no módulo", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);
    vi.mocked(db.lesson.findMany).mockResolvedValue([]);

    const res = await POST(
      makeRequest({
        action: "insert-lesson",
        moduleId: "module-1",
        referenceLessonId: "lesson-x",
        position: "after",
        lessonType: "THEORY",
      }),
      { params: Promise.resolve({ slug: "test-course" }) }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("reference_lesson_not_found");
  });

  it("insere lição e reordena siblings corretamente", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);
    vi.mocked(db.lesson.findMany).mockResolvedValue([
      { id: "lesson-1", order: 0 },
      { id: "lesson-2", order: 1 },
    ] as never);
    vi.mocked(generateTheoryLesson).mockResolvedValue({ text: "New lesson content" } as never);

    const txMock = {
      lesson: {
        count: vi.fn().mockResolvedValue(2),
        create: vi.fn().mockResolvedValue({ id: "new-lesson" }),
        updateMany: vi.fn(),
      },
      enrollment: { updateMany: vi.fn() },
      module: { create: vi.fn() },
      quizQuestion: { createMany: vi.fn() },
      course: { update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      await fn(txMock as never);
    });

    const res = await POST(
      makeRequest({
        action: "insert-lesson",
        moduleId: "module-1",
        referenceLessonId: "lesson-1",
        position: "after",
        lessonType: "THEORY",
        topicHint: "Advanced testing",
      }),
      { params: Promise.resolve({ slug: "test-course" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.addedLesson).toBe(1);
    expect(body.moduleId).toBe("module-1");
    // siblings at order >= 1 should be shifted up
    expect(txMock.lesson.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { order: { increment: 1 } } })
    );
  });

  it("insere antes quando position=before", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);
    vi.mocked(db.lesson.findMany).mockResolvedValue([{ id: "lesson-1", order: 2 }] as never);
    vi.mocked(generateTheoryLesson).mockResolvedValue({ text: "Content" } as never);

    const txMock = {
      lesson: {
        count: vi.fn().mockResolvedValue(3),
        create: vi.fn().mockResolvedValue({ id: "new-lesson" }),
        updateMany: vi.fn(),
      },
      enrollment: { updateMany: vi.fn() },
      module: { create: vi.fn() },
      quizQuestion: { createMany: vi.fn() },
      course: { update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      await fn(txMock as never);
    });

    await POST(
      makeRequest({
        action: "insert-lesson",
        moduleId: "module-1",
        referenceLessonId: "lesson-1",
        position: "before",
        lessonType: "THEORY",
      }),
      { params: Promise.resolve({ slug: "test-course" }) }
    );

    // insertOrder should be refLesson.order = 2 (position=before)
    expect(txMock.lesson.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 2 }) })
    );
  });
});

// ── PROG-01 baseLessonCount snapshot ─────────────────────────────────────────

describe("POST /api/courses/[slug]/enrich — PROG-01 baseLessonCount snapshot", () => {
  beforeEach(() => vi.clearAllMocks());

  it("faz snapshot de baseLessonCount antes de criar novas lições", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);
    vi.mocked(generateEnrichModules).mockResolvedValue([MOCK_MODULE_SHELL] as never);
    vi.mocked(generateTheoryLesson).mockResolvedValue({ text: "Content" } as never);

    const txMock = {
      lesson: {
        count: vi.fn().mockResolvedValue(6),
        create: vi.fn().mockResolvedValue({ id: "new-lesson" }),
        updateMany: vi.fn(),
      },
      enrollment: { updateMany: vi.fn() },
      module: { create: vi.fn().mockResolvedValue({ id: "new-mod" }) },
      quizQuestion: { createMany: vi.fn() },
      course: { update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      await fn(txMock as never);
    });

    await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });

    // Must snapshot baseLessonCount=6 for enrollments that have null
    expect(txMock.enrollment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ baseLessonCount: null }),
        data: { baseLessonCount: 6 },
      })
    );
  });
});

// ── Safety gate (AI-01) ───────────────────────────────────────────────────────

describe("POST /api/courses/[slug]/enrich — safety gate (AI-01)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 422 e não persiste quando conteúdo é blocked", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);
    vi.mocked(generateEnrichModules).mockResolvedValue([MOCK_MODULE_SHELL] as never);
    vi.mocked(generateTheoryLesson).mockResolvedValue({ text: "Harmful content" } as never);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "blocked" } as never);

    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });

    expect(res.status).toBe(422);
    // $transaction must NOT be called — FASE 2 must not execute on blocked content
    expect(vi.mocked(db.$transaction)).not.toHaveBeenCalled();
  });
});

// ── Transaction failure ───────────────────────────────────────────────────────

describe("POST /api/courses/[slug]/enrich — transaction failure", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna 500 quando $transaction falha (FASE 2)", async () => {
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(db.course.findUnique).mockResolvedValue(MOCK_COURSE as never);
    vi.mocked(isPro).mockResolvedValue(true);
    vi.mocked(generateEnrichModules).mockResolvedValue([MOCK_MODULE_SHELL] as never);
    vi.mocked(generateTheoryLesson).mockResolvedValue({ text: "Content" } as never);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "ok" } as never);
    vi.mocked(db.$transaction).mockRejectedValue(new Error("Transaction timeout"));
    vi.mocked(db.module.deleteMany).mockResolvedValue({ count: 0 } as never);

    const res = await POST(makeRequest({}), { params: Promise.resolve({ slug: "test-course" }) });

    expect(res.status).toBe(500);
  });
});
