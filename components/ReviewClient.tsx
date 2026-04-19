"use client";
import { useState, useEffect, useCallback } from "react";

type Card = {
  q: string;
  a: string;
  tag: string;
  course: string;
};

type Course = {
  id: string;
  name: string;
  color: string;
  due: number;
  total: number;
  new: number;
  learning: number;
  overdue: number;
  cards: Card[];
};

type ScheduleDay = {
  label: string;
  count: number;
  hot?: boolean;
};

type Results = { again: number; hard: number; good: number; easy: number };

type Props = {
  courses: Course[];
  totalDue: number;
  totalOverdue: number;
  streak: number;
  schedule: ScheduleDay[];
  message: string;
};

const SAMPLE_CARD_POOL: Card[] = [
  { course: "__sample__", q: "What does nmap -sS do?", a: "A stealth (SYN) scan — never completes the TCP handshake, so it's harder to log.", tag: "lab" },
  { course: "__sample__", q: "Vulnerabilidade vs. exploit?", a: "Vulnerabilidade é a falha. Exploit é a técnica que a abusa.", tag: "concept" },
  { course: "__sample__", q: "O que é BATNA?", a: "Melhor Alternativa a um Acordo Negociado — seu plano B. BATNA forte = posição forte.", tag: "concept" },
  { course: "__sample__", q: "What layer does ARP live at?", a: "Layer 2 (data link). It resolves IP → MAC on the local network.", tag: "concept" },
  { course: "__sample__", q: "Ancoragem, em uma frase.", a: "O primeiro número mencionado numa negociação molda o intervalo de todas as contra-propostas.", tag: "concept" },
  { course: "__sample__", q: "Metasploit: payload vs. exploit?", a: "Exploit delivers the payload. Payload is what runs after delivery (e.g. a reverse shell).", tag: "lab" },
];

