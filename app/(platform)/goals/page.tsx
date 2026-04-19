import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const GOAL_BREAKDOWN = [
  { course: "Kali Linux", count: 3, unit: "aulas" },
  { course: "Pão & fermentação", count: 1, unit: "aula" },
];

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

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const [streakData, weeklyProgress] = await Promise.all([
    db.userStreak.findUnique({ where: { userId } }),
    db.userProgress.count({
      where: {
        userId,
        status: "COMPLETED",
        updatedAt: { gte: startOfWeek },
      },
    }),
  ]);

  const currentStreak = streakData?.currentStreak ?? 0;
  const bestStreak = streakData?.longestStreak ?? currentStreak;
  const weeklyGoal = 6;

  const weekRange = `${startOfWeek.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${endOfWeek.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`;

  const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    const isPast = d < now && !isToday;
    return { label: DAY_LABELS[i], date: d.getDate().toString(), today: isToday, done: isPast };
  });

  const history = Array.from({ length: 6 }, (_, i) => {
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(weekStart.getDate() - (5 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const done = i === 5 ? weeklyProgress : i % 3 === 2 ? weeklyGoal - 2 : weeklyGoal;
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
          <h1 className="font-medium text-[28px] leading-[1.15] tracking-[-0.02em] m-0 text-foreground">Metas</h1>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Meta semanal — col-span-2 */}
        <div className="col-span-2 bg-card rounded-[var(--radius-lg)] p-7 flex flex-col">
          <div className="flex justify-between items-baseline mb-5">
            <h2 className="font-medium text-[15px] m-0 tracking-[-0.015em] text-foreground">Meta semanal</h2>
            <button className="text-[12px] text-muted-foreground bg-transparent border-0 cursor-pointer hover:text-foreground px-2 py-1 rounded transition-colors">
              Editar meta
            </button>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <div className="text-[72px] leading-none tracking-[-0.05em] text-foreground font-medium tabular-nums">
              {weeklyProgress}
            </div>
            <div className="text-[36px] text-muted-foreground font-normal">/{weeklyGoal}</div>
          </div>
          <div className="text-[14px] text-muted-foreground mb-auto">aulas esta semana</div>

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
                    <span className="w-3.5 h-3.5 border border-muted-foreground rounded-full inline-block" />
                  )}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground mt-1.5">{d.date}</div>
              </div>
            ))}
          </div>

          {/* Goal breakdown */}
          <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-border">
            {GOAL_BREAKDOWN.map((item) => (
              <div key={item.course} className="flex justify-between items-center text-[13px]">
                <span className="text-muted-foreground">{item.course}</span>
                <strong className="font-medium text-foreground">
                  {item.count} {item.unit}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Sequência */}
        <div className="bg-card rounded-[var(--radius-lg)] p-7 flex flex-col">
          <h2 className="font-medium text-[15px] m-0 tracking-[-0.015em] text-foreground mb-5">Sequência</h2>
          <div className="text-[72px] leading-none tracking-[-0.05em] text-foreground font-medium tabular-nums">
            {currentStreak}
          </div>
          <div className="text-[14px] text-muted-foreground mt-1">dias consecutivos</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-3 tracking-[0.02em]">
            Recorde: {bestStreak} dias
          </div>
          <div className="mt-5 grid grid-cols-[repeat(15,1fr)] gap-[3px]">
            {Array.from({ length: 90 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-[2px]${i < currentStreak ? " bg-accent" : " bg-border/50"}`}
              />
            ))}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground mt-2 tracking-[0.05em]">Últimos 90 dias</div>
        </div>

        {/* Tempo investido */}
        <div className="bg-card rounded-[var(--radius-lg)] p-7 flex flex-col">
          <h2 className="font-medium text-[15px] m-0 tracking-[-0.015em] text-foreground mb-5">Tempo investido</h2>
          <div className="text-[48px] font-medium tracking-tight leading-none text-foreground">47h 22m</div>
          <div className="text-[12px] text-muted-foreground font-mono mt-1">desde o início · Jan 2026</div>
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
          <h2 className="font-medium text-[15px] m-0 tracking-[-0.015em] text-foreground mb-5">Histórico</h2>
          <ul className="list-none p-0 m-0">
            {history.map((w, i) => (
              <li
                key={i}
                className="grid grid-cols-[140px_1fr_80px] items-center gap-4 py-3 border-t border-border text-[13px] first:border-t-0"
              >
                <span className="text-muted-foreground">{w.label}</span>
                <div className="flex gap-1">
                  {Array.from({ length: w.goal }, (_, j) => (
                    <span
                      key={j}
                      className={`w-3 h-3 rounded-sm${j < w.done ? " bg-accent" : " bg-muted"}`}
                    />
                  ))}
                </div>
                <span
                  className={`text-[11px] font-mono tracking-[0.04em] uppercase justify-self-end${
                    w.hit ? " text-accent" : " text-muted-foreground"
                  }`}
                >
                  {w.hit ? "cumprida" : "falhou"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
