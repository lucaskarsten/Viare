import { z } from "zod";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { tavily } from "@tavily/core";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkInputSafety, classifyGeneratedContent, SAFETY_MESSAGES } from "@/lib/content-safety";
import { toSlug } from "@/lib/slug";
import { buildResearchQuery } from "@/lib/prompts/language";
import { generateEnrichModules } from "@/lib/prompts/specs/enrich-modules";
import { generateTheoryLesson } from "@/lib/prompts/specs/theory";
import { generateQuiz } from "@/lib/prompts/specs/quiz";
import { isPro } from "@/lib/subscription";
import type { QuizQuestions } from "@/lib/prompts/schemas";

type Params = Promise<{ slug: string }>;

export const maxDuration = 300;

const EnrichBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("append-modules") }),
  z
    .object({
      action: z.literal("insert-lesson"),
      moduleId: z.string().min(1),
      referenceLessonId: z.string().min(1),
      position: z.enum(["before", "after"]),
      lessonType: z.enum(["THEORY", "QUIZ", "LAB", "CASE_STUDY", "PRACTICE", "REFLECTION"]),
      labVariant: z.enum(["CTF", "INTERACTIVE"]).optional(),
      topicHint: z.string().optional(),
    })
    .refine((d) => d.lessonType !== "LAB" || d.labVariant !== undefined, {
      message: "labVariant required when lessonType is LAB",
      path: ["labVariant"],
    }),
]);

type PreparedAppendModules = {
  action: "append-modules";
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{
      title: string;
      type: string;
      content: string | null;
      quiz: QuizQuestions | null;
    }>;
  }>;
};

type PreparedInsertLesson = {
  action: "insert-lesson";
  lesson: {
    title: string;
    type: string;
    content: string | null;
    quiz: QuizQuestions | null;
  };
  placementModule: { id: string; order: number };
  insertOrder: number;
};

