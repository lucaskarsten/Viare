import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import EnrollButton from "./EnrollButton";
import CourseDetailTabs, {
  type CourseDetailModule,
} from "@/components/CourseDetailTabs";
import type { CourseMapModule } from "@/components/CourseMap";

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

  // Compute counts for stats sidebar
  const quizCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.type === "QUIZ").length,
    0,
  );
  const labCount = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.type === "LAB").length,
    0,
  );
  const flashcardCount = 0;

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

  // Map modules for the Map tab (existing SVG map)
  const mapModules: CourseMapModule[] = course.modules.map((m, mi) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    locked:
      mi > 0 &&
      !course.modules[mi - 1].lessons.every((l) => completedLessonIds.has(l.id)),
    current:
      mi ===
      course.modules.findIndex((mod) =>
        mod.lessons.some((l) => !completedLessonIds.has(l.id)),
      ),
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

  const difficultyLabel = DIFFICULTY_LABEL[course.difficulty] ?? "Intermediário";
  const remainingLessons = Math.max(0, totalLessons - completedLessons);
  const estimatedRemainingHours = course.estimatedHours
    ? Math.max(1, Math.round((course.estimatedHours * remainingLessons) / Math.max(1, totalLessons)))
    : Math.max(1, Math.round((remainingLessons * 12) / 60));
  const customizedCount = 0;

  return (
    <div className="page course">
      <div className="breadcrumb">
        <Link href="/dashboard">← Biblioteca</Link>
      </div>

      <header className="course-hero">
        <div className="course-hero-main">
          <div className="course-tag">{difficultyLabel}</div>
          <h1 className="h1">{course.title}</h1>
          <p className="lede">{course.description}</p>
          <div className="course-meta">
            <span>
              ★ {course.avgRating > 0 ? course.avgRating.toFixed(1) : "—"}
              {course.totalRatings > 0
                ? ` (${course.totalRatings.toLocaleString()})`
                : ""}
            </span>
            <span className="sep">·</span>
            <span>{course._count.enrollments} alunos</span>
            <span className="sep">·</span>
            <span>
              {course.sourceType === "AI_GENERATED" ? "Gerado por IA" : "Curado"}
              {customizedCount > 0
                ? ` · você personalizou ${customizedCount} aulas`
                : ""}
            </span>
          </div>
          <div className="course-actions">
            <EnrollButton
              courseId={course.id}
              enrollment={enrollment}
              firstLessonHref={nextLessonHref}
              nextLessonNumber={nextLessonIndex}
            />
            <button className="ghost">⑂ Fork &amp; remix</button>
            <button className="ghost">Personalizar</button>
            <button className="icon" title="Avaliar">
              ★
            </button>
          </div>
        </div>
        <aside className="course-hero-side">
          <div className="chs-progress">
            <div className="chsp-num">{progressPct}%</div>
            <div className="progress-bar big">
              <div style={{ width: `${progressPct}%` }} />
            </div>
            <div className="chsp-label">
              {completedLessons} de {totalLessons} aulas
            </div>
          </div>
          <div className="chs-stats">
            <div className="chs-stat">
              <span>Quizzes</span>
              <strong>{quizCount}</strong>
            </div>
            <div className="chs-stat">
              <span>Flashcards</span>
              <strong>{flashcardCount}</strong>
            </div>
            <div className="chs-stat">
              <span>Labs</span>
              <strong>{labCount}</strong>
            </div>
            <div className="chs-stat">
              <span>~{estimatedRemainingHours}h</span>
              <strong>restantes</strong>
            </div>
          </div>
        </aside>
      </header>

      <CourseDetailTabs
        courseSlug={slug}
        modules={detailModules}
        mapModules={mapModules}
      />
    </div>
  );
}
