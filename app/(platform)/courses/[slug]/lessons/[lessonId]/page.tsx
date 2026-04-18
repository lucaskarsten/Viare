import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import QuizLesson from "./QuizLesson";
import MarkCompleteButton from "./MarkCompleteButton";

type Params = Promise<{ slug: string; lessonId: string }>;

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

  if (!lesson || lesson.module.course.slug !== slug || lesson.module.course.status !== "PUBLISHED") {
    notFound();
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: lesson.module.course.id } },
  });
  if (!enrollment) redirect(`/courses/${slug}`);

  const progress = await db.userProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
  });

  // Get prev/next lesson for navigation
  const allLessons = await db.lesson.findMany({
    where: { module: { courseId: lesson.module.course.id } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id: true, title: true, moduleId: true },
  });
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = progress?.status === "COMPLETED";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/courses/${slug}`} className="hover:text-foreground transition-colors">
          {lesson.module.course.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span>{lesson.module.title}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate">{lesson.title}</span>
      </div>

      {/* Lesson content */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30">
          <h1 className="text-xl font-bold">{lesson.title}</h1>
          <span className="text-xs text-muted-foreground">{lesson.type === "QUIZ" ? "Quiz" : "Aula teórica"}</span>
        </div>

        <div className="p-6">
          {lesson.type === "QUIZ" ? (
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
          ) : (
            <article className="prose prose-sm max-w-none dark:prose-invert">
              {lesson.content ? (
                <ReactMarkdown>{lesson.content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">Conteúdo ainda não disponível.</p>
              )}
            </article>
          )}
        </div>
      </div>

      {/* Mark complete + navigation */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {prevLesson && (
            <Link
              href={`/courses/${slug}/lessons/${prevLesson.id}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lesson.type === "THEORY" && (
            <MarkCompleteButton
              lessonId={lesson.id}
              courseId={lesson.module.course.id}
              isCompleted={isCompleted}
              nextLessonHref={nextLesson ? `/courses/${slug}/lessons/${nextLesson.id}` : `/courses/${slug}`}
            />
          )}
        </div>

        <div>
          {nextLesson && (
            <Link
              href={`/courses/${slug}/lessons/${nextLesson.id}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
