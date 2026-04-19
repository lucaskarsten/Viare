import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import ReactMarkdown from "react-markdown";
import QuizLesson from "./QuizLesson";
import MarkCompleteButton from "./MarkCompleteButton";
import FocusModeToggle from "@/components/FocusModeToggle";

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
    <div>
      {/* Sticky chrome bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="grid grid-cols-[200px_1fr_auto] items-center gap-4 px-6 py-3 max-w-[1200px] mx-auto">
          <Link href={`/courses/${slug}`} className="text-[13px] text-muted-foreground hover:text-foreground truncate">
            ← {lesson.module.course.title}
          </Link>
          <div className="flex items-center justify-center gap-[3px]">
            {allLessons.map((l, i) => (
              <span
                key={l.id}
                className={`w-4 h-[3px] rounded-[1px] transition-colors ${
                  i < currentIndex
                    ? "bg-accent"
                    : i === currentIndex
                    ? "bg-accent opacity-60"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <FocusModeToggle />
            {lesson.type === "THEORY" && (
              <MarkCompleteButton
                lessonId={lesson.id}
                courseId={lesson.module.course.id}
                isCompleted={isCompleted}
                nextLessonHref={nextLesson ? `/courses/${slug}/lessons/${nextLesson.id}` : `/courses/${slug}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Reading area */}
      <article className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          {lesson.module.title}
        </div>
        <h1 className="text-[32px] font-medium tracking-tight leading-[1.2]">{lesson.title}</h1>
        <span className="inline-block font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1 rounded bg-muted text-muted-foreground">
          {lesson.type === "QUIZ" ? "Quiz" : "Leitura"}
        </span>
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
          <div className="text-[16px] leading-[1.75] text-foreground/80 [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
            {lesson.content ? (
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">Conteúdo ainda não disponível.</p>
            )}
          </div>
        )}
      </article>

      {/* Footer navigation */}
      <div className="max-w-3xl mx-auto px-6 pb-16 flex justify-between items-center border-t border-border pt-10">
        {prevLesson ? (
          <Link
            href={`/courses/${slug}/lessons/${prevLesson.id}`}
            className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            ← Anterior
          </Link>
        ) : <div />}
        {nextLesson ? (
          <Link
            href={`/courses/${slug}/lessons/${nextLesson.id}`}
            className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            Próxima →
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
