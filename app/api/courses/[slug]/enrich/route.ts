import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { tavily } from "@tavily/core";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { NextResponse } from "next/server";

type Params = Promise<{ slug: string }>;

export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const NewModulesSchema = z
  .array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      lessons: z
        .array(z.object({ title: z.string().min(1), type: z.enum(["THEORY", "QUIZ"]) }))
        .min(1),
    })
  )
  .min(1)
  .max(2);

const QuizQuestionsSchema = z.array(
  z.object({
    question: z.string().min(1),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
  })
);

function toSlug(text: string, suffix?: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
  return suffix ? `${base}-${suffix}` : base;
}

function parseJson(raw: string): unknown {
  const clean = raw.startsWith("```") ? raw.replace(/```json?\n?|```/g, "") : raw;
  return JSON.parse(clean.trim());
}

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

  const courseTopic = course.topic ?? toSlug(course.title);
  const tv = tavily({ apiKey: process.env.TAVILY_API_KEY! });
  const searchResults = await tv.search(`${courseTopic} advanced tutorial learn`, {
    searchDepth: "basic",
    maxResults: 4,
  });
  const researchContext = searchResults.results
    .map((r) => `## ${r.title}\n${r.content}`)
    .join("\n\n");

  const existingModuleCount = course.modules.length;
  const nextOrder = existingModuleCount;

  const modulesResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are enriching an existing online course titled "${course.title}".

The course already has ${existingModuleCount} modules. Generate 1-2 NEW modules with additional advanced content that complements what already exists.

Research material:
${researchContext}

Return valid JSON array only (no markdown):
[
  {
    "title": "Module title",
    "description": "1-2 sentence description",
    "lessons": [
      { "title": "Lesson title", "type": "THEORY" },
      { "title": "Quiz: Module title", "type": "QUIZ" }
    ]
  }
]

Rules:
- 1 to 2 new modules only
- 2 to 3 THEORY lessons per module followed by 1 QUIZ
- Content must complement the existing course, not repeat basics
- Return ONLY valid JSON, no markdown fences`,
      },
    ],
  });

  const rawModules = (modulesResponse.content[0] as { text: string }).text.trim();
  const newModules = NewModulesSchema.parse(parseJson(rawModules));

  let addedModules = 0;
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
        const contentResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `Write educational markdown content for the lesson titled "${lesson.title}".
This lesson is part of module "${mod.title}" in a course titled "${course.title}".

Requirements:
- Clear, well-structured markdown
- Include practical examples
- Use headers, bullet points, and code blocks where relevant
- 400 to 800 words
- Educational and informational tone only
- No introductory meta-text, just the lesson content`,
            },
          ],
        });
        const content = (contentResponse.content[0] as { text: string }).text;
        await db.lesson.update({ where: { id: dbLesson.id }, data: { content } });
      } else {
        const quizResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: `Generate 5 multiple-choice quiz questions for module "${mod.title}" in a course titled "${course.title}".

Return valid JSON array only (no markdown):
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this answer is correct"
  }
]

Rules:
- correctIndex must be 0, 1, 2, or 3
- Questions based on practical scenarios
- Return ONLY valid JSON, no markdown fences`,
            },
          ],
        });
        const rawQuiz = (quizResponse.content[0] as { text: string }).text.trim();
        const questions = QuizQuestionsSchema.parse(parseJson(rawQuiz));
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
    addedModules++;
  }

  return NextResponse.json({ addedModules });
}
