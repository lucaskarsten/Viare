import { tavily } from "@tavily/core";
import { extractSourceContent, type IngestSource } from "@/lib/ingest";
import { db } from "@/lib/db";
import { CourseScope, Difficulty } from "@prisma/client";
import {
  checkInputSafety,
  classifyGeneratedContent,
  detectSensitiveTopic,
  isRefusalText,
  SAFETY_MESSAGES,
} from "@/lib/content-safety";
import { toSlug } from "@/lib/slug";
import { buildResearchQuery } from "@/lib/prompts/language";
import { classifyDomain } from "@/lib/prompts/specs/classifier";
import { generateOutline } from "@/lib/prompts/specs/outline";
import { generateTheoryLesson } from "@/lib/prompts/specs/theory";
import { generateQuiz } from "@/lib/prompts/specs/quiz";
import { generatePracticeLesson } from "@/lib/prompts/specs/practice";
import { generateCaseStudyLesson } from "@/lib/prompts/specs/case-study";
import { generateReflectionLesson } from "@/lib/prompts/specs/reflection";
import { generateAndSaveLab } from "@/lib/labs/generator";
import {
  type CourseOutline,
  type DomainContext,
  validateBloomDistribution,
} from "@/lib/prompts/schemas";

// Shared context handed to every lesson-type generator. Generators mutate
// neither the DB row nor the parts list directly outside their scope; they
// receive what they need and push generated text for downstream content safety.
type LessonGenerationContext = {
  language: string;
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonId: string;
  domainContext: DomainContext;
  generatedTextParts: string[];
  maturityRating?: "GENERAL" | "MATURE";
  labVariant?: "CTF" | "INTERACTIVE";
  // RULE: AI-08 — global lesson counter for opener-mode rotation in THEORY lessons.
  lessonOrdinal: number;
};

type LessonGenerator = (ctx: LessonGenerationContext) => Promise<void>;

async function generateAndSaveTheory(ctx: LessonGenerationContext): Promise<void> {
  const baseInput = {
    language: ctx.language,
    topic: ctx.topic,
    moduleTitle: ctx.moduleTitle,
    lessonTitle: ctx.lessonTitle,
    sandboxTemplate: ctx.domainContext.sandboxTemplate,
    relevantDemos: ctx.domainContext.relevantDemos,
    tone: ctx.domainContext.tone,
    maturityRating: ctx.maturityRating,
    // RULE: AI-08 — drives opener-mode rotation for structural variety across THEORY lessons.
    lessonOrdinal: ctx.lessonOrdinal,
  };

  // RULE: AI-04 — domain classifier injects sandbox/demo opt-in per lesson
  let result = await generateTheoryLesson(baseInput);

  // RULE: CONTENT-09 — detect refusal and retry with stronger academic frame; never persist refusal text
  if (isRefusalText(result.text, result.stopReason)) {
    console.warn(
      "[REFUSAL_DETECTED]",
      JSON.stringify({ lessonId: ctx.lessonId, lessonTitle: ctx.lessonTitle, attempt: 1 })
    );
    result = await generateTheoryLesson({ ...baseInput, retryWithStrongerFrame: true });
    if (isRefusalText(result.text, result.stopReason)) {
      console.error(
        "[REFUSAL_RETRY_FAILED]",
        JSON.stringify({ lessonId: ctx.lessonId, lessonTitle: ctx.lessonTitle })
      );
      await db.lesson.update({ where: { id: ctx.lessonId }, data: { generationFailed: true } });
      return;
    }
    console.info(
      "[REFUSAL_RETRY]",
      JSON.stringify({ lessonId: ctx.lessonId, lessonTitle: ctx.lessonTitle, outcome: "success" })
    );
  }

  const content = result.text;
  ctx.generatedTextParts.push(content);
  await db.lesson.update({ where: { id: ctx.lessonId }, data: { content } });
}

// RULE: AI-08 — bounded retry for Bloom distribution; non-fatal fallback on exhaustion.
const MAX_QUIZ_RETRIES = 2;

