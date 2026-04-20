import { tavily } from "@tavily/core";
import { extractSourceContent, type IngestSource } from "@/lib/ingest";
import { db } from "@/lib/db";
import { Difficulty } from "@prisma/client";
import { checkInputSafety, classifyGeneratedContent, SAFETY_MESSAGES } from "@/lib/content-safety";
import { toSlug } from "@/lib/slug";
import { buildResearchQuery } from "@/lib/prompts/language";
import { classifyDomain } from "@/lib/prompts/specs/classifier";
import { generateOutline } from "@/lib/prompts/specs/outline";
import { generateTheoryLesson } from "@/lib/prompts/specs/theory";
import { generateQuiz } from "@/lib/prompts/specs/quiz";
import type { CourseOutline } from "@/lib/prompts/schemas";

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
  language = "pt"
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
      customContext,
      sourcesContext,
      researchContext,
    });

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
        const dbLesson = dbLessons[lessonIndex++];

        emit({ type: "lesson_start", moduleIndex: mi, lessonIndex: li, title: lesson.title });

        if (lesson.type === "THEORY") {
          // RULE: AI-04 — domain classifier injects sandbox/demo opt-in per lesson
          const content = await generateTheoryLesson({
            language,
            topic,
            moduleTitle: mod.title,
            lessonTitle: lesson.title,
            sandboxTemplate: domainContext.sandboxTemplate,
            relevantDemos: domainContext.relevantDemos,
            tone: domainContext.tone,
          });
          generatedTextParts.push(content);

          await db.lesson.update({ where: { id: dbLesson.id }, data: { content } });
        } else {
          // QUIZ lesson — Tool Use + cacheable system prefix
          const questions = await generateQuiz({
            language,
            topic,
            moduleTitle: mod.title,
          });
          generatedTextParts.push(questions.map((q) => q.question).join(" "));

          await db.quizQuestion.createMany({
            data: questions.map((q, idx) => ({
              lessonId: dbLesson.id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              order: idx,
            })),
          });
        }

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
        data: { status: "DRAFT", requiresReview: true },
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

    // RULE: COURSE-05 — revert to DRAFT on error, never leave stuck in GENERATING
    if (courseId) {
      await db.course
        .update({ where: { id: courseId }, data: { status: "DRAFT" } })
        .catch(() => {});
    }

    emit({ type: "error", message });
  }
}
