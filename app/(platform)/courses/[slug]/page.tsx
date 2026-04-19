import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import EnrollButton from "./EnrollButton";
import CourseDetailTabs, {
  type CourseDetailModule,
} from "@/components/CourseDetailTabs";

type Params = Promise<{ slug: string }>;

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Iniciante",
  MEDIUM: "Intermediário",
  HARD: "Avançado",
};

function lessonKindLabel(type: string): string {
  switch (type) {
    case "QUIZ": return "quiz";
    case "LAB": return "lab";
    case "PROJECT": return "projeto";
    default: return "leitura";
  }
}

function lessonEstimatedMinutes(type: string): number {
  switch (type) {
    case "QUIZ": return 8;
    case "LAB": return 25;
    case "PROJECT": return 45;
    default: return 12;
  }
}

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
  const completedLessons = completedLessonIds.size;
  const progressPct = enrollment?.progressPercent ?? 0;

  const flatLessons = course.modules.flatMap((m) =>
    m.lessons.map((l, li) => ({ ...l, moduleIdx: course.modules.indexOf(m), lessonIdx: li })),
  );
  const nextLessonRaw = flatLessons.find((l) => !completedLessonIds.has(l.id)) ?? flatLessons[0];
  const nextLessonHref = nextLessonRaw
    ? `/courses/${slug}/lessons/${nextLessonRaw.id}`
    : `/courses/${slug}`;
  const nextLessonIndex = nextLessonRaw
    ? flatLessons.findIndex((l) => l.id === nextLessonRaw.id) + 1
    : 1;

  const estimatedHours = course.estimatedHours ?? Math.max(1, Math.round((totalLessons * 12) / 60));
  const moduleCount = course.modules.length;

  const detailModules: CourseDetailModule[] = course.modules.map((m, mi) => {
    const isLocked =
      mi > 0 &&
      !course.modules[mi - 1].lessons.every((l) => completedLessonIds.has(l.id));
    const isCurrent =
      mi ===
      course.modules.findIndex((mod) =>
        mod.lessons.some((l) => !completedLessonIds.has(l.id)),
      );

    return {
      id: m.id,
      title: m.title,
      order: mi + 1,
      isCurrent,
      isLocked,
      lessons: m.lessons.map((l, li) => {
        const done = completedLessonIds.has(l.id);
        const current =
          !done && m.lessons.slice(0, li).every((pl) => completedLessonIds.has(pl.id));
        return {
          id: l.id,
          title: l.title,
          order: l.order ?? li + 1,
          kind: lessonKindLabel(l.type),
          estimatedMinutes: lessonEstimatedMinutes(l.type),
          done,
          current,
          locked: isLocked,
        };
      }),
    };
  });

  const difficultyLabel = DIFFICULTY_LABEL[course.difficulty] ?? "Intermediário";
  const categoryLabel = course.category ?? "Segurança";

  return (
    <div className="flex flex-col gap-14">
      <div>
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-[13px] text-muted-foreground no-underline hover:text-foreground transition-colors"
          >
            ← Biblioteca
          </Link>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-16 items-start pb-10 border-b border-border">
          <div>
            <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground mb-4">
              {categoryLabel} · {difficultyLabel}
            </div>
            <h1 className="font-medium text-[36px] leading-[1.15] tracking-[-0.02em] m-0 text-balance text-foreground">
              {course.title}
            </h1>
            <p className="text-[15px] leading-[1.6] text-muted-foreground mt-3.5 max-w-[62ch] text-pretty m-0">
              {course.description}
            </p>
            <div className="text-[13px] text-muted-foreground flex gap-2 items-center mt-5">
              <span>{difficultyLabel}</span>
              <span className="opacity-50">·</span>
              <span>{estimatedHours}h estimadas</span>
              <span className="opacity-50">·</span>
              <span>{course._count.enrollments} alunos</span>
            </div>
            <div className="flex gap-2 mt-7 items-center">
              <EnrollButton
                courseId={course.id}
                enrollment={enrollment}
                firstLessonHref={nextLessonHref}
                nextLessonNumber={nextLessonIndex}
              />
              <button className="text-muted-foreground text-[13px] px-2.5 py-2 rounded transition-colors bg-transparent border-0 cursor-pointer inline-flex items-center hover:text-foreground hover:bg-card">
                Compartilhar
              </button>
            </div>
          </div>

          <aside className="bg-card p-6 rounded-[var(--radius-lg)]">
            <div className="pb-5 border-b border-border">
              <div className="text-[44px] leading-none tracking-[-0.04em] font-medium tabular-nums text-foreground">
                {progressPct}<span className="text-[22px] text-muted-foreground font-normal">%</span>
              </div>
              <div className="text-[13px] text-muted-foreground mt-1">concluído</div>
              <div className="h-1 bg-border/50 overflow-hidden rounded-[2px] mt-3">
                <div
                  className="h-full bg-accent rounded-[2px] transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <ul className="list-none p-0 mt-4 m-0 flex flex-col gap-2">
              <li className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Aulas concluídas</span>
                <strong className="font-medium tabular-nums text-foreground">{completedLessons}/{totalLessons}</strong>
              </li>
              <li className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Tempo estimado</span>
                <strong className="font-medium tabular-nums text-foreground">{estimatedHours}h</strong>
              </li>
              <li className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Módulos</span>
                <strong className="font-medium tabular-nums text-foreground">{moduleCount}</strong>
              </li>
            </ul>
          </aside>
        </div>
      </div>

      <CourseDetailTabs
        courseSlug={slug}
        modules={detailModules}
      />
    </div>
  );
}