async function generateAndSaveQuiz(ctx: LessonGenerationContext): Promise<void> {
  const quizInput = {
    language: ctx.language,
    topic: ctx.topic,
    moduleTitle: ctx.moduleTitle,
  };

  let questions = await generateQuiz(quizInput);
  let attempt = 0;

  while (!validateBloomDistribution(questions) && attempt < MAX_QUIZ_RETRIES) {
    attempt++;
    console.warn(
      "[quiz-bloom-retry]",
      JSON.stringify({
        lessonId: ctx.lessonId,
        attempt,
        distinctLevels: new Set(questions.map((q) => q.bloomLevel)).size,
      })
    );
    questions = await generateQuiz(quizInput);
  }

  if (!validateBloomDistribution(questions)) {
    // Non-fatal: accept last attempt and log — never block course generation.
    console.warn(
      "[quiz-bloom-fallback]",
      JSON.stringify({
        lessonId: ctx.lessonId,
        msg: "Bloom spread not achieved after retries; accepting last attempt",
      })
    );
  }

  ctx.generatedTextParts.push(questions.map((q) => q.question).join(" "));
  await db.quizQuestion.createMany({
    // bloomLevel is validated above and discarded before DB write — NOT a persisted column.
    data: questions.map(({ bloomLevel: _bloom, ...q }, idx) => ({
      lessonId: ctx.lessonId,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      order: idx,
    })),
  });
}

async function generateAndSavePractice(ctx: LessonGenerationContext): Promise<void> {
  const result = await generatePracticeLesson({
    language: ctx.language,
    topic: ctx.topic,
    moduleTitle: ctx.moduleTitle,
    lessonTitle: ctx.lessonTitle,
    tone: ctx.domainContext.tone,
  });
  const content = result.text;
  // Push for content safety classification — RULE: CONTENT-02/03
  ctx.generatedTextParts.push(content);
  await db.lesson.update({ where: { id: ctx.lessonId }, data: { content } });
}

async function generateAndSaveCaseStudy(ctx: LessonGenerationContext): Promise<void> {
  const result = await generateCaseStudyLesson({
    language: ctx.language,
    topic: ctx.topic,
    moduleTitle: ctx.moduleTitle,
    lessonTitle: ctx.lessonTitle,
    tone: ctx.domainContext.tone,
  });
  const content = result.text;
  // Push for content safety classification — RULE: CONTENT-02/03
  ctx.generatedTextParts.push(content);
  await db.lesson.update({ where: { id: ctx.lessonId }, data: { content } });
}

async function generateAndSaveReflection(ctx: LessonGenerationContext): Promise<void> {
  const result = await generateReflectionLesson({
    language: ctx.language,
    topic: ctx.topic,
    moduleTitle: ctx.moduleTitle,
    lessonTitle: ctx.lessonTitle,
  });
  const content = result.text;
  // Push for content safety classification — RULE: CONTENT-02/03
  ctx.generatedTextParts.push(content);
  await db.lesson.update({ where: { id: ctx.lessonId }, data: { content } });
}

// RULE: AI-01 — output de LLM validado via Zod antes de persistir
const LESSON_GENERATORS: Partial<Record<string, LessonGenerator>> = {
  THEORY: generateAndSaveTheory,
  QUIZ: generateAndSaveQuiz,
  PRACTICE: generateAndSavePractice,
  CASE_STUDY: generateAndSaveCaseStudy,
  REFLECTION: generateAndSaveReflection,
  // RULE: AI-07 — LAB generation gated by ENABLE_LAB_GENERATION; PROJECT still skipped
  LAB: async (ctx) => {
    if (process.env.ENABLE_LAB_GENERATION !== "true") {
      // RULE: AI-07 — feature flag off → no-op; outline fallback converts LAB→THEORY
      console.info(
        "[LAB_GENERATION_SKIPPED]",
        JSON.stringify({ lessonId: ctx.lessonId, reason: "flag_off" })
      );
      return;
    }
    if (!ctx.labVariant) {
      throw new Error(`LAB lesson requires labVariant (lessonId="${ctx.lessonId}")`);
    }
    try {
      // RULE: AI-01 — all LLM output Zod-validated via generator
      await generateAndSaveLab({
        language: ctx.language as "pt" | "en",
        topic: ctx.topic,
        moduleTitle: ctx.moduleTitle,
        lessonTitle: ctx.lessonTitle,
        lessonId: ctx.lessonId,
        domainHint: ctx.domainContext.domain,
        labVariant: ctx.labVariant,
      });
    } catch (err) {
      console.error(
        "[LAB_GENERATION_FAILED]",
        JSON.stringify({
          lessonId: ctx.lessonId,
          labVariant: ctx.labVariant,
          error: err instanceof Error ? err.message : String(err),
        })
      );
      // Fall back to THEORY generation so course remains coherent even if lab fails
      await generateAndSaveTheory(ctx);
    }
  },
};

