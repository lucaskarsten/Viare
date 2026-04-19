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
    case "QUIZ":
      return "quiz";
    case "LAB":
      return "lab";
    case "PROJECT":
      return "projeto";
    default:
      return "leitura";
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

  // Find the "next" lesson: first non-completed lesson in module order
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

  // Course detail modules (tabbed outline)
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
    <div className="page">
      <div className="breadcrumb">
        <Link href="/dashboard" className="ghost small">← Biblioteca</Link>
      </div>

      <div className="course-hero">
        <div className="course-hero-main">
          <div className="course-tag">{categoryLabel} · {difficultyLabel}</div>
          <h1 className="h1">{course.title}</h1>
          <p className="lede">{course.description}</p>
          <div className="course-meta">
            <span>{difficultyLabel}</span>
            <span className="sep">·</span>
            <span>{estimatedHours}h estimadas</span>
            <span className="sep">·</span>
            <span>{course._count.enrollments} alunos</span>
          </div>
          <div className="course-actions">
            <EnrollButton
              courseId={course.id}
              enrollment={enrollment}
              firstLessonHref={nextLessonHref}
              nextLessonNumber={nextLessonIndex}
            />
            <button className="ghost">Compartilhar</button>
          </div>
        </div>

        <aside className="course-hero-side">
          <div className="progress-block">
            <div className="progress-num">{progressPct}<span>%</span></div>
            <div className="progress-label">concluído</div>
            <div className="progress-bar big">
              <div style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <ul className="side-stats">
            <li>
              <span>Aulas concluídas</span>
              <strong>{completedLessons}/{totalLessons}</strong>
            </li>
            <li>
              <span>Tempo estimado</span>
              <strong>{estimatedHours}h</strong>
            </li>
            <li>
              <span>Módulos</span>
              <strong>{moduleCount}</strong>
            </li>
          </ul>
        </aside>
      </div>

      <CourseDetailTabs
        courseSlug={slug}
        modules={detailModules}
      />
    </div>
  );
}
