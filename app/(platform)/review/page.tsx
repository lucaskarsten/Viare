import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ReviewClient from "@/components/ReviewClient";

const COURSE_COLORS = ["#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e", "#a65d4a"];

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const enrollments = await db.enrollment.findMany({
    where: { userId: session.user.id, status: { not: "ABANDONED" } },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: { select: { id: true, title: true }, orderBy: { order: "asc" } } },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { lastAccessedAt: "desc" },
  });

  const courses = enrollments.map((e, i) => {
    const total = e.course.modules.flatMap((m) => m.lessons).length;
    const due = Math.max(1, Math.floor(total * 0.3));
    const overdue = Math.floor(due * 0.3);
    const learning = Math.floor(due * 0.4);
    const newCards = due - overdue - learning;
    const color = COURSE_COLORS[i % COURSE_COLORS.length];
    const cards = e.course.modules
      .flatMap((m) => m.lessons.map((l) => ({ q: l.title, a: m.title, tag: "conceito", course: e.courseId })))
      .slice(0, 20);

    return {
      id: e.courseId,
      name: e.course.title,
      color,
      due,
      total: Math.max(total, due),
      new: Math.max(0, newCards),
      learning,
      overdue,
      cards,
    };
  });

  const totalDue = courses.reduce((s, c) => s + c.due, 0);
  const totalOverdue = courses.reduce((s, c) => s + c.overdue, 0);
  const streak = 0;

  const schedule = [
    { label: "Hoje", count: totalDue, hot: true },
    { label: "Amanhã", count: 9 },
    { label: "Qua", count: 14 },
    { label: "Qui", count: 7 },
    { label: "Sex", count: 11 },
    { label: "Sáb", count: 5 },
    { label: "Dom", count: 8 },
  ];

  const message =
    totalOverdue > 0
      ? `${totalOverdue} estão atrasados — revise primeiro para não cascatear.`
      : "10 minutos por dia constantes mantêm o que você aprendeu no lugar.";

  return (
    <div className="page review">
      <header className="review-hero">
        <div className="review-hero-main">
          <div className="eye">Revisão espaçada</div>
          <h1 className="h1">
            {totalDue > 0 ? (
              <>
                {totalDue} <span className="h1-soft">cartões pendentes</span>
              </>
            ) : (
              <>
                Tudo em dia <span className="h1-soft">·</span>
              </>
            )}
          </h1>
          <p className="lede">{message}</p>
          <div className="review-actions">
            <ReviewClient
              courses={courses}
              totalDue={totalDue}
              totalOverdue={totalOverdue}
            />
          </div>
        </div>
        <aside className="review-streak">
          <div className="streak-num">
            {streak}
            <span>d</span>
          </div>
          <div className="streak-label">dias seguidos</div>
          <div className="streak-cal">
            {Array.from({ length: 28 }).map((_, i) => {
              const state =
                i < streak ? "done" : i === streak ? "today" : "scheduled";
              return <span key={i} className={`sc sc-${state}`} />;
            })}
          </div>
          <div className="streak-foot">Últimas 4 semanas</div>
        </aside>
      </header>

      <section className="review-section">
        <h2 className="h2">Pendentes por curso</h2>
        <div className="course-queue">
          {courses.length === 0 ? (
            <p style={{ padding: "16px", color: "var(--ink-3)" }}>
              Nenhum curso em andamento.
            </p>
          ) : (
            courses.map((c) => (
              <div key={c.id} className={`cq ${c.due === 0 ? "empty" : ""}`}>
                <div className="cq-bar" style={{ background: c.color }} />
                <div className="cq-body">
                  <div className="cq-head">
                    <div className="cq-name">{c.name}</div>
                    <div className="cq-due">
                      {c.due === 0 ? (
                        "em dia"
                      ) : (
                        <>
                          <strong>{c.due}</strong> pendentes
                        </>
                      )}
                    </div>
                  </div>
                  {c.due > 0 && (
                    <div className="cq-breakdown">
                      {c.overdue > 0 && (
                        <span className="cqb overdue">{c.overdue} atrasados</span>
                      )}
                      {c.learning > 0 && (
                        <span className="cqb learning">{c.learning} aprendendo</span>
                      )}
                      {c.new > 0 && (
                        <span className="cqb new">{c.new} novos</span>
                      )}
                    </div>
                  )}
                  <div className="cq-progress">
                    <div className="cq-progress-bar">
                      <div
                        style={{
                          width: `${((c.total - c.due) / Math.max(c.total, 1)) * 100}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                    <span className="cq-progress-label">
                      {c.total - c.due} / {c.total} aprendidos
                    </span>
                  </div>
                </div>
                {/* ReviewSessionButton rendered by ReviewClient overlay */}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="review-section">
        <h2 className="h2">Esta semana</h2>
        <div className="schedule">
          {schedule.map((d, i) => {
            const maxN = Math.max(...schedule.map((x) => x.count), 1);
            const h = Math.max(8, (d.count / maxN) * 120);
            return (
              <div key={i} className={`sched-col ${d.hot ? "hot" : ""}`}>
                <div className="sched-num">{d.count}</div>
                <div className="sched-bar" style={{ height: h }}>
                  <div className="sched-bar-fill" style={{ height: "100%" }} />
                </div>
                <div className="sched-day">{d.label}</div>
              </div>
            );
          })}
        </div>
        <div className="review-tip">
          <span className="review-tip-eye">Dica</span>
          Sessões curtas e diárias vencem maratonas no fim de semana. O
          algoritmo recompensa consistência.
        </div>
      </section>
    </div>
  );
}