export type GenerationEvent =
  | { type: "ingesting" }
  | { type: "searching" }
  | { type: "outline"; outline: CourseOutline }
  | { type: "course_created"; courseSlug: string; courseId: string }
  | { type: "lesson_start"; moduleIndex: number; lessonIndex: number; title: string }
  | { type: "lesson_done"; moduleIndex: number; lessonIndex: number }
  | { type: "done"; courseSlug: string; courseId: string }
  | { type: "review_required"; courseId: string }
  | { type: "error"; message: string };

export async function generateCourse(
  topic: string,
  userId: string,
  customContext: string | undefined,
  emit: (event: GenerationEvent) => void,
  sources?: IngestSource[],
  language = "pt",
  scope = "COMPLETE"
) {
  let courseId: string | undefined;

  try {
    // RULE: CONTENT-01 — sanitize input before any LLM call
    const topicCheck = checkInputSafety(topic);
    if (topicCheck.status === "blocked") {
      emit({ type: "error", message: SAFETY_MESSAGES[topicCheck.reason] });
      return;
    }
    if (customContext) {
      const contextCheck = checkInputSafety(customContext);
      if (contextCheck.status === "blocked") {
        emit({ type: "error", message: SAFETY_MESSAGES[contextCheck.reason] });
        return;
      }
    }

    // 1. Extract source content (if provided) + search
    let sourcesContext: string | undefined;
    if (sources && sources.length > 0) {
      emit({ type: "ingesting" });
      const extracted = await Promise.all(sources.map(extractSourceContent));
      sourcesContext = extracted
        .map((r, i) => `## Source ${i + 1}${r.title ? `: ${r.title}` : ""}\n${r.text}`)
        .join("\n\n");
    }

    const hasSources = sources && sources.length > 0;

    emit({ type: "searching" });

    let researchContext: string | undefined;
    if (!hasSources) {
      const tv = tavily({ apiKey: process.env.TAVILY_API_KEY! });
      const searchResults = await tv.search(
        buildResearchQuery(topic || "online course", language),
        { searchDepth: "advanced", maxResults: 6 }
      );
      researchContext = searchResults.results
        .map((r) => `## ${r.title}\n${r.content}`)
        .join("\n\n");
    }

    // 2. Classify domain — RULE: AI-04 — Haiku classifier runs before outline to inject context-aware block instructions
    const domainContext = await classifyDomain({ topic });

    // 3. Generate outline — Tool Use + cacheable system prefix
    // RULE: AI-01 — structured output via tool_use, validated by Zod
    // RULE: CONTENT-01 — user inputs wrapped in [DATA] delimiters via spec
    const outline = await generateOutline({
      language,
      topic,
      scope,
      customContext,
      sourcesContext,
      researchContext,
      suggestedEmphasis: domainContext.suggestedEmphasis,
    });

    // RULE: CONTENT-06 — AI classifies maturity; pattern-match is a safety upgrade
    const maturityRating: "GENERAL" | "MATURE" =
      outline.maturityRating === "MATURE" || detectSensitiveTopic(topic) ? "MATURE" : "GENERAL";

    emit({ type: "outline", outline });

    // 4. Create course + modules + lessons in DB
    const courseSlugBase = toSlug(outline.title);
    const uniqueSuffix = Date.now().toString(36);
    const courseSlug = `${courseSlugBase}-${uniqueSuffix}`;

    const course = await db.course.create({
      data: {
        slug: courseSlug,
        title: outline.title,
        description: outline.description,
        topic: toSlug(topic),
        tags: outline.tags,
        difficulty: outline.difficulty as Difficulty,
        estimatedHours: outline.estimatedHours,
        scope: scope as CourseScope, // RULE: COURSE-06
        maturityRating, // RULE: CONTENT-06
        status: "GENERATING",
        sourceType: "AI_GENERATED",
        generationPrompt: `${topic}${customContext ? `\n${customContext}` : ""}${sources?.length ? `\nsources: ${sources.map((s) => (s.type === "text" ? "[text paste]" : s.url)).join(", ")}` : ""}`,
        language,
        createdById: userId,
      },
    });
    courseId = course.id;

    const dbModules = await Promise.all(
      outline.modules.map((mod, i) =>
        db.module.create({
          data: {
            courseId: course.id,
            slug: toSlug(mod.title, String(i + 1)),
            title: mod.title,
            description: mod.description,
            order: i,
          },
        })
      )
    );

    // Create all lesson shells upfront — retries within a lesson update shells, never duplicate them
    const dbLessons = await Promise.all(
      outline.modules.flatMap((mod, mi) =>
        mod.lessons.map((lesson, li) =>
          db.lesson.create({
            data: {
              moduleId: dbModules[mi].id,
              slug: toSlug(lesson.title, String(li + 1)),
              title: lesson.title,
              type: lesson.type,
              order: li,
              labVariant: lesson.labVariant ?? null,
            },
          })
        )
      )
    );

    await db.enrollment.create({ data: { userId, courseId: course.id } });

    emit({ type: "course_created", courseSlug: courseSlug, courseId: course.id });

    // 5. Generate content for each lesson
    const generatedTextParts: string[] = [];
    let lessonIndex = 0;

    for (let mi = 0; mi < outline.modules.length; mi++) {
      const mod = outline.modules[mi];
      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li];
        const lessonOrdinal = lessonIndex;
        const dbLesson = dbLessons[lessonIndex++];

        emit({ type: "lesson_start", moduleIndex: mi, lessonIndex: li, title: lesson.title });

        const generator = LESSON_GENERATORS[lesson.type] ?? LESSON_GENERATORS.THEORY;
        if (!LESSON_GENERATORS[lesson.type]) {
          console.warn(
            JSON.stringify({
              msg: "lesson_generator_missing_fallback_theory",
              type: lesson.type,
              lessonId: dbLesson.id,
            })
          );
        }
        await generator!({
          language,
          topic,
          moduleTitle: mod.title,
          lessonTitle: lesson.title,
          lessonId: dbLesson.id,
          domainContext,
          generatedTextParts,
          maturityRating,
          labVariant: lesson.labVariant,
          lessonOrdinal,
        });

        emit({ type: "lesson_done", moduleIndex: mi, lessonIndex: li });
      }
    }

    // 6. Classify generated content before publishing — RULE: CONTENT-02/03
    const allGeneratedText = generatedTextParts.join("\n\n");
    const classification = classifyGeneratedContent(allGeneratedText);

    if (classification.verdict === "blocked") {
      // RULE: CONTENT-02 — never publish blocked content
      await db.course.update({
        where: { id: course.id },
        data: { status: "DRAFT", requiresReview: true },
      });
      emit({ type: "error", message: SAFETY_MESSAGES.content_blocked });
      return;
    }

    if (classification.verdict === "restricted") {
      // RULE: CONTENT-03 — restricted stays as DRAFT for manual review
      await db.course.update({
        where: { id: course.id },
        data: { status: "DRAFT", requiresReview: true, reviewReason: "CONTENT_RESTRICTED" },
      });
      emit({ type: "review_required", courseId: course.id });
      return;
    }

    // RULE: CONTENT-09 — if any lesson had a persistent refusal, flag course for review
    const failedLessonCount = await db.lesson.count({
      where: { moduleId: { in: dbModules.map((m) => m.id) }, generationFailed: true },
    });
    if (failedLessonCount > 0) {
      await db.course.update({
        where: { id: course.id },
        data: { status: "DRAFT", requiresReview: true, reviewReason: "GENERATION_INCOMPLETE" },
      });
      emit({ type: "review_required", courseId: course.id });
      return;
    }

    // 7. Publish
    await db.course.update({
      where: { id: course.id },
      data: { status: "PUBLISHED", totalEnrollments: 1 }, // RULE: COURSE-03
    });

    emit({ type: "done", courseSlug: course.slug, courseId: course.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[GENERATION_FAILED]", JSON.stringify({ topic, courseId, message }));

    // RULE: COURSE-05 — revert to DRAFT on error, never leave stuck in GENERATING
    if (courseId) {
      await db.course
        .update({ where: { id: courseId }, data: { status: "DRAFT" } })
        .catch(() => {});
    }

    emit({ type: "error", message });
  }
}

