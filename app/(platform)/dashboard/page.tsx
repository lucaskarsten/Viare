import Link from "next/link";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";

const COURSE_COLORS = ["#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e", "#7a5a8f", "#5a8a8a"];

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Iniciante",
  MEDIUM: "Intermediário",
  HARD: "Avançado",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [streakData, completedCount, enrollments, archivedEnrollments] = await Promise.all([
    db.userStreak.findUnique({ where: { userId } }),
    db.userProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.enrollment.findMany({
      where: { userId, status: { not: "ABANDONED" } },
      orderBy: { lastAccessedAt: "desc" },
      take: 6,
      include: {
        course: {
          select: {
            slug: true,
            title: true,
            description: true,
            difficulty: true,
            estimatedHours: true,
            tags: true,
            _count: { select: { modules: true } },
            modules: {
              orderBy: { order: "asc" },
              take: 1,
              select: {
                order: true,
                lessons: {
                  orderBy: { order: "asc" },
                  take: 1,
                  select: { id: true, title: true, type: true },
                },
              },
            },
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: { userId, status: "ABANDONED" },
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: { course: { select: { slug: true, title: true } } },
    }),
  ]);

  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = session?.user?.name?.split(" ")[0] ?? "você";
  const currentStreak = streakData?.currentStreak ?? 0;
  const weeklyGoalDone = Math.min(completedCount % 7, 6); // simplified weekly progress
  const weeklyGoal = `${weeklyGoalDone}/6`;

  const resumeEnrollment = enrollments.find((e) => e.status === "IN_PROGRESS") ?? enrollments[0] ?? null;
  const resumeColor = COURSE_COLORS[0];

  // Build resume card next-lesson info
  const resumeNextLesson = resumeEnrollment?.course.modules[0]?.lessons[0] ?? null;
  const resumeModuleNum = resumeEnrollment?.course.modules[0]?.order != null
    ? String(resumeEnrollment.course.modules[0].order + 1).padStart(2, "0")
    : "01";

  const lessonKindLabel: Record<string, string> = {
    THEORY: "Leitura",
    QUIZ: "Quiz",
    LAB: "Lab",
    PROJECT: "Projeto",
  };

  // Motivational message based on progress
  const remaining = 6 - weeklyGoalDone;
  const motivationalMessage =
    remaining > 0
      ? `Faltam ${remaining} aula${remaining > 1 ? "s" : ""} para fechar a meta da semana. Continue de onde parou.`
      : "Você atingiu sua meta semanal. Continue assim!";

  return (
    <div className="page library">
      <header className="page-head">
        <div>
          <div className="eyebrow">{formattedDate}</div>
          <h1 className="h1">
            <em>{greeting},</em> {firstName}.
          </h1>
          <p className="lede">{motivationalMessage}</p>
        </div>
        <div className="head-stats">
          <div className="stat">
            <div className="stat-value">{currentStreak}</div>
            <div className="stat-label">dias seguidos</div>
          </div>
          <div className="stat">
            <div className="stat-value">{weeklyGoal}</div>
            <div className="stat-label">meta semanal</div>
          </div>
          <div className="stat">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">aulas ao todo</div>
          </div>
        </div>
      </header>

      {resumeEnrollment && (
        <section className="resume">
          <div className="section-head">
            <h2>Continuar</h2>
            <Link href={`/courses/${resumeEnrollment.course.slug}`} className="ghost">
              Abrir curso →
            </Link>
          </div>
          <Link
            className="resume-card"
            href={
              resumeNextLesson
                ? `/courses/${resumeEnrollment.course.slug}/lessons/${resumeNextLesson.id}`
                : `/courses/${resumeEnrollment.course.slug}`
            }
          >
            <div className="resume-visual" style={{ background: resumeColor }}>
              <div className="resume-visual-inner">
                <div className="placeholder-stripes" />
                <div className="resume-chapter">Ch. {resumeModuleNum}</div>
                <div className="resume-title-small">{resumeEnrollment.course.title}</div>
              </div>
            </div>
            <div className="resume-body">
              <div className="eyebrow">
                A seguir · {resumeEnrollment.course.estimatedHours ? `${resumeEnrollment.course.estimatedHours * 60 / Math.max(resumeEnrollment.course._count.modules, 1)} min` : "14 min"}
              </div>
              <h3>{resumeNextLesson?.title ?? resumeEnrollment.course.title}</h3>
              <p>{resumeEnrollment.course.description}</p>
              <div className="resume-meta">
                <span>Aula 1 de {resumeEnrollment.course._count.modules}</span>
                <span className="sep">·</span>
                <span>{resumeNextLesson ? (lessonKindLabel[resumeNextLesson.type] ?? resumeNextLesson.type) : "Leitura"}</span>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${resumeEnrollment.progressPercent ?? 0}%` }} />
              </div>
            </div>
            <div className="resume-arrow">→</div>
          </Link>
        </section>
      )}

      <section className="courses">
        <div className="section-head">
          <h2>Seus cursos</h2>
          <div className="filters">
            <button className="filter on">Todos</button>
            <button className="filter">Em andamento</button>
            <button className="filter">Não iniciados</button>
            <button className="filter">Concluídos</button>
          </div>
        </div>
        <div className="course-grid">
          {enrollments.map((enrollment, i) => {
            const color = COURSE_COLORS[i % COURSE_COLORS.length];
            const tag = enrollment.course.tags[0] ?? DIFFICULTY_LABELS[enrollment.course.difficulty] ?? "Curso";
            const lastAccess = enrollment.lastAccessedAt
              ? enrollment.lastAccessedAt.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
              : "—";
            // done/total: use progressPercent as proxy since we don't have per-enrollment lesson count
            const done = Math.round((enrollment.progressPercent ?? 0) / 100 * enrollment.course._count.modules);
            const total = enrollment.course._count.modules;

            return (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.course.slug}`}
                className="course-card"
              >
                <div className="cc-top" style={{ "--accent": color } as React.CSSProperties}>
                  <div className="cc-stripes" />
                  <span className="cc-tag">{tag}</span>
                </div>
                <div className="cc-body">
                  <h3>{enrollment.course.title}</h3>
                  <p>{enrollment.course.description}</p>
                  <div className="cc-meta">
                    <span>{done}/{total} aulas</span>
                    <span className="sep">·</span>
                    <span>{lastAccess}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      style={{
                        width: `${enrollment.progressPercent ?? 0}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
          <Link href="/courses/generate" className="course-card new">
            <div className="new-inner">
              <div className="plus-big">+</div>
              <div className="new-title">Gerar um novo curso</div>
              <div className="new-sub">
                Digite qualquer tema. Lumen escreve o currículo.
              </div>
            </div>
          </Link>
        </div>
      </section>

      {archivedEnrollments.length > 0 && (
        <section className="archive">
          <div className="section-head">
            <h2>Arquivo</h2>
          </div>
          <ul className="archive-list">
            {archivedEnrollments.map((e) => (
              <li key={e.id}>
                <span className="a-title">{e.course.title}</span>
                <span className="a-meta">
                  Pausado · {e.updatedAt.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                </span>
                <span className="a-action">→</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
