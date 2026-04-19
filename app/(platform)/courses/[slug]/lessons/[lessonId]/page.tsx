import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import LessonClient from "@/components/LessonClient";
import QuizLesson from "./QuizLesson";
import type { QuizBlockQuestion } from "@/components/QuizBlock";

type Params = Promise<{ slug: string; lessonId: string }>;

function lessonCategory(type: string): string {
  switch (type) {
    case "QUIZ":
      return "Quiz";
    case "LAB":
      return "Lab";
    case "PROJECT":
      return "Projeto";
    default:
      return "Leitura";
  }
}

function lessonEstimatedMinutes(type: string): number {
  switch (type) {
    case "QUIZ":
      return 8;
    case "LAB":
      return 25;
    case "PROJECT":
      return 45;
    default:
      return 12;
  }
}

export default async function LessonPage({ params }: { params: Params }) {
  const { slug, lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/courses/${slug}`);

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      quizQuestions: { orderBy: { order: "asc" } },
      module: {
        include: {
          course: { select: { id: true, slug: true, title: true, status: true } },
        },
      },
    },
  });

  if (
    !lesson ||
    lesson.module.course.slug !== slug ||
    lesson.module.course.status !== "PUBLISHED"
  ) {
    notFound();
  }

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: lesson.module.course.id,
      },
    },
  });
  if (!enrollment) redirect(`/courses/${slug}`);

  const progress = await db.userProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
  });

  const allLessons = await db.lesson.findMany({
    where: { module: { courseId: lesson.module.course.id } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id: true, title: true, moduleId: true },
  });
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const prevLessonHref = prevLesson
    ? `/courses/${slug}/lessons/${prevLesson.id}`
    : null;
  const nextLessonHref = nextLesson
    ? `/courses/${slug}/lessons/${nextLesson.id}`
    : `/courses/${slug}`;

  const isCompleted = progress?.status === "COMPLETED";

  // QUIZ-type lessons still use the dedicated QuizLesson UI (kept for backward compat).
  if (lesson.type === "QUIZ") {
    return (
      <div className="page lesson">
        <div className="lesson-body">
          <article className="reading">
            <div className="reading-eyebrow">{lesson.module.title}</div>
            <h1 className="lesson-title">{lesson.title}</h1>
            <QuizLesson
              lessonId={lesson.id}
              questions={lesson.quizQuestions.map((q) => ({
                id: q.id,
                question: q.question,
                options: q.options as string[],
                correctIndex: q.correctIndex,
                explanation: q.explanation,
              }))}
              isCompleted={isCompleted}
            />
          </article>
        </div>
      </div>
    );
  }

  const quizQuestions: QuizBlockQuestion[] = lesson.quizQuestions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options as string[],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));

  // Summary points: take first non-empty paragraphs from content if present.
  const summaryPoints: string[] = (() => {
    if (!lesson.content) return [];
    const paragraphs = lesson.content
      .split(/\n\s*\n/)
      .map((p) => p.replace(/^#+\s*/, "").trim())
      .filter((p) => p.length > 20 && !p.startsWith("```"));
    return paragraphs.slice(0, 4).map((p) =>
      p.length > 160 ? p.slice(0, 157) + "…" : p,
    );
  })();

  return (
    <LessonClient
      lesson={{
        id: lesson.id,
        title: lesson.title,
        description: null,
        content: lesson.content,
        completed: isCompleted,
        estimatedMinutes: lessonEstimatedMinutes(lesson.type),
        category: lessonCategory(lesson.type),
        moduleName: lesson.module.title,
        moduleOrder: lesson.module.order + 1,
        lessonNumber: currentIndex + 1,
        courseId: lesson.module.course.id,
      }}
      course={{
        slug: lesson.module.course.slug,
        title: lesson.module.course.title,
      }}
      totalLessons={allLessons.length}
      lessonIdx={currentIndex}
      prevLessonHref={prevLessonHref}
      nextLessonHref={nextLessonHref}
      quizQuestions={quizQuestions}
      flashcards={[]}
      summaryPoints={summaryPoints}
    />
  );
}
