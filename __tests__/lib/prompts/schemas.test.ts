import { describe, it, expect } from "vitest";
import { LessonShellSchema } from "@/lib/prompts/schemas";

// UT-14 — LessonShellSchema Zod: LAB requer labVariant
describe("LessonShellSchema", () => {
  it("accepts THEORY without labVariant", () => {
    const result = LessonShellSchema.safeParse({ title: "Intro", type: "THEORY" });
    expect(result.success).toBe(true);
  });

  it("accepts QUIZ without labVariant", () => {
    const result = LessonShellSchema.safeParse({ title: "Quiz 1", type: "QUIZ" });
    expect(result.success).toBe(true);
  });

  it("accepts PRACTICE without labVariant", () => {
    const result = LessonShellSchema.safeParse({ title: "Practice", type: "PRACTICE" });
    expect(result.success).toBe(true);
  });

  it("accepts CASE_STUDY without labVariant", () => {
    const result = LessonShellSchema.safeParse({ title: "Case Study", type: "CASE_STUDY" });
    expect(result.success).toBe(true);
  });

  it("accepts REFLECTION without labVariant", () => {
    const result = LessonShellSchema.safeParse({ title: "Reflect", type: "REFLECTION" });
    expect(result.success).toBe(true);
  });

  it("rejects LAB without labVariant — UT-14", () => {
    const result = LessonShellSchema.safeParse({ title: "My Lab", type: "LAB" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("labVariant");
    }
  });

  it("accepts LAB with labVariant CTF — UT-14", () => {
    const result = LessonShellSchema.safeParse({
      title: "CTF Lab",
      type: "LAB",
      labVariant: "CTF",
    });
    expect(result.success).toBe(true);
  });

  it("accepts LAB with labVariant INTERACTIVE — UT-14", () => {
    const result = LessonShellSchema.safeParse({
      title: "Interactive Lab",
      type: "LAB",
      labVariant: "INTERACTIVE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects LAB with invalid labVariant — UT-14", () => {
    const result = LessonShellSchema.safeParse({
      title: "Lab",
      type: "LAB",
      labVariant: "UNKNOWN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown lesson type", () => {
    const result = LessonShellSchema.safeParse({ title: "Lesson", type: "VIDEO" });
    expect(result.success).toBe(false);
  });

  it("ignores labVariant on non-LAB types (no spurious error)", () => {
    const result = LessonShellSchema.safeParse({
      title: "Theory",
      type: "THEORY",
      labVariant: "CTF",
    });
    expect(result.success).toBe(true);
  });
});