export default function ReviewClient({ courses, totalDue, totalOverdue, streak, schedule, message }: Props) {
  const [mode, setMode] = useState<"dashboard" | "session" | "done">("dashboard");
  const [sessionCards, setSessionCards] = useState<(Card & { courseMeta: Course })[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Results>({ again: 0, hard: 0, good: 0, easy: 0 });

  const buildPool = useCallback(
    (filter: "all" | "overdue" | string): (Card & { courseMeta: Course })[] => {
      let pool: (Card & { courseMeta: Course })[] = [];
      const targetCourses = filter === "all" || filter === "overdue" ? courses : courses.filter((c) => c.id === filter);
      for (const course of targetCourses) {
        const cards = course.cards.length > 0 ? course.cards : SAMPLE_CARD_POOL;
        const limit = filter === "overdue" ? course.overdue : course.due;
        const slice = cards.slice(0, Math.max(limit, 1));
        pool = pool.concat(slice.map((card) => ({ ...card, courseMeta: course })));
      }
      if (pool.length === 0) {
        pool = SAMPLE_CARD_POOL.map((card) => ({
          ...card,
          courseMeta: courses[0] ?? { id: "__sample__", name: "Revisão", color: "#c97a4a", due: 0, total: 0, new: 0, learning: 0, overdue: 0, cards: [] },
        }));
      }
      return [...pool].sort(() => Math.random() - 0.5);
    },
    [courses]
  );

  const startSession = useCallback(
    (filter: "all" | "overdue" | string) => {
      setSessionCards(buildPool(filter));
      setIdx(0);
      setRevealed(false);
      setResults({ again: 0, hard: 0, good: 0, easy: 0 });
      setMode("session");
    },
    [buildPool]
  );

  const rate = useCallback(
    (rating: keyof Results) => {
      setResults((r) => ({ ...r, [rating]: r[rating] + 1 }));
      if (idx + 1 >= sessionCards.length) setMode("done");
      else { setIdx((i) => i + 1); setRevealed(false); }
    },
    [idx, sessionCards.length]
  );

  const endSession = useCallback(() => setMode("dashboard"), []);

  // Keyboard shortcuts — Space to reveal, 1-4 to rate
  useEffect(() => {
    if (mode !== "session") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); setRevealed((f) => !f); }
      else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        rate({ "1": "again", "2": "hard", "3": "good", "4": "easy" }[e.key] as keyof Results);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, revealed, rate]);

  // ——— DASHBOARD ———
  if (mode === "dashboard") {
    const maxN = Math.max(...schedule.map((x) => x.count), 1);

    return (
      <div className="flex flex-col gap-12 pb-20">
        {/* Hero */}
        <header className="grid grid-cols-[1fr_300px] gap-12 items-start pb-8 border-b border-border">
          <div>
            <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted-foreground mb-4">
              REVISÃO ESPAÇADA
            </div>
            <h1 className="font-medium text-[36px] leading-[1.15] tracking-[-0.02em] m-0 text-foreground">
              {totalDue > 0 ? (
                <>{totalDue} <span className="text-muted-foreground font-normal">cartões pendentes</span></>
              ) : (
                <>Tudo em dia <span className="text-muted-foreground font-normal">·</span></>
              )}
            </h1>
            <p className="text-[15px] leading-[1.6] text-muted-foreground mt-3 max-w-[62ch] m-0">{message}</p>
            <div className="flex gap-2 flex-wrap mt-6">
              <button
                className="bg-foreground text-background px-6 py-3.5 rounded-[var(--radius)] text-[15px] font-medium cursor-pointer border-0 font-[inherit] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => startSession("all")}
                disabled={totalDue === 0}
              >
                Revisar tudo · ~{Math.ceil(totalDue * 0.5)} min
              </button>
              <button
                className="bg-transparent text-foreground/80 px-5 py-3.5 rounded-[var(--radius)] text-[14px] border-0 cursor-pointer font-[inherit] transition-colors hover:bg-card hover:text-foreground"
                onClick={() => startSession("overdue")}
              >
                Só os {totalOverdue} atrasados
              </button>
              <button className="bg-transparent text-foreground/80 px-5 py-3.5 rounded-[var(--radius)] text-[14px] border-0 cursor-pointer font-[inherit] transition-colors hover:bg-card hover:text-foreground">
                Sessão customizada…
              </button>
            </div>
          </div>

          {/* Streak card */}
          <aside className="bg-card rounded-[var(--radius-lg)] p-5 text-center">
            <div className="text-[56px] font-medium tracking-tight leading-none text-accent">
              {streak}<span className="text-[24px] text-muted-foreground font-normal ml-0.5">d</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground my-1">
              dias seguidos
            </div>
            <div className="grid grid-cols-7 gap-[3px] max-w-[180px] mx-auto">
              {Array.from({ length: 28 }).map((_, i) => {
                const state = i < streak ? "done" : i === streak ? "today" : i > streak + 8 ? "none" : "scheduled";
                return (
                  <span
                    key={i}
                    className={`aspect-square rounded-[3px]${
                      state === "done" ? " bg-accent"
                      : state === "today" ? " bg-foreground shadow-[0_0_0_2px_color-mix(in_oklch,var(--foreground),transparent_75%)]"
                      : state === "scheduled" ? " bg-muted border border-dashed border-muted-foreground/40 box-border"
                      : " bg-transparent"
                    }`}
                  />
                );
              })}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground mt-3">Últimas 4 semanas</div>
          </aside>
        </header>

        {/* Course queue */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[18px] tracking-[-0.01em] font-medium m-0 text-foreground">Pendentes por curso</h2>
          <div className="flex flex-col gap-2">
            {courses.length === 0 ? (
              <p className="px-4 py-4 text-muted-foreground">Nenhum curso em andamento.</p>
            ) : (
              courses.map((c) => (
                <div
                  key={c.id}
                  className={`grid grid-cols-[4px_1fr_auto] items-center bg-card rounded-[var(--radius-lg)] overflow-hidden transition-colors${c.due === 0 ? " opacity-60" : ""}`}
                >
                  <div className="h-full min-h-16" style={{ background: c.color }} />
                  <div className="flex flex-col gap-2 py-4 pl-5 pr-5">
                    {/* Header row */}
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="text-[15px] font-medium tracking-[-0.01em] text-foreground">{c.name}</div>
                      <div className="font-mono text-[12px] text-muted-foreground tracking-[0.02em]">
                        {c.due === 0 ? "em dia" : <><strong className="text-foreground font-semibold text-[14px]">{c.due}</strong> pendentes</>}
                      </div>
                    </div>
                    {/* Breakdown badges */}
                    {c.due > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {c.overdue > 0 && (
                          <span className="font-mono text-[10px] tracking-[0.05em] uppercase px-2 py-[3px] rounded-[3px] text-[#b84a3e] bg-[#b84a3e]/10">
                            {c.overdue} atrasados
                          </span>
                        )}
                        {c.learning > 0 && (
                          <span className="font-mono text-[10px] tracking-[0.05em] uppercase px-2 py-[3px] rounded-[3px] text-muted-foreground bg-background">
                            {c.learning} aprendendo
                          </span>
                        )}
                        {c.new > 0 && (
                          <span className="font-mono text-[10px] tracking-[0.05em] uppercase px-2 py-[3px] rounded-[3px] text-accent bg-accent/10">
                            {c.new} novos
                          </span>
                        )}
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className="flex items-center gap-2.5 mt-1">
                      <div className="flex-1 h-[3px] bg-background rounded-full overflow-hidden max-w-[260px]">
                        <div
                          className="h-full transition-[width]"
                          style={{ width: `${((c.total - c.due) / Math.max(c.total, 1)) * 100}%`, background: c.color }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground tracking-[0.02em]">
                        {c.total - c.due} / {c.total} aprendidos
                      </span>
                    </div>
                  </div>
                  {/* Go button */}
                  {c.due > 0 && (
                    <button
                      className="bg-foreground text-background px-4 py-2.5 text-[13px] font-medium rounded-[var(--radius)] cursor-pointer border-0 font-[inherit] hover:opacity-90 transition-opacity mr-5"
                      onClick={() => startSession(c.id)}
                    >
                      Revisar →
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Schedule */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[18px] tracking-[-0.01em] font-medium m-0 text-foreground">Esta semana</h2>
          <div className="grid grid-cols-7 gap-3 items-end px-5 py-6 bg-card rounded-[var(--radius-lg)] min-h-[180px]">
            {schedule.map((d, i) => {
              const h = Math.max(8, (d.count / maxN) * 120);
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`font-mono text-[12px] tabular-nums${d.hot ? " text-accent font-semibold" : " text-muted-foreground"}`}>
                    {d.count}
                  </div>
                  <div className="w-full max-w-12 bg-muted rounded-t-[4px] min-h-2 overflow-hidden" style={{ height: h }}>
                    <div className={`h-full transition-[height]${d.hot ? " bg-accent" : " bg-muted-foreground"}`} />
                  </div>
                  <div className={`font-mono text-[10px] tracking-[0.08em] uppercase${d.hot ? " text-accent font-semibold" : " text-muted-foreground"}`}>
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Tip */}
          <div className="flex gap-2.5 items-baseline mt-4 p-3 text-[13px] text-muted-foreground max-w-[72ch]">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground/60 shrink-0">Dica</span>
            Sessões curtas e diárias vencem maratonas no fim de semana. O algoritmo recompensa consistência.
          </div>
        </section>
      </div>
    );
  }

  // ——— SESSION ———
  if (mode === "session") {
    const card = sessionCards[idx];
    if (!card) return null;
    const { courseMeta } = card;
    const total = sessionCards.length;
    const progress = ((idx + (revealed ? 0.5 : 0)) / total) * 100;

    return (
      <div className="fixed inset-0 bg-background grid grid-rows-[auto_1fr] z-50">
        <header className="grid grid-cols-3 items-center px-8 py-5 border-b border-border gap-6">
          {/* Exit */}
          <button
            className="bg-transparent border-0 text-muted-foreground font-[inherit] text-[13px] cursor-pointer justify-self-start px-3 py-2 rounded-[var(--radius)] hover:bg-card hover:text-foreground transition-colors"
            onClick={endSession}
          >
            ← Encerrar
          </button>
          {/* Progress */}
          <div className="flex items-center gap-3 justify-self-center min-w-[300px]">
            <div className="flex-1 h-[3px] bg-border rounded-[2px] overflow-hidden">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-[11px] text-muted-foreground tracking-[0.02em] tabular-nums">
              {idx + 1} / {total}
            </span>
          </div>
          {/* Results counters */}
          <div className="flex gap-1.5 justify-self-end">
            {(["again", "hard", "good", "easy"] as const).map((k) => (
              <span
                key={k}
                className={`font-mono text-[11px] px-2 py-1 rounded-[4px] bg-card text-center min-w-[28px]${
                  k === "again" ? " text-[#b84a3e]" : k === "hard" ? " text-[#c98a2e]" : k === "good" ? " text-[#4a8a5a]" : " text-[#4a7aa8]"
                }`}
              >
                {results[k]}
              </span>
            ))}
          </div>
        </header>

        <main className="flex flex-col items-center justify-center gap-8 p-12 overflow-y-auto">
          {/* Card meta */}
          <div className="flex items-center gap-3.5 font-mono text-[11px] tracking-[0.04em]">
            <span
              className="flex items-center gap-1.5 font-semibold uppercase text-[10px] tracking-[0.1em]"
              style={{ color: courseMeta.color }}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: courseMeta.color }} />
              {courseMeta.name}
            </span>
            <span className="text-muted-foreground uppercase text-[10px] tracking-[0.1em] px-2 py-[3px] bg-card rounded-[3px]">
              {card.tag}
            </span>
          </div>

          {/* Card */}
          <div className="w-full max-w-[680px] p-12 bg-card rounded-[var(--radius-lg)] border border-border animate-[rsIn_0.25s_ease-out]">
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3.5">Pergunta</div>
            <div className="text-[28px] leading-[1.3] tracking-[-0.015em] font-medium text-balance text-foreground">{card.q}</div>
            {revealed && (
              <>
                <div className="h-px bg-border my-8" />
                <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3.5">Resposta</div>
                <div className="text-[18px] leading-[1.55] text-foreground/80 text-balance animate-[rsAnswerIn_0.3s_ease-out]">{card.a}</div>
              </>
            )}
          </div>

          {/* Reveal button */}
          {!revealed && (
            <button
              className="px-7 py-3.5 bg-foreground text-background border-0 rounded-[var(--radius)] font-[inherit] text-[14px] font-medium cursor-pointer flex items-center gap-3 transition-opacity hover:opacity-90"
              onClick={() => setRevealed(true)}
            >
              Mostrar resposta{" "}
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white/30 rounded-[3px] tracking-[0.04em]">Space</span>
            </button>
          )}

          {/* Rating buttons */}
          {revealed && (
            <div className="w-full max-w-[680px] animate-[rsAnswerIn_0.3s_ease-out]">
              <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground text-center mb-3.5">
                Quão bem você lembrou?
              </div>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { key: "again", label: "De novo", next: "< 1 min", kbd: "1", color: "#b84a3e" },
                  { key: "hard", label: "Difícil", next: "10 min", kbd: "2", color: "#c98a2e" },
                  { key: "good", label: "Bom", next: "2 dias", kbd: "3", color: "#4a8a5a" },
                  { key: "easy", label: "Fácil", next: "6 dias", kbd: "4", color: "#4a7aa8" },
                ] as const).map((b) => (
                  <button
                    key={b.key}
                    className="group flex flex-col items-start gap-1 p-4 pl-[18px] bg-card border border-border rounded-[var(--radius-lg)] cursor-pointer font-[inherit] text-left transition-all relative hover:-translate-y-px hover:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.15)]"
                    onClick={() => rate(b.key as keyof Results)}
                    onMouseEnter={(e) => {
                      const btn = e.currentTarget;
                      btn.style.borderColor = b.color;
                      const label = btn.querySelector<HTMLElement>(".rb-label");
                      if (label) label.style.color = b.color;
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.currentTarget;
                      btn.style.borderColor = "";
                      const label = btn.querySelector<HTMLElement>(".rb-label");
                      if (label) label.style.color = "";
                    }}
                  >
                    <span className="rb-label text-[15px] font-medium text-foreground">{b.label}</span>
                    <span className="text-[11px] text-muted-foreground font-mono tracking-[0.02em]">{b.next}</span>
                    <span className="absolute top-2 right-2 font-mono text-[10px] text-muted-foreground px-1.5 py-[2px] bg-background rounded-[3px]">
                      {b.kbd}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ——— DONE ———
  const totalRated = Object.values(results).reduce((s, n) => s + n, 0);
  const retention = totalRated > 0 ? Math.round(((results.good + results.easy) / totalRated) * 100) : 0;

  return (
    <div className="grid place-items-center min-h-screen">
      <div className="max-w-[560px] w-full text-center px-8">
        <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent mb-3">Sessão completa</div>
        <h1 className="font-medium text-[36px] leading-[1.15] tracking-[-0.02em] m-0 text-foreground">Muito bem.</h1>
        <p className="text-[15px] leading-[1.6] text-muted-foreground mt-3 max-w-[62ch] m-0">
          Você revisou {totalRated} cartões com {retention}% de retenção.
        </p>
        <div className="grid grid-cols-4 gap-2 my-8">
          {([
            { n: results.again, l: "De novo" },
            { n: results.hard, l: "Difícil" },
            { n: results.good, l: "Bom" },
            { n: results.easy, l: "Fácil" },
          ]).map((s) => (
            <div key={s.l} className="p-4 bg-card rounded-[var(--radius-lg)]">
              <div className="text-[28px] font-medium tracking-[-0.02em] tabular-nums text-foreground">{s.n}</div>
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="p-5 bg-card rounded-[var(--radius-lg)] mb-6 text-left">
          <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-2.5">Agendado para depois</div>
          <div className="grid grid-cols-2 gap-2 text-[13px] text-muted-foreground">
            <div><strong className="text-foreground font-semibold tabular-nums">{results.again}</strong> em alguns minutos</div>
            <div><strong className="text-foreground font-semibold tabular-nums">{results.hard}</strong> em 10 minutos</div>
            <div><strong className="text-foreground font-semibold tabular-nums">{results.good}</strong> em 2 dias</div>
            <div><strong className="text-foreground font-semibold tabular-nums">{results.easy}</strong> em 6 dias</div>
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            className="bg-foreground text-background px-5 py-3 rounded-[var(--radius)] text-[14px] font-medium cursor-pointer border-0 font-[inherit] transition-opacity hover:opacity-90"
            onClick={endSession}
          >
            Voltar para revisão
          </button>
          <button
            className="bg-transparent text-foreground/80 px-5 py-3 rounded-[var(--radius)] text-[14px] border-0 cursor-pointer font-[inherit] transition-colors hover:bg-card hover:text-foreground"
            onClick={() => startSession("all")}
          >
            Revisar mais
          </button>
        </div>
      </div>
    </div>
  );
}
