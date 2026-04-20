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
    .enum(["react", "react-ts", "vanilla", "vanilla-ts", "vue", "node", "static"])
    .nullable(),
  relevantDemos: z.array(z.string()),
  tone: z.enum(["technical", "practical", "conceptual"]),
});

export type DomainContext = z.infer<typeof DomainClassifierSchema>;

export const LessonShellSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["THEORY", "QUIZ"]),
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
  estimatedHours: z.number().int().min(2).max(12),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  tags: z.array(z.string()).min(1).max(10),
  modules: z.array(ModuleShellSchema).min(1).max(5),
});

export type CourseOutline = z.infer<typeof CourseOutlineSchema>;

export const EnrichModulesSchema = z.array(ModuleShellSchema).min(1).max(2);

export type EnrichModules = z.infer<typeof EnrichModulesSchema>;

export const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

export const QuizQuestionsSchema = z.array(QuizQuestionSchema).length(5);

export type QuizQuestions = z.infer<typeof QuizQuestionsSchema>;

export const FlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
});

export const FlashcardsSchema = z.array(FlashcardSchema).min(1).max(5);

export type Flashcards = z.infer<typeof FlashcardsSchema>;
