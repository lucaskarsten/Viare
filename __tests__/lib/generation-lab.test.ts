import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Must mock before importing generation.ts
vi.mock("@/lib/labs/generator", () => ({
  generateAndSaveLab: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/theory", () => ({
  generateTheoryLesson: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/outline", () => ({
  generateOutline: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/classifier", () => ({
  classifyDomain: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/quiz", () => ({
  generateQuiz: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/practice", () => ({
  generatePracticeLesson: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/case-study", () => ({
  generateCaseStudyLesson: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/reflection", () => ({
  generateReflectionLesson: vi.fn(),
}));

vi.mock("@/lib/content-safety", () => ({
  checkInputSafety: vi.fn(() => ({ status: "safe" })),
  classifyGeneratedContent: vi.fn(() => ({ verdict: "clean" })),
  detectSensitiveTopic: vi.fn(() => false),
  isRefusalText: vi.fn(() => false),
  SAFETY_MESSAGES: { content_blocked: "blocked" },
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: { create: vi.fn(), update: vi.fn() },
    module: { create: vi.fn() },
    lesson: { create: vi.fn(), update: vi.fn(), count: vi.fn() },
    enrollment: { create: vi.fn() },
    quizQuestion: { createMany: vi.fn() },
  },
}));

vi.mock("@/lib/ingest", () => ({ extractSourceContent: vi.fn() }));
vi.mock("@/lib/slug", () => ({ toSlug: vi.fn((s: string) => s.toLowerCase()) }));
vi.mock("@/lib/prompts/language", () => ({
  buildResearchQuery: vi.fn(() => "query"),
}));
vi.mock("@tavily/core", () => ({
  tavily: vi.fn(() => ({
    search: vi.fn(() => ({ results: [] })),
  })),
}));

import { generateAndSaveLab } from "@/lib/labs/generator";
import { generateTheoryLesson } from "@/lib/prompts/specs/theory";
import { generateOutline } from "@/lib/prompts/specs/outline";
import { classifyDomain } from "@/lib/prompts/specs/classifier";
import { db } from "@/lib/db";
import { generateCourse } from "@/lib/generation";

const DOMAIN_CTX = {
  domain: "programming",
  sandboxTemplate: null,
  relevantDemos: [],
  tone: "technical",
  suggestedEmphasis: "balanced",
};

const OUTLINE_BASE = {
  title: "Test Course",
  description: "A course",
  estimatedHours: 2,
  difficulty: "EASY",
  maturityRating: "GENERAL",
  tags: ["test"],
  modules: [
    {
      title: "Module 1",
      description: "First module",
      lessons: [] as { title: string; type: string; labVariant?: string }[],
    },
  ],
};

function setupDbMocks(lessonIds: string[]) {
  let lessonCallIdx = 0;
  vi.mocked(db.course.create).mockResolvedValue({ id: "course-1", slug: "test-course" } as never);
  vi.mocked(db.course.update).mockResolvedValue({} as never);
  vi.mocked(db.module.create).mockResolvedValue({ id: "mod-1" } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.lesson.create as any).mockImplementation(() =>
    Promise.resolve({ id: lessonIds[lessonCallIdx++] ?? "lesson-x" })
  );
  vi.mocked(db.lesson.update).mockResolvedValue({} as never);
  vi.mocked(db.lesson.count).mockResolvedValue(0);
  vi.mocked(db.enrollment.create).mockResolvedValue({} as never);
}

