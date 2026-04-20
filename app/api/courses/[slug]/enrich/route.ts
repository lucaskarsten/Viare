import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { tavily } from "@tavily/core";
import { NextResponse } from "next/server";
import { checkInputSafety, classifyGeneratedContent, SAFETY_MESSAGES } from "@/lib/content-safety";
import { toSlug } from "@/lib/slug";
import { buildResearchQuery } from "@/lib/prompts/language";
import { generateEnrichModules } from "@/lib/prompts/specs/enrich-modules";
import { generateTheoryLesson } from "@/lib/prompts/specs/theory";
import { generateQuiz } from "@/lib/prompts/specs/quiz";

type Params = Promise<{ slug: string }>;

export const maxDuration = 300;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: { orderBy: { order: "asc" }, select: { id: true, order: true } },
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

  // RULE: CONTENT-01 — sanitize course metadata before LLM calls
  const titleCheck = checkInputSafety(course.title);
  if (titleCheck.status === "blocked") {
    return NextResponse.json({ error: SAFETY_MESSAGES[titleCheck.reason] }, { status: 400 });
  }
  const topicCheck = checkInputSafety(course.topic);
  if (topicCheck.status === "blocked") {
    return NextResponse.json({ error: SAFETY_MESSAGES[topicCheck.reason] }, { status: 400 });
  }

  const language = course.language ?? "pt";
  const courseTopic = course.topic || toSlug(course.title);

  const tv = tavily({ apiKey: process.env.TAVILY_API_KEY! });
  const searchResults = await tv.search(buildResearchQuery(courseTopic, language), {
    searchDepth: "basic",
    maxResults: 4,
  });
  const researchContext = searchResults.results
    .map((r) => `## ${r.title}\n${r.content}`)
    .join("\n\n");

  const existingModuleCount = course.modules.length;
  const nextOrder = existingModuleCount;

  const newModules = await generateEnrichModules({
    language,
    courseTitle: course.title,
    existingModuleCount,
    researchContext,
  });

  // RULE: COURSE-05 — track created modules for rollback on partial failure
  const createdModuleIds: string[] = [];
  const generatedTextParts: string[] = [];

  try {
    for (let mi = 0; mi < newModules.length; mi++) {
      const mod = newModules[mi];
      const dbModule = await db.module.create({
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
        const dbLesson = await db.lesson.create({
          data: {
            moduleId: dbModule.id,
            slug: toSlug(lesson.title, String(li + 1)),
            title: lesson.title,
            type: lesson.type,
            order: li,
          },
        });

        if (lesson.type === "THEORY") {
          const content = await generateTheoryLesson({
            language,
            topic: courseTopic,
            moduleTitle: mod.title,
            lessonTitle: lesson.title,
            // Enrich reuses the course's established domain; we don't re-classify.
            sandboxTemplate: null,
            relevantDemos: [],
            tone: "practical",
          });
          generatedTextParts.push(content);
          await db.lesson.update({ where: { id: dbLesson.id }, data: { content } });
        } else {
          const questions = await generateQuiz({
            language,
            topic: courseTopic,
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
      }
    }

    // RULE: CONTENT-02/03 — classify enriched content before exposing it
    const allGeneratedText = generatedTextParts.join("\n\n");
    const classification = classifyGeneratedContent(allGeneratedText);

    if (classification.verdict === "blocked") {
      await db.module.deleteMany({ where: { id: { in: createdModuleIds } } });
      return NextResponse.json({ error: SAFETY_MESSAGES.content_blocked }, { status: 422 });
    }

    if (classification.verdict === "restricted") {
      await db.course.update({
        where: { id: course.id },
        data: { requiresReview: true },
      });
    }

    return NextResponse.json({ addedModules: createdModuleIds.length });
  } catch (err) {
    if (createdModuleIds.length > 0) {
      await db.module.deleteMany({ where: { id: { in: createdModuleIds } } }).catch(() => {});
    }
    const message = err instanceof Error ? err.message : "Enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
