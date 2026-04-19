import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

const INV_BARS = [
  { l: "Kali Linux", v: 62, c: "#c97a4a" },
  { l: "Pão", v: 21, c: "#8a9a5b" },
  { l: "Piano", v: 11, c: "#6b7a8f" },
  { l: "Negociação", v: 6, c: "#b8a06e" },
];

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const t = await getTranslations("goals");

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  ninetyDaysAgo.setHours(0, 0, 0, 0);

  const [streakData, recentCompletions] = await Promise.all([
    db.userStreak.findUnique({ where: { userId } }),
    db.userProgress.findMany({
      where: { userId, status: "COMPLETED", updatedAt: { gte: ninetyDaysAgo } },
      select: {
        updatedAt: true,
        lesson: { select: { module: { select: { course: { select: { title: true } } } } } },
      },
      orderBy: { updatedAt: "asc" },
    }),
  ]);

  function toDateKey(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  const weekCompletions = recentCompletions.filter((p) => p.updatedAt >= startOfWeek);
  const weeklyProgress = weekCompletions.length;
  const weekDaysDone = new Set(weekCompletions.map((p) => toDateKey(p.updatedAt)));
  const heatmapDone = new Set(recentCompletions.map((p) => toDateKey(p.updatedAt)));

  const breakdownMap = new Map<string, number>();
  weekCompletions.forEach((p) => {
    const title = p.lesson.module.course.title;
    breakdownMap.set(title, (breakdownMap.get(title) ?? 0) + 1);
  });
  const goalBreakdown = Array.from(breakdownMap.entries())
    .map(([course, count]) => ({ course, count, unit: count === 1 ? t("lessonUnit") : t("lessonsUnit") }))
    .sort((a, b) => b.count - a.count);

  const currentStreak = streakData?.currentStreak ?? 0;
  const bestStreak = streakData?.longestStreak ?? currentStreak;
  const weeklyGoal = 6;

  const MONTH_ABBR = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const weekRange = `${startOfWeek.getDate()} — ${endOfWeek.getDate()} ${MONTH_ABBR[endOfWeek.getMonth()]}`;

  const weeklyGoalMet = weeklyProgress >= weeklyGoal;
  const progressRatio = weeklyGoal > 0 ? weeklyProgress / weeklyGoal : 0;
  const goalTitle = weeklyGoalMet
    ? "Meta batida."
    : progressRatio >= 0.7
    ? "Você está no ritmo."
    : progressRatio >= 0.5
    ? "Falta pouco."
    : "Hora de retomar.";

  const NUMS_PT = ["zero","uma","duas","três","quatro","cinco","seis","sete","oito","nove","dez"];
  const doneWord = (NUMS_PT[weeklyProgress] ?? weeklyProgress.toString());
  const doneWordCap = doneWord.charAt(0).toUpperCase() + doneWord.slice(1);
  const remaining = Math.max(0, weeklyGoal - weeklyProgress);
  const remainingWord = NUMS_PT[remaining] ?? remaining.toString();
  const goalSubtitle = weeklyGoalMet
    ? "Meta da semana cumprida. Até a próxima — ou continue para mais."
    : `${doneWordCap} ${weeklyProgress === 1 ? "aula feita" : "aulas feitas"}, faltam ${remainingWord}. Sessões pequenas e constantes sempre vencem maratonas.`;

  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    const isPast = d < now && !isToday;
    return { label: DAY_LABELS[i], date: d.getDate().toString(), today: isToday, done: weekDaysDone.has(toDateKey(d)) };
  });

  const history = Array.from({ length: 6 }, (_, i) => {
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(weekStart.getDate() - (5 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const done = i === 5
      ? weeklyProgress
      : recentCompletions.filter((p) => p.updatedAt >= weekStart && p.updatedAt <= weekEnd).length;
    return {
      label: `${weekStart.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString("pt-BR", { month: "short" })}`,
      done,
      goal: weeklyGoal,
      hit: done >= weeklyGoal,
    };
  });

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="flex items-baseline justify-between pb-8 border-b border-border">
        <div>
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground mb-2">
            Esta semana · {weekRange}
          </div>
          <h1 className="font-medium text-[28px] leading-[1.15] tracking-[-0.02em] m-0 text-muted-foreground">{goalTitle}</h1>
          <p className="text-[14px] text-muted-foreground leading-[1.5] mt-2 m-0 max-w-[56ch]">{goalSubtitle}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Meta semanal — col-span-2 */}
        <div className="col-span-2 bg-card rounded-[var(--radius-lg)] p-7 flex flex-col">
          <div className="flex justify-between items-baseline mb-5">
            <h2 className="font-medium text-[15px] m-0 tracking-[-0.015em] text-foreground">{t("weeklyGoal")}</h2>
            <button className="text-[12px] text-muted-foreground bg-transparent border-0 cursor-pointer hover:text-foreground px-2 py-1 rounded transition-colors">
              {t("editGoal")}
            </button>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <div className="text-[72px] leading-none tracking-[-0.05em] text-foreground font-medium tabular-nums">
              {weeklyProgress}
            </div>
            <div className="text-[36px] font-normal" style={{ color: 'var(--ink-4)' }}>/{weeklyGoal}</div>
            <div className="text-[14px] text-muted-foreground">{t("lessonsThisWeek")}</div>
          </div>

          {/* Week strip */}
          <div className="grid grid-cols-7 gap-1.5 py-4 border-t border-b border-border mt-6">
            {days.map((d, i) => (
              <div key={i} className="text-center">
                <div className="font-mono text-[10px] text-muted-foreground tracking-[0.05em] mb-2">{d.label}</div>
                <div className="flex justify-center items-center h-8">
                  {d.done ? (
                    <span className="w-7 h-7 rounded-full bg-accent text-white grid place-items-center text-[13px] font-semibold">
                      ✓
                    </span>
                  ) : d.today ? (
                    <span className="w-3.5 h-3.5 border border-dashed border-accent rounded-full animate-pulse inline-block" />
                  ) : (
                    <span className="w-3.5 h-3.5 border rounded-full inline-block" style={{ borderColor: 'var(--ink-4)' }} />
                  )}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground mt-1.5">{d.date}</div>
              </div>
            ))}
          </div>

          {/* Goal breakdown */}
          {goalBreakdown.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-border">
              {goalBreakdown.map((item) => (
                <div key={item.course} className="flex justify-between items-center text-[13px]">
                  <span className="text-muted-foreground">{item.course}</span>
                  <strong className="font-medium text-muted-foreground">
                    {item.count} {item.unit}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sequência */}
        <div className="bg-card rounded-[var(--radius-lg)] p-7 flex flex-col">
          <h2 className="font-medium text-[15px] m-0 tracking-[-0.015em] text-foreground mb-5">{t("currentStreak")}</h2>
          <div className="text-[56px] leading-none tracking-[-0.03em] text-accent font-medium tabular-nums">
            {currentStreak}
          </div>
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground mt-1">{t("consecutiveDays")}</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-3 tracking-[0.02em]">
            {t("record", { days: bestStreak })}
          </div>
          <div className="mt-5 grid grid-cols-[repeat(15,1fr)] gap-[3px]">
            {Array.from({ length: 90 }, (_, i) => {
              const d = new Date(now);
              d.setDate(now.getDate() - 89 + i);
              return (
                <div
                  key={i}
                  className="aspect-square rounded-[2px]"
                  style={{ background: heatmapDone.has(toDateKey(d)) ? 'var(--accent)' : 'var(--rule-soft)' }}
                />
              );
            })}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground mt-2 tracking-[0.05em]">{t("last90Days")}</div>
        </div>

        {/* Tempo investido */}
        <div className="bg-card rounded-[var(--radius-lg)] p-7 flex flex-col">
          <h2 className="font-medium text-[15px] m-0 tracking-[-0.015em] text-foreground mb-5">{t("timeInvested")}</h2>
          <div className="flex items-baseline leading-none text-foreground font-medium tracking-[-0.04em]">
            <span className="text-[40px]">47</span><span className="text-[20px] ml-0.5 text-muted-foreground font-normal">h</span>
            <span className="text-[40px] ml-2">22</span><span className="text-[20px] ml-0.5 text-muted-foreground font-normal">m</span>
          </div>
          <div className="text-[12px] text-muted-foreground font-mono mt-1">{t("sinceStart")}</div>
          <div className="flex flex-col mt-3">
            {INV_BARS.map((b) => (
              <div key={b.l} className="flex flex-col gap-1 mt-3">
                <div className="flex justify-between text-[12px] text-muted-foreground">
                  <span>{b.l}</span>
                  <span>{b.v}%</span>
                </div>
                <div className="h-[3px] bg-muted rounded-full overflow-hidden">
                  <div style={{ width: `${b.v}%`, background: b.c }} className="h-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico — col-span-3 */}
        <div className="col-span-3 bg-card rounded-[var(--radius-lg)] p-7">
          <h2 className="font-medium text-[15px] m-0 tracking-[-0.015em] text-foreground mb-5">{t("history")}</h2>
          <ul className="list-none p-0 m-0">
            {history.map((w, i) => (
              <li
                key={i}
                className="grid grid-cols-[140px_1fr_80px] items-center gap-4 py-3 border-t border-border text-[13px] first:border-t-0"
              >
                <span style={{ color: 'var(--ink-2)' }}>{w.label}</span>
                <div className="flex gap-1">
                  {Array.from({ length: w.goal }, (_, j) => (
                    <span
                      key={j}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        background: j < w.done
                          ? (w.hit ? 'var(--accent)' : 'var(--ink-4)')
                          : 'var(--muted)',
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[11px] font-mono tracking-[0.04em] uppercase justify-self-end"
                  style={{ color: w.hit ? 'var(--ok)' : 'var(--ink-4)' }}
                >
                  {w.hit ? t("fulfilled") : t("failed")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