// ─── Single-lesson generation (Phase 1: lesson-chunked pipeline) ─────────────

export type SingleLessonInput = {
  lessonId: string;
  lessonType: string;
  language: string;
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  maturityRating?: "GENERAL" | "MATURE";
  labVariant?: "CTF" | "INTERACTIVE";
  lessonOrdinal: number;
};

// Generates content for a single lesson and persists it to the DB.
// Callers own LessonGenerationStatus transitions and generatingLessonCount mutations.
export async function generateSingleLesson(input: SingleLessonInput): Promise<void> {
  const domainContext = await classifyDomain({ topic: input.topic });

  const generator = LESSON_GENERATORS[input.lessonType] ?? LESSON_GENERATORS.THEORY!;
  if (!LESSON_GENERATORS[input.lessonType]) {
    console.warn(
      JSON.stringify({
        msg: "lesson_generator_missing_fallback_theory",
        type: input.lessonType,
        lessonId: input.lessonId,
      })
    );
  }

  await generator({
    language: input.language,
    topic: input.topic,
    moduleTitle: input.moduleTitle,
    lessonTitle: input.lessonTitle,
    lessonId: input.lessonId,
    domainContext,
    generatedTextParts: [],
    maturityRating: input.maturityRating,
    labVariant: input.labVariant,
    lessonOrdinal: input.lessonOrdinal,
  });
}

