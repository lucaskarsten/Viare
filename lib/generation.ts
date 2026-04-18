import Anthropic from "@anthropic-ai/sdk";
import { tavily } from "@tavily/core";
import { db } from "@/lib/db";
import { Difficulty } from "@prisma/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

type CourseOutline = {
  title: string;
  description: string;
  estimatedHours: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{
      title: string;
      type: "THEORY" | "QUIZ";
    }>;
  }>;
};

export type GenerationEvent =
  | { type: "searching" }
  | { type: "outline"; outline: CourseOutline }
  | { type: "lesson_start"; moduleIndex: number; lessonIndex: number; title: string }
  | { type: "lesson_done"; moduleIndex: number; lessonIndex: number }
  | { type: "done"; courseSlug: string; courseId: string }
  | { type: "error"; message: string };

export async function generateCourse(
  topic: string,
  userId: string,
  customContext: string | undefined,
  emit: (event: GenerationEvent) => void
) {
  try {
    // 1. Search for content
    emit({ type: "searching" });

    const tv = tavily({ apiKey: process.env.TAVILY_API_KEY! });
    const searchResults = await tv.search(
      `${topic} tutorial course curriculum learn`,
      { searchDepth: "advanced", maxResults: 6 }
    );

    const researchContext = searchResults.results
      .map((r) => `## ${r.title}\n${r.content}`)
      .join("\n\n");

    // 2. Generate outline
    const outlineResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are building a structured online course about: "${topic}"
${customContext ? `\nUser context: ${customContext}` : ""}

Research material:
${researchContext}

Generate a course outline as valid JSON matching this exact structure (no markdown, just JSON):
{
  "title": "Course title",
  "description": "2-3 sentence course description",
  "estimatedHours": 4,
  "difficulty": "EASY",
  "tags": ["tag1", "tag2"],
  "modules": [
    {
      "title": "Module title",
      "description": "1-2 sentence module description",
      "lessons": [
        { "title": "Lesson title", "type": "THEORY" },
        { "title": "Quiz: Module title", "type": "QUIZ" }
      ]
    }
  ]
}

Rules:
- 3 to 5 modules
- 2 to 4 THEORY lessons per module, followed by 1 QUIZ lesson
- difficulty must be one of: EASY, MEDIUM, HARD
- estimatedHours between 2 and 12
- 3 to 6 tags`,
        },
      ],
    });

    const rawJson = (outlineResponse.content[0] as { text: string }).text.trim();
    const outline: CourseOutline = JSON.parse(
      rawJson.startsWith("```") ? rawJson.replace(/```json?\n?|```/g, "") : rawJson
    );

    emit({ type: "outline", outline });

    // 3. Create course + modules + lessons in DB
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
        generationPrompt: topic + (customContext ? `\n${customContext}` : ""),
        createdById: userId,
      },
    });

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

    // Create all lesson shells upfront
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

    // Create enrollment for requesting user
    await db.enrollment.create({
      data: { userId, courseId: course.id },
    });

    // 4. Generate content for each lesson
    let lessonIndex = 0;
    for (let mi = 0; mi < outline.modules.length; mi++) {
      const mod = outline.modules[mi];
      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li];
        const dbLesson = dbLessons[lessonIndex++];

        emit({ type: "lesson_start", moduleIndex: mi, lessonIndex: li, title: lesson.title });

        if (lesson.type === "THEORY") {
          const contentResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            messages: [
              {
                role: "user",
                content: `Write educational markdown content for this lesson: "${lesson.title}"
Course: "${outline.title}" (about ${topic})
Module: "${mod.title}"

Requirements:
- Clear, well-structured markdown
- Include practical examples
- Use headers, bullet points, and code blocks where relevant
- 400 to 800 words
- No introductory meta-text, just the lesson content`,
              },
            ],
          });

          const content = (contentResponse.content[0] as { text: string }).text;
          await db.lesson.update({
            where: { id: dbLesson.id },
            data: { content },
          });
        } else {
          // QUIZ lesson — generate questions
          const quizResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            messages: [
              {
                role: "user",
                content: `Generate 5 multiple-choice quiz questions for a quiz about the module "${mod.title}" in a course about "${topic}".

Return valid JSON array only (no markdown):
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this answer is correct"
  }
]`,
              },
            ],
          });

          const rawQuiz = (quizResponse.content[0] as { text: string }).text.trim();
          const questions: Array<{
            question: string;
            options: string[];
            correctIndex: number;
            explanation: string;
          }> = JSON.parse(
            rawQuiz.startsWith("```") ? rawQuiz.replace(/```json?\n?|```/g, "") : rawQuiz
          );

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

    // 5. Publish
    await db.course.update({
      where: { id: course.id },
      data: { status: "PUBLISHED", totalEnrollments: 1 },
    });

    emit({ type: "done", courseSlug: course.slug, courseId: course.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    emit({ type: "error", message });
  }
}
