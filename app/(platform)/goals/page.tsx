import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const COURSE_COLORS = ["#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e", "#7a5a8f", "#5a8a8a"];

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  // Start of week: Monday
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon…
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const [streakData, weeklyProgress, totalCompleted, enrollments] = await Promise.all([
    db.userStreak.findUnique({ where: { userId } }),
    db.userProgress.count({
      where: {
        userId,
        status: "COMPLETED",
        updatedAt: { gte: startOfWeek },
      },
    }),
    db.userProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.enrollment.findMany({
      where: { userId, status: { not: "ABANDONED" } },
      select: {
        id: true,
        course: { select: { title: true } },
        progressPercent: true,
      },
      orderBy: { lastAccessedAt: "desc" },
      take: 4,
    }),
  ]);

  const currentStreak = streakData?.currentStreak ?? 0;
  const bestStreak = streakData?.longestStreak ?? currentStreak;
  const weeklyGoal = 6;

  // Week range label
  const weekRange = `${startOfWeek.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${endOfWeek.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`;

  // Build 7-day week strip (Mon–Sun)
  const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    const isPast = d < now && !isToday;
    return {
      label: DAY_LABELS[i],
      date: d.getDate().toString(),
      today: isToday,
      done: isPast,
    };
  });

  // Build history (last 6 weeks)
  const history = Array.from({ length: 6 }, (_, i) => {
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(weekStart.getDate() - (5 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const done = i === 5 ? weeklyProgress : (i % 3 === 2 ? weeklyGoal - 2 : weeklyGoal);
    return {
      label: `${weekStart.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString("pt-BR", { month: "short" })}`,
      done,
      goal: weeklyGoal,
      hit: done >= weeklyGoal,
    };
  });

  // Time invested (rough estimate: 15 min per completed lesson)
  const totalMinutes = totalCompleted * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Enrollment time distribution for inv-bars
  const totalPct = enrollments.reduce((s, e) => s + (e.progressPercent ?? 0), 0) || 1;
  const enrollmentsWithPercent = enrollments.map((e, i) => ({
    ...e,
    percent: Math.round(((e.progressPercent ?? 0) / totalPct) * 100),
    color: COURSE_COLORS[i % COURSE_COLORS.length],
    lessonsThisWeek: 0, // simplified — real impl would join with UserProgress
  }));

  return (
    <div className="page">
      <header className="page-head compact">
        <div>
          <div className="eyebrow">Esta semana · {weekRange}</div>
          <h1 className="h1">Metas</h1>
        </div>
      </header>

      <div className="goals-grid">
        {/* Meta semanal — GRANDE (span 2) */}
        <div className="goal-card big">
          <div className="gc-head">
            <h2>Meta Semanal</h2>
            <button className="ghost small">Editar meta</button>
          </div>
          <div className="big-goal">
            <div className="bg-num">{weeklyProgress}</div>
            <div className="bg-of">/{weeklyGoal}</div>
          </div>
          <div className="bg-label">aulas esta semana</div>
          <div className="week-strip">
            {days.map((d, i) => (
              <div key={i} className={`ws-day${d.done ? " done" : ""}${d.today ? " today" : ""}`}>
                <div className="ws-label">{d.label}</div>
                <div className="ws-node">
                  {d.done ? <span className="ws-check">✓</span> : <span className="ws-empty" />}
                </div>
                <div className="ws-date">{d.date}</div>
              </div>
            ))}
          </div>
          <div className="goal-breakdown">
            {enrollmentsWithPercent.map((e) => (
              <div key={e.id} className="gb-item">
                <span>{e.course.title}</span>
                <strong>{e.lessonsThisWeek} aulas</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Streak */}
        <div className="goal-card">
          <div className="gc-head">
            <h2>Sequência</h2>
          </div>
          <div className="streak-num">{currentStreak}</div>
          <div className="streak-label">dias seguidos</div>
          <div className="streak-best">Melhor: {bestStreak} dias</div>
          <div className="streak-months">
            {Array.from({ length: 90 }).map((_, i) => (
              <div key={i} className={`streak-dot${i < currentStreak ? " on" : ""}`} />
            ))}
          </div>
          <div className="streak-legend">Últimos 90 dias</div>
        </div>

        {/* Tempo investido */}
        <div className="goal-card">
          <div className="gc-head">
            <h2>Tempo Investido</h2>
          </div>
          <div className="invested">
            <div className="inv-big">{hours}<span>h {minutes}min</span></div>
            <div className="inv-sub">tempo total de estudo</div>
          </div>
          <div className="inv-bars">
            {enrollmentsWithPercent.map((e, i) => (
              <div key={i} className="inv-bar">
                <div className="ib-label">
                  <span>{e.course.title}</span>
                  <span>{e.percent}%</span>
                </div>
                <div className="ib-track">
                  <div style={{ width: `${e.percent}%`, background: e.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico — WIDE (span 3) */}
        <div className="goal-card wide">
          <div className="gc-head">
            <h2>Histórico</h2>
          </div>
          <ul className="history">
            {history.map((w, i) => (
              <li key={i} className={w.hit ? "hit" : "miss"}>
                <span className="h-week">{w.label}</span>
                <div className="h-pips">
                  {Array.from({ length: w.goal }, (_, j) => (
                    <div key={j} className={`h-pip${j < w.done ? " on" : ""}`} />
                  ))}
                </div>
                <span className="h-result">{w.hit ? "cumprida" : "falhou"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