describe("LAB in LESSON_GENERATORS — feature flag off", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ENABLE_LAB_GENERATION;
  });

  it("skips lab generation when ENABLE_LAB_GENERATION is not set", async () => {
    vi.mocked(classifyDomain).mockResolvedValue(DOMAIN_CTX as never);
    vi.mocked(generateOutline).mockResolvedValue({
      ...OUTLINE_BASE,
      modules: [
        {
          ...OUTLINE_BASE.modules[0],
          lessons: [{ title: "Lab Lesson", type: "LAB", labVariant: "CTF" }],
        },
      ],
    } as never);
    setupDbMocks(["lesson-1"]);

    const events: string[] = [];
    await generateCourse("Python", "user-1", undefined, (e) => events.push(e.type));

    expect(generateAndSaveLab).not.toHaveBeenCalled();
    expect(events).toContain("done");
  });

  it("skips lab generation when ENABLE_LAB_GENERATION=false", async () => {
    process.env.ENABLE_LAB_GENERATION = "false";
    vi.mocked(classifyDomain).mockResolvedValue(DOMAIN_CTX as never);
    vi.mocked(generateOutline).mockResolvedValue({
      ...OUTLINE_BASE,
      modules: [
        {
          ...OUTLINE_BASE.modules[0],
          lessons: [{ title: "Lab Lesson", type: "LAB", labVariant: "CTF" }],
        },
      ],
    } as never);
    setupDbMocks(["lesson-1"]);

    await generateCourse("Python", "user-1", undefined, () => {});

    expect(generateAndSaveLab).not.toHaveBeenCalled();
  });
});

describe("LAB in LESSON_GENERATORS — feature flag on", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_LAB_GENERATION = "true";
  });

  afterEach(() => {
    delete process.env.ENABLE_LAB_GENERATION;
  });

  it("calls generateAndSaveLab with CTF variant when flag=true and variant=CTF", async () => {
    vi.mocked(classifyDomain).mockResolvedValue(DOMAIN_CTX as never);
    vi.mocked(generateOutline).mockResolvedValue({
      ...OUTLINE_BASE,
      modules: [
        {
          ...OUTLINE_BASE.modules[0],
          lessons: [{ title: "CTF Lab", type: "LAB", labVariant: "CTF" }],
        },
      ],
    } as never);
    vi.mocked(generateAndSaveLab).mockResolvedValue({ labId: "lab-1", labType: "CTF" });
    setupDbMocks(["lesson-1"]);

    await generateCourse("Python", "user-1", undefined, () => {});

    expect(generateAndSaveLab).toHaveBeenCalledWith(
      expect.objectContaining({ labVariant: "CTF", lessonId: "lesson-1" })
    );
  });

  it("calls generateAndSaveLab with INTERACTIVE variant when flag=true and variant=INTERACTIVE", async () => {
    vi.mocked(classifyDomain).mockResolvedValue(DOMAIN_CTX as never);
    vi.mocked(generateOutline).mockResolvedValue({
      ...OUTLINE_BASE,
      modules: [
        {
          ...OUTLINE_BASE.modules[0],
          lessons: [{ title: "Interactive Lab", type: "LAB", labVariant: "INTERACTIVE" }],
        },
      ],
    } as never);
    vi.mocked(generateAndSaveLab).mockResolvedValue({ labId: "lab-2", labType: "INTERACTIVE" });
    setupDbMocks(["lesson-2"]);

    await generateCourse("Python", "user-1", undefined, () => {});

    expect(generateAndSaveLab).toHaveBeenCalledWith(
      expect.objectContaining({ labVariant: "INTERACTIVE", lessonId: "lesson-2" })
    );
  });

  it("falls back to THEORY generation when generateAndSaveLab throws", async () => {
    vi.mocked(classifyDomain).mockResolvedValue(DOMAIN_CTX as never);
    vi.mocked(generateOutline).mockResolvedValue({
      ...OUTLINE_BASE,
      modules: [
        {
          ...OUTLINE_BASE.modules[0],
          lessons: [{ title: "Failing Lab", type: "LAB", labVariant: "CTF" }],
        },
      ],
    } as never);
    vi.mocked(generateAndSaveLab).mockRejectedValue(
      new Error("[LAB_CHECK_VIOLATION] content blocked")
    );
    vi.mocked(generateTheoryLesson).mockResolvedValue({
      text: "theory content",
      stopReason: "end_turn",
    } as never);
    setupDbMocks(["lesson-3"]);

    const events: string[] = [];
    await generateCourse("Python", "user-1", undefined, (e) => events.push(e.type));

    expect(generateTheoryLesson).toHaveBeenCalled();
    expect(events).toContain("done");
  });
});