export async function resumeCourse(
  courseId: string,
  userId: string,
  emit: (event: GenerationEvent) => void
) {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: { lab: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!course || course.createdById !== userId) {
      emit({ type: "error", message: "Curso não encontrado." });
      return;
    }
    if (course.status !== "DRAFT" || !course.requiresReview) {
      emit({ type: "error", message: "Este curso não pode ser retomado." });
      return;
    }

    // Reset course to GENERATING — resume is idempotent (skips lessons with content)
    await db.course.update({
      where: { id: courseId },
      data: { status: "GENERATING", requiresReview: false, reviewReason: null },
    });
    await db.lesson.updateMany({
      where: { module: { courseId }, generationFailed: true },
      data: { generationFailed: false },
    });

    const domainContext = await classifyDomain({ topic: course.title });
    const maturityRating = course.maturityRating as "GENERAL" | "MATURE";
    const language = course.language ?? "pt";
    const topic = course.generationPrompt?.split("\n")[0] ?? course.title;

    const generatedTextParts: string[] = [];
    let lessonOrdinal = 0;

    for (let mi = 0; mi < course.modules.length; mi++) {
      const mod = course.modules[mi];
      for (let li = 0; li < mod.lessons.length; li++) {
        const dbLesson = mod.lessons[li];
        const currentOrdinal = lessonOrdinal++;

        const alreadyGenerated =
          dbLesson.content !== null || (dbLesson.type === "LAB" && dbLesson.lab !== null);
        if (alreadyGenerated) {
          if (dbLesson.content !== null) generatedTextParts.push(dbLesson.content);
          continue;
        }

        emit({ type: "lesson_start", moduleIndex: mi, lessonIndex: li, title: dbLesson.title });

        const generator = LESSON_GENERATORS[dbLesson.type] ?? LESSON_GENERATORS.THEORY!;
        await generator({
          language,
          topic,
          moduleTitle: mod.title,
          lessonTitle: dbLesson.title,
          lessonId: dbLesson.id,
          domainContext,
          generatedTextParts,
          maturityRating,
          labVariant: (dbLesson.labVariant as "CTF" | "INTERACTIVE" | undefined) ?? undefined,
          lessonOrdinal: currentOrdinal,
        });

        emit({ type: "lesson_done", moduleIndex: mi, lessonIndex: li });
      }
    }

    // Classify + publish (same logic as generateCourse)
    const allGeneratedText = generatedTextParts.join("\n\n");
    const classification = classifyGeneratedContent(allGeneratedText);

    if (classification.verdict === "blocked") {
      await db.course.update({
        where: { id: courseId },
        data: { status: "DRAFT", requiresReview: true },
      });
      emit({ type: "error", message: SAFETY_MESSAGES.content_blocked });
      return;
    }

    if (classification.verdict === "restricted") {
      await db.course.update({
        where: { id: courseId },
        data: { status: "DRAFT", requiresReview: true, reviewReason: "CONTENT_RESTRICTED" },
      });
      emit({ type: "review_required", courseId });
      return;
    }

    const failedLessonCount = await db.lesson.count({
      where: { module: { courseId }, generationFailed: true },
    });
    if (failedLessonCount > 0) {
      await db.course.update({
        where: { id: courseId },
        data: { status: "DRAFT", requiresReview: true, reviewReason: "GENERATION_INCOMPLETE" },
      });
      emit({ type: "review_required", courseId });
      return;
    }

    await db.course.update({
      where: { id: courseId },
      data: { status: "PUBLISHED" },
    });
    emit({ type: "done", courseSlug: course.slug, courseId });
  } catch (err) {
    console.error("[RESUME_COURSE_ERROR]", err instanceof Error ? err.message : String(err));
    emit({ type: "error", message: "Erro ao retomar a geração." });
  }
}
