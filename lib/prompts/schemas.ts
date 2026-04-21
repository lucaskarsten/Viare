import { z } from "zod";

// RULE: AI-01 — every LLM output is validated by one of these schemas.
// Tool Use guarantees structure, Zod validates business constraints.

export const DomainClassifierSchema = z.object({
  domain: z.enum([
    "programming",
    "science",
    "math",
    "business",
    "history",
    "language",
    "health",
    "other",
  ]),
  sandboxTemplate: z
    .enum(["react", "react-ts", "vanilla", "vanilla-ts", "vue", "node", "static", "python"])
    .nullable()
    .catch(null),
  relevantDemos: z.array(z.string()),
  tone: z.enum(["technical", "practical", "conceptual"]),
  suggestedEmphasis: z.enum(["practice", "case_study", "balanced"]).default("balanced"),
});

export type DomainContext = z.infer<typeof DomainClassifierSchema>;

export const LessonShellSchema = z
  .object({
    title: z.string().min(1),
    type: z.enum(["THEORY", "QUIZ", "CASE_STUDY", "REFLECTION", "PRACTICE", "LAB"]),
    // RULE: AI-06 — LAB lessons require a labVariant to drive generator routing
    labVariant: z.enum(["CTF", "INTERACTIVE"]).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "LAB" && !val.labVariant) {
      ctx.addIssue({
        code: "custom",
        path: ["labVariant"],
        message: "labVariant is required when type is LAB",
      });
    }
  });

export const ModuleShellSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  lessons: z.array(LessonShellSchema).min(1),
});

// RULE: AI-02/AI-03 — course constraints baked into the schema.
export const CourseOutlineSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  estimatedHours: z.number().int().min(1).max(60),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  // RULE: CONTENT-06 — AI classifies maturity; GENERAL is safe default
  maturityRating: z.enum(["GENERAL", "MATURE"]).default("GENERAL"),
  tags: z.array(z.string()).min(1).max(10),
  modules: z.array(ModuleShellSchema).min(1).max(10),
});

export type CourseOutline = z.infer<typeof CourseOutlineSchema>;

export const EnrichModulesSchema = z.array(ModuleShellSchema).min(1).max(2);

export type EnrichModules = z.infer<typeof EnrichModulesSchema>;

export const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  // RULE: AI-08 — bloomLevel is validated post-parse and discarded before DB write.
  // NOT a persisted column — strip it before db.quizQuestion.create.
  bloomLevel: z.enum(["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]),
});

export const QuizQuestionsSchema = z.array(QuizQuestionSchema).length(5);

// RULE: AI-08 — Quiz must spread ≥3 distinct Bloom levels across 5 questions.
// Called after Zod parse; returns false triggers a bounded retry (max 2).
export function validateBloomDistribution(questions: Array<{ bloomLevel: string }>): boolean {
  const distinct = new Set(questions.map((q) => q.bloomLevel));
  return distinct.size >= 3;
}

export type QuizQuestions = z.infer<typeof QuizQuestionsSchema>;

export const FlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
});

export const FlashcardsSchema = z.array(FlashcardSchema).min(1).max(5);

export type Flashcards = z.infer<typeof FlashcardsSchema>;
