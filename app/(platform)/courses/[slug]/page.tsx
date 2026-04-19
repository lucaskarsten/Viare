import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  BookOpen,
  Clock,
  Users,
  Star,
  ChevronRight,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";
import EnrollButton from "./EnrollButton";
import CourseDetailTabs from "@/components/CourseDetailTabs";
import type { CourseMapModule } from "@/components/CourseMap";

type Params = Promise<{ slug: string }>;

export default async function CoursePage({ params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, slug: true, title: true, type: true, order: true },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course || course.status !== "PUBLISHED") notFound();

  const enrollment = session?.user?.id
    ? await db.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
        select: { id: true, progressPercent: true, status: true },
      })
    : null;

  const completedLessonIds = session?.user?.id
    ? await db.userProgress
        .findMany({
          where: {
            userId: session.user.id,
            lesson: { module: { courseId: course.id } },
            status: "COMPLETED",
          },
          select: { lessonId: true },
        })
        .then((rows) => new Set(rows.map((r) => r.lessonId)))
    : new Set<string>();

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  const difficultyLabel = { EASY: "Iniciante", MEDIUM: "Intermediário", HARD: "Avançado" };
  const difficultyColor = {
    EASY: "text-green-700 bg-green-500/10",
    MEDIUM: "text-yellow-700 bg-yellow-500/10",
    HARD: "text-red-700 bg-red-500/10",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Course header */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${difficultyColor[course.difficulty]}`}>
                {difficultyLabel[course.difficulty]}
              </span>
              {course.sourceType === "AI_GENERATED" && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Gerado por IA
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">{course.description}</p>
          </div>
          <EnrollButton
            courseId={course.id}
            enrollment={enrollment}
            firstLessonHref={
              course.modules[0]?.lessons[0]
                ? `/courses/${slug}/lessons/${course.modules[0].lessons[0].id}`
                : null
            }
          />
        </div>

        <div className="flex items-center gap-5 text-sm text-muted-foreground border-t pt-4">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {totalLessons} aulas
          </span>
          {course.estimatedHours && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              ~{course.estimatedHours}h
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {course._count.enrollments} alunos
          </span>
          {course.totalRatings > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {course.avgRating.toFixed(1)} ({course.totalRatings})
            </span>
          )}
        </div>

        {enrollment && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{enrollment.progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${enrollment.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {course.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <span key={tag} className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Modules & lessons */}
      {(() => {
        const mapModules: CourseMapModule[] = course.modules.map((m, mi) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          locked: mi > 0 && !course.modules[mi - 1].lessons.every((l) => completedLessonIds.has(l.id)),
          current: mi === course.modules.findIndex((mod) => mod.lessons.some((l) => !completedLessonIds.has(l.id))),
          lessons: m.lessons.map((l, li) => ({
            id: l.id,
            title: l.title,
            order: l.order ?? li + 1,
            completed: completedLessonIds.has(l.id),
            current:
              !completedLessonIds.has(l.id) &&
              m.lessons.slice(0, li).every((pl) => completedLessonIds.has(pl.id)),
            locked:
              mi > 0 &&
              !course.modules[mi - 1].lessons.every((pl) => completedLessonIds.has(pl.id)),
          })),
        }));

        const lessonListContent = (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Conteúdo do curso</h2>
            {course.modules.map((mod, mi) => (
              <div key={mod.id} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-5 py-3 bg-muted/50 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">
                      Módulo {mi + 1}: {mod.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {mod.lessons.length} aulas
                    </span>
                  </div>
                  {mod.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                  )}
                </div>
                <div className="divide-y">
                  {mod.lessons.map((lesson, li) => {
                    const done = completedLessonIds.has(lesson.id);
                    const accessible = !!enrollment;
                    const href = `/courses/${slug}/lessons/${lesson.id}`;

                    return (
                      <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                        <div className="w-5 shrink-0">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : !accessible ? (
                            <Lock className="h-4 w-4 text-muted-foreground/40" />
                          ) : (
                            <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground font-mono">
                              {li + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {accessible ? (
                            <Link href={href} className="text-sm hover:text-primary transition-colors truncate block">
                              {lesson.title}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground truncate block">{lesson.title}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {lesson.type === "QUIZ" ? "Quiz" : "Aula"}
                        </span>
                        {accessible && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );

        return (
          <CourseDetailTabs
            modules={mapModules}
            slug={slug}
            lessonListContent={lessonListContent}
          />
        );
      })()}
    </div>
  );
}