type Prepared = PreparedAppendModules | PreparedInsertLesson;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  // Parse body — default to append-modules for backward compat if body is empty
  const rawBody = await _req.json().catch(() => ({}));
  const bodyParse = EnrichBodySchema.safeParse(
    Object.keys(rawBody).length === 0 ? { action: "append-modules" } : rawBody
  );
  if (!bodyParse.success) {
    return NextResponse.json(
      { error: "invalid_body", details: bodyParse.error.issues },
      { status: 400 }
    );
  }
  const body = bodyParse.data;

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: { orderBy: { order: "asc" }, select: { id: true, order: true, title: true } },
    },
  });
  if (!course) return new Response("Not found", { status: 404 });

  const isCreator = course.createdById === session.user.id;
  if (!isCreator) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      select: { id: true },
    });
    if (!enrollment) return new Response("Forbidden", { status: 403 });
  }

  if (course.status !== "PUBLISHED") {
    return new Response("Course is not published", { status: 400 });
  }

  // RULE: SUB-03 — Pro gate before LLM cost
  if (!(await isPro(session.user.id))) {
    return NextResponse.json({ error: "pro_required", upgradeUrl: "/pricing" }, { status: 403 });
  }

  // RULE: CA-D2 — per-course enrichCount cap, max 20
  if (course.enrichCount >= 20) {
    console.info(
      "[ENRICH_CAP_REACHED]",
      JSON.stringify({ courseId: course.id, enrichCount: course.enrichCount })
    );
    return NextResponse.json({ error: "enrich_limit_reached" }, { status: 429 });
  }

  // RULE: CONTENT-01 — sanitize course metadata before LLM calls
  const titleCheck = checkInputSafety(course.title);
  if (titleCheck.status === "blocked") {
    return NextResponse.json({ error: SAFETY_MESSAGES[titleCheck.reason] }, { status: 400 });
  }
  const topicCheck = checkInputSafety(course.topic);
  if (topicCheck.status === "blocked") {
    return NextResponse.json({ error: SAFETY_MESSAGES[topicCheck.reason] }, { status: 400 });
  }

  console.info(
    "[ENRICH_REQUESTED]",
    JSON.stringify({ action: body.action, courseId: course.id, slug })
  );

  const language = course.language ?? "pt";
  const courseTopic = course.topic || toSlug(course.title);
  const generatedTextParts: string[] = [];

  // =======================
  // FASE 1 — all LLM/Tavily calls, accumulate in memory. NO DB WRITES. NO $transaction.
  // =======================
  let prepared: Prepared;

  try {
    if (body.action === "append-modules") {
      const tv = tavily({ apiKey: process.env.TAVILY_API_KEY! });
      const searchResults = await tv.search(buildResearchQuery(courseTopic, language), {
        searchDepth: "basic",
        maxResults: 4,
      });
      const researchContext = searchResults.results
        .map((r) => `## ${r.title}\n${r.content}`)
        .join("\n\n");

      const newModules = await generateEnrichModules({
        language,
        courseTitle: course.title,
        existingModuleCount: course.modules.length,
        researchContext,
      });

      const modulesWithContent: PreparedAppendModules["modules"] = [];

      for (const mod of newModules) {
        const lessons: PreparedAppendModules["modules"][number]["lessons"] = [];

        for (const lesson of mod.lessons) {
          if (lesson.type === "THEORY") {
            const { text: content } = await generateTheoryLesson({
              language,
              topic: courseTopic,
              moduleTitle: mod.title,
              lessonTitle: lesson.title,
              sandboxTemplate: null,
              relevantDemos: [],
              tone: "practical",
            });
            generatedTextParts.push(content);
            lessons.push({ title: lesson.title, type: lesson.type, content, quiz: null });
          } else if (lesson.type === "QUIZ") {
            const questions = await generateQuiz({
              language,
              topic: courseTopic,
              moduleTitle: mod.title,
            });
            generatedTextParts.push(questions.map((q) => q.question).join(" "));
            lessons.push({
              title: lesson.title,
              type: lesson.type,
              content: null,
              quiz: questions,
            });
          } else if (lesson.type === "LAB") {
            // V1: LAB generation in enrich flow requires out-of-scope refactor; fall back to THEORY
            console.warn(
              "[ENRICH_LAB_SKIPPED]",
              JSON.stringify({ courseId: course.id, lessonTitle: lesson.title })
            );
            const { text: content } = await generateTheoryLesson({
              language,
              topic: courseTopic,
              moduleTitle: mod.title,
              lessonTitle: lesson.title,
              sandboxTemplate: null,
              relevantDemos: [],
              tone: "practical",
            });
            generatedTextParts.push(content);
            lessons.push({ title: lesson.title, type: "THEORY", content, quiz: null });
          } else {
            // CASE_STUDY, REFLECTION, PRACTICE — theory-style generation
            const { text: content } = await generateTheoryLesson({
              language,
              topic: courseTopic,
              moduleTitle: mod.title,
              lessonTitle: lesson.title,
              sandboxTemplate: null,
              relevantDemos: [],
              tone: "practical",
            });
            generatedTextParts.push(content);
            lessons.push({ title: lesson.title, type: lesson.type, content, quiz: null });
          }
        }

        modulesWithContent.push({ title: mod.title, description: mod.description, lessons });
      }

      prepared = { action: "append-modules", modules: modulesWithContent };
    } else {
      // insert-lesson branch
      const placementModule = course.modules.find((m) => m.id === body.moduleId);
      if (!placementModule) {
        return NextResponse.json({ error: "module_not_found" }, { status: 404 });
      }

      const siblings = await db.lesson.findMany({
        where: { moduleId: body.moduleId },
        select: { id: true, order: true },
        orderBy: { order: "asc" },
      });
      const refLesson = siblings.find((l) => l.id === body.referenceLessonId);
      if (!refLesson) {
        return NextResponse.json({ error: "reference_lesson_not_found" }, { status: 404 });
      }

      const insertOrder = body.position === "before" ? refLesson.order : refLesson.order + 1;
      const title = body.topicHint || `New ${body.lessonType} lesson`;

      let generatedLesson: PreparedInsertLesson["lesson"];

      if (body.lessonType === "THEORY") {
        const { text: content } = await generateTheoryLesson({
          language,
          topic: courseTopic,
          moduleTitle: placementModule.title ?? "",
          lessonTitle: title,
          sandboxTemplate: null,
          relevantDemos: [],
          tone: "practical",
        });
        generatedTextParts.push(content);
        generatedLesson = { title, type: "THEORY", content, quiz: null };
      } else if (body.lessonType === "QUIZ") {
        const questions = await generateQuiz({
          language,
          topic: courseTopic,
          moduleTitle: placementModule.title ?? "",
        });
        generatedTextParts.push(questions.map((q) => q.question).join(" "));
        generatedLesson = { title, type: "QUIZ", content: null, quiz: questions };
      } else if (body.lessonType === "LAB") {
        // V1: LAB fallback to THEORY in insert-lesson flow
        console.warn(
          "[ENRICH_LAB_SKIPPED]",
          JSON.stringify({ courseId: course.id, lessonTitle: title })
        );
        const { text: content } = await generateTheoryLesson({
          language,
          topic: courseTopic,
          moduleTitle: placementModule.title ?? "",
          lessonTitle: title,
          sandboxTemplate: null,
          relevantDemos: [],
          tone: "practical",
        });
        generatedTextParts.push(content);
        generatedLesson = { title, type: "THEORY", content, quiz: null };
      } else {
        // CASE_STUDY, PRACTICE, REFLECTION — theory-style generation
        const { text: content } = await generateTheoryLesson({
          language,
          topic: courseTopic,
          moduleTitle: placementModule.title ?? "",
          lessonTitle: title,
          sandboxTemplate: null,
          relevantDemos: [],
          tone: "practical",
        });
        generatedTextParts.push(content);
        generatedLesson = { title, type: body.lessonType, content, quiz: null };
      }

      prepared = { action: "insert-lesson", lesson: generatedLesson, placementModule, insertOrder };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error(
      "[ENRICH_FASE1_FAILED]",
      JSON.stringify({ action: body.action, courseId: course.id, error: message })
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // RULE: AI-01 — classifyGeneratedContent gates persist
  const allText = generatedTextParts.join("\n\n");
  const classification = classifyGeneratedContent(allText);

  if (classification.verdict === "blocked") {
    return NextResponse.json({ error: SAFETY_MESSAGES.content_blocked }, { status: 422 });
  }

  // =======================
  // FASE 2 — DB writes only, inside short $transaction. NO LLM/TAVILY here.
  // RULE: PROG-01 — baseLessonCount snapshot before new lessons
  // =======================
  const createdModuleIds: string[] = [];
  const writeStart = Date.now();

  try {
    await db.$transaction(
      async (tx) => {
        // RULE: PROG-01 — snapshot baseLessonCount for existing enrollments before adding new lessons
        const currentTotal = await tx.lesson.count({
          where: { module: { courseId: course.id } },
        });
        await tx.enrollment.updateMany({
          where: { courseId: course.id, baseLessonCount: null },
          data: { baseLessonCount: currentTotal },
        });

        if (prepared.action === "append-modules") {
          const nextOrder = course.modules.length;

          for (let mi = 0; mi < prepared.modules.length; mi++) {
            const mod = prepared.modules[mi];
            const dbModule = await tx.module.create({
              data: {
                courseId: course.id,
                slug: toSlug(mod.title, String(nextOrder + mi + 1)),
                title: mod.title,
                description: mod.description,
                order: nextOrder + mi,
              },
            });
            createdModuleIds.push(dbModule.id);

            for (let li = 0; li < mod.lessons.length; li++) {
              const lesson = mod.lessons[li];
              const dbLesson = await tx.lesson.create({
                data: {
                  moduleId: dbModule.id,
                  courseId: course.id,
                  slug: toSlug(lesson.title, String(li + 1)),
                  title: lesson.title,
                  type: lesson.type as never,
                  order: li,
                  ...(lesson.content ? { content: lesson.content } : {}),
                },
              });
              if (lesson.quiz) {
                await tx.quizQuestion.createMany({
                  data: lesson.quiz.map((q, idx) => ({
                    lessonId: dbLesson.id,
                    question: q.question,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation,
                    order: idx,
                  })),
                });
              }
            }
          }
        } else {
          // insert-lesson: reorder siblings at or after insertOrder, then create new lesson
          await tx.lesson.updateMany({
            where: {
              moduleId: prepared.placementModule.id,
              order: { gte: prepared.insertOrder },
            },
            data: { order: { increment: 1 } },
          });

          const dbLesson = await tx.lesson.create({
            data: {
              moduleId: prepared.placementModule.id,
              courseId: course.id,
              slug: toSlug(prepared.lesson.title, String(prepared.insertOrder + 1)),
              title: prepared.lesson.title,
              type: prepared.lesson.type as never,
              order: prepared.insertOrder,
              ...(prepared.lesson.content ? { content: prepared.lesson.content } : {}),
            },
          });

          if (prepared.lesson.quiz) {
            await tx.quizQuestion.createMany({
              data: prepared.lesson.quiz.map((q, idx) => ({
                lessonId: dbLesson.id,
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                order: idx,
              })),
            });
          }
        }

        await tx.course.update({
          where: { id: course.id },
          data: { enrichCount: { increment: 1 } },
        });
      },
      { timeout: 10000, maxWait: 5000 }
    );
  } catch (err) {
    // FASE 3 — compensation: transaction rollback is automatic; deleteMany is a safety net for edge cases
    if (createdModuleIds.length > 0) {
      await db.module.deleteMany({ where: { id: { in: createdModuleIds } } }).catch(() => {});
    }
    const message = err instanceof Error ? err.message : "Enrichment failed";
    console.error(
      "[ENRICH_FAILED]",
      JSON.stringify({ action: body.action, courseId: course.id, error: message })
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const writeDuration = Date.now() - writeStart;
  console.info(
    "[ENRICH_DB_WRITE_DURATION]",
    JSON.stringify({ action: body.action, courseId: course.id, durationMs: writeDuration })
  );

  if (classification.verdict === "restricted") {
    await db.course.update({ where: { id: course.id }, data: { requiresReview: true } });
  }

  // RULE: revalidate cache after mutation
  revalidatePath(`/courses/${slug}`);
  revalidatePath(`/courses/${slug}/lessons`);

  console.info(
    "[ENRICH_INSERTED]",
    JSON.stringify({
      action: body.action,
      courseId: course.id,
      enrichCount: course.enrichCount + 1,
    })
  );

  if (prepared.action === "append-modules") {
    return NextResponse.json({
      addedModules: prepared.modules.length,
      enrichCount: course.enrichCount + 1,
    });
  } else {
    return NextResponse.json({
      addedLesson: 1,
      moduleId: prepared.placementModule.id,
      enrichCount: course.enrichCount + 1,
    });
  }
}
