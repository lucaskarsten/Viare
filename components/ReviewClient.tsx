"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

type ReviewCardData = {
  id: string;
  front: string;
  back: string;
  lessonId: string;
  dueAt: string;
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
  cards?: unknown[];
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

const RATING_MAP = { again: 0, hard: 1, good: 2, easy: 3 } as const;

export default function ReviewClient({
  courses,
  totalDue,
  totalOverdue,
  streak,
  schedule,
  message,
}: Props) {
  const t = useTranslations("review");
  const [mode, setMode] = useState<"dashboard" | "session" | "done">("dashboard");
  const [realCards, setRealCards] = useState<ReviewCardData[]>([]);
  const [sessionCards, setSessionCards] = useState<ReviewCardData[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Results>({ again: 0, hard: 0, good: 0, easy: 0 });

  const ratingButtons = [
    {
      key: "again" as const,
      label: t("again"),
      next: t("nextTime.again"),
      kbd: "1",
      color: "var(--rating-again)",
    },
    {
      key: "hard" as const,
      label: t("hard"),
      next: t("nextTime.hard"),
      kbd: "2",
      color: "var(--rating-hard)",
    },
    {
      key: "good" as const,
      label: t("good"),
      next: t("nextTime.good"),
      kbd: "3",
      color: "var(--rating-good)",
    },
    {
      key: "easy" as const,
      label: t("easy"),
      next: t("nextTime.easy"),
      kbd: "4",
      color: "var(--rating-easy)",
    },
  ];

  useEffect(() => {
    fetch("/api/review/cards")
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((data: { cards: ReviewCardData[] }) => setRealCards(data.cards ?? []))
      .catch(() => {});
  }, []);

  const startSession = useCallback(() => {
    const shuffled = [...realCards].sort(() => Math.random() - 0.5);
    setSessionCards(shuffled);
    setIdx(0);
    setRevealed(false);
    setResults({ again: 0, hard: 0, good: 0, easy: 0 });
    setMode("session");
  }, [realCards]);

  const rate = useCallback(
    (ratingKey: keyof Results) => {
      const card = sessionCards[idx];
      if (!card) return;
      fetch(`/api/review/cards/${card.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: RATING_MAP[ratingKey] }),
      }).catch(() => {});
      setResults((r) => ({ ...r, [ratingKey]: r[ratingKey] + 1 }));
      if (idx + 1 >= sessionCards.length) setMode("done");
      else {
        setIdx((i) => i + 1);
        setRevealed(false);
      }
    },
    [idx, sessionCards]
  );

  const endSession = useCallback(() => setMode("dashboard"), []);

  useEffect(() => {
    if (mode !== "session") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setRevealed((f) => !f);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        rate({ "1": "again", "2": "hard", "3": "good", "4": "easy" }[e.key] as keyof Results);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, revealed, rate]);

  // ——— DASHBOARD ———
  if (mode === "dashboard") {
    const hasDue = realCards.length > 0;
    const maxN = Math.max(...schedule.map((x) => x.count), 1);

    return (
      <div className="flex flex-col gap-12 pb-20">
        {/* Hero */}
        <header className="grid grid-cols-[1fr_300px] gap-12 items-start pb-8 border-b border-border">
          <div>
            <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted-foreground mb-4">
              {t("label")}
            </div>
            <h1 className="font-medium text-[36px] leading-[1.15] tracking-[-0.02em] m-0 text-foreground">
              {totalDue > 0 ? (
                <>
                  {totalDue}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t("cardsPending", { count: totalDue }).replace(`${totalDue} `, "")}
                  </span>
                </>
              ) : (
                <>{t("allCaughtUp")}</>
              )}
            </h1>
            <p className="text-[15px] leading-[1.6] text-muted-foreground mt-3 max-w-[62ch] m-0">
              {message}
            </p>
            <div className="flex gap-2 flex-wrap mt-6">
              <button
                className="bg-foreground text-background px-6 py-3.5 rounded-[var(--radius)] text-[15px] font-medium cursor-pointer border-0 font-[inherit] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={startSession}
                disabled={!hasDue}
              >
                {t("reviewAll", { minutes: Math.ceil((realCards.length || totalDue) * 0.5) })}
              </button>
              {totalOverdue > 0 && (
                <button
                  className="bg-transparent text-foreground/80 px-5 py-3.5 rounded-[var(--radius)] text-[14px] border-0 cursor-pointer font-[inherit] transition-colors hover:bg-card hover:text-foreground"
                  onClick={startSession}
                >
                  {t("overdueOnly", { count: totalOverdue })}
                </button>
              )}
              <button className="bg-transparent text-foreground/80 px-5 py-3.5 rounded-[var(--radius)] text-[14px] border-0 cursor-pointer font-[inherit] transition-colors hover:bg-card hover:text-foreground">
                {t("customSession")}
              </button>
            </div>
          </div>

          {/* Streak card */}
          <aside className="bg-card rounded-[var(--radius-lg)] p-5 text-center">
            <div className="text-[56px] font-medium tracking-tight leading-none text-accent">
              {streak}
              <span className="text-[24px] text-muted-foreground font-normal ml-0.5">d</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground my-1">
              {t("streakDays")}
            </div>
            <div className="grid grid-cols-7 gap-[3px] max-w-[180px] mx-auto">
              {Array.from({ length: 28 }).map((_, i) => {
                const state =
                  i < streak
                    ? "done"
                    : i === streak
                      ? "today"
                      : i > streak + 8
                        ? "none"
                        : "scheduled";
                return (
                  <span
                    key={i}
                    className={`aspect-square rounded-[3px]${
                      state === "done"
                        ? " bg-accent"
                        : state === "today"
                          ? " bg-foreground shadow-[0_0_0_2px_color-mix(in_oklch,var(--foreground),transparent_75%)]"
                          : state === "scheduled"
                            ? " bg-muted border border-dashed border-muted-foreground/40 box-border"
                            : " bg-transparent"
                    }`}
                  />
                );
              })}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground mt-3">
              {t("last4Weeks")}
            </div>
          </aside>
        </header>

        {/* Course queue */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[18px] tracking-[-0.01em] font-medium m-0 text-foreground">
            {t("pendingByCourse")}
          </h2>
          <div className="flex flex-col gap-2">
            {courses.length === 0 ? (
              <p className="px-4 py-4 text-muted-foreground">{t("noCourses")}</p>
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
                      <div className="text-[15px] font-medium tracking-[-0.01em] text-foreground">
                        {c.name}
                      </div>
                      <div className="font-mono text-[12px] text-muted-foreground tracking-[0.02em]">
                        {c.due === 0 ? (
                          t("upToDate")
                        ) : (
                          <>
                            <strong className="text-foreground font-semibold text-[14px]">
                              {c.due}
                            </strong>{" "}
                            {t("pending")}
                          </>
                        )}
                      </div>
                    </div>
                    {/* Breakdown badges */}
                    {c.due > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {c.overdue > 0 && (
                          <span
                            className="font-mono text-[10px] tracking-[0.05em] uppercase px-2 py-[3px] rounded-[3px]"
                            style={{
                              color: "var(--rating-again)",
                              background:
                                "color-mix(in oklch, var(--rating-again), transparent 88%)",
                            }}
                          >
                            {t("overdue", { count: c.overdue })}
                          </span>
                        )}
                        {c.learning > 0 && (
                          <span className="font-mono text-[10px] tracking-[0.05em] uppercase px-2 py-[3px] rounded-[3px] text-muted-foreground bg-background">
                            {t("learning", { count: c.learning })}
                          </span>
                        )}
                        {c.new > 0 && (
                          <span className="font-mono text-[10px] tracking-[0.05em] uppercase px-2 py-[3px] rounded-[3px] text-accent bg-accent/10">
                            {t("new", { count: c.new })}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className="flex items-center gap-2.5 mt-1">
                      <div className="flex-1 h-[3px] bg-background rounded-full overflow-hidden max-w-[260px]">
                        <div
                          className="h-full transition-[width]"
                          style={{
                            width: `${((c.total - c.due) / Math.max(c.total, 1)) * 100}%`,
                            background: c.color,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground tracking-[0.02em]">
                        {t("learned", { done: c.total - c.due, total: c.total })}
                      </span>
                    </div>
                  </div>
                  {/* Go button */}
                  {c.due > 0 && (
                    <button
                      className="bg-foreground text-background px-4 py-2.5 text-[13px] font-medium rounded-[var(--radius)] cursor-pointer border-0 font-[inherit] hover:opacity-90 transition-opacity mr-5 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={startSession}
                      disabled={!hasDue}
                    >
                      {t("reviewCourse")}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Schedule */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[18px] tracking-[-0.01em] font-medium m-0 text-foreground">
            {t("thisWeek")}
          </h2>
          <div className="grid grid-cols-7 gap-3 items-end px-5 py-6 bg-card rounded-[var(--radius-lg)] min-h-[180px]">
            {schedule.map((d, i) => {
              const h = Math.max(8, (d.count / maxN) * 120);
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className={`font-mono text-[12px] tabular-nums${d.hot ? " text-accent font-semibold" : " text-muted-foreground"}`}
                  >
                    {d.count}
                  </div>
                  <div
                    className="w-full max-w-12 bg-muted rounded-t-[4px] min-h-2 overflow-hidden"
                    style={{ height: h }}
                  >
                    <div
                      className={`h-full transition-[height]${d.hot ? " bg-accent" : " bg-muted-foreground"}`}
                    />
                  </div>
                  <div
                    className={`font-mono text-[10px] tracking-[0.08em] uppercase${d.hot ? " text-accent font-semibold" : " text-muted-foreground"}`}
                  >
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Tip */}
          <div className="flex gap-2.5 items-baseline mt-4 p-3 text-[13px] text-muted-foreground max-w-[72ch]">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground/60 shrink-0">
              {t("tip")}
            </span>
            {t("tipText")}
          </div>
        </section>
      </div>
    );
  }

  // ——— SESSION ———
  if (mode === "session") {
    const card = sessionCards[idx];
    if (!card) return null;
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
            {t("exitSession")}
          </button>
          {/* Progress */}
          <div className="flex items-center gap-3 justify-self-center min-w-[300px]">
            <div className="flex-1 h-[3px] bg-border rounded-[2px] overflow-hidden">
              <div
                className="h-full bg-accent transition-[width]"
                style={{ width: `${progress}%` }}
              />
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
                className="font-mono text-[11px] px-2 py-1 rounded-[4px] bg-card text-center min-w-[28px]"
                style={{ color: `var(--rating-${k})` }}
              >
                {results[k]}
              </span>
            ))}
          </div>
        </header>

        <main className="flex flex-col items-center justify-center gap-8 p-12 overflow-y-auto">
          {/* Card */}
          <div className="w-full max-w-[680px] p-12 bg-card rounded-[var(--radius-lg)] border border-border animate-[rsIn_0.25s_ease-out]">
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3.5">
              {t("question")}
            </div>
            <div className="text-[28px] leading-[1.3] tracking-[-0.015em] font-medium text-balance text-foreground">
              {card.front}
            </div>
            {revealed && (
              <>
                <div className="h-px bg-border my-8" />
                <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3.5">
                  {t("answer")}
                </div>
                <div className="text-[18px] leading-[1.55] text-foreground/80 text-balance animate-[rsAnswerIn_0.3s_ease-out]">
                  {card.back}
                </div>
              </>
            )}
          </div>

          {/* Reveal button */}
          {!revealed && (
            <button
              className="px-7 py-3.5 bg-foreground text-background border-0 rounded-[var(--radius)] font-[inherit] text-[14px] font-medium cursor-pointer flex items-center gap-3 transition-opacity hover:opacity-90"
              onClick={() => setRevealed(true)}
            >
              {t("showAnswer")}{" "}
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white/30 rounded-[3px] tracking-[0.04em]">
                Space
              </span>
            </button>
          )}

          {/* Rating buttons */}
          {revealed && (
            <div className="w-full max-w-[680px] animate-[rsAnswerIn_0.3s_ease-out]">
              <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground text-center mb-3.5">
                {t("howWell")}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ratingButtons.map((b) => (
                  <button
                    key={b.key}
                    className="group flex flex-col items-start gap-1 p-4 pl-[18px] bg-card border border-border rounded-[var(--radius-lg)] cursor-pointer font-[inherit] text-left transition-all relative hover:-translate-y-px hover:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.15)]"
                    onClick={() => rate(b.key)}
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
                    <span className="rb-label text-[15px] font-medium text-foreground">
                      {b.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono tracking-[0.02em]">
                      {b.next}
                    </span>
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
  const retention =
    totalRated > 0 ? Math.round(((results.good + results.easy) / totalRated) * 100) : 0;

  return (
    <div className="grid place-items-center min-h-screen">
      <div className="max-w-[560px] w-full text-center px-8">
        <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-accent mb-3">
          {t("sessionComplete")}
        </div>
        <h1 className="font-medium text-[36px] leading-[1.15] tracking-[-0.02em] m-0 text-foreground">
          {t("wellDone")}
        </h1>
        <p className="text-[15px] leading-[1.6] text-muted-foreground mt-3 max-w-[62ch] m-0">
          {t("sessionSummary", { count: totalRated, retention })}
        </p>
        <div className="grid grid-cols-4 gap-2 my-8">
          {[
            { n: results.again, l: t("again") },
            { n: results.hard, l: t("hard") },
            { n: results.good, l: t("good") },
            { n: results.easy, l: t("easy") },
          ].map((s) => (
            <div key={s.l} className="p-4 bg-card rounded-[var(--radius-lg)]">
              <div className="text-[28px] font-medium tracking-[-0.02em] tabular-nums text-foreground">
                {s.n}
              </div>
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mt-0.5">
                {s.l}
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 bg-card rounded-[var(--radius-lg)] mb-6 text-left">
          <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-2.5">
            {t("scheduledAfter")}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[13px] text-muted-foreground">
            <div>
              <strong className="text-foreground font-semibold tabular-nums">
                {results.again}
              </strong>{" "}
              {t("scheduleItems.again")}
            </div>
            <div>
              <strong className="text-foreground font-semibold tabular-nums">{results.hard}</strong>{" "}
              {t("scheduleItems.hard")}
            </div>
            <div>
              <strong className="text-foreground font-semibold tabular-nums">{results.good}</strong>{" "}
              {t("scheduleItems.good")}
            </div>
            <div>
              <strong className="text-foreground font-semibold tabular-nums">{results.easy}</strong>{" "}
              {t("scheduleItems.easy")}
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            className="bg-foreground text-background px-5 py-3 rounded-[var(--radius)] text-[14px] font-medium cursor-pointer border-0 font-[inherit] transition-opacity hover:opacity-90"
            onClick={endSession}
          >
            {t("backToReview")}
          </button>
          <button
            className="bg-transparent text-foreground/80 px-5 py-3 rounded-[var(--radius)] text-[14px] border-0 cursor-pointer font-[inherit] transition-colors hover:bg-card hover:text-foreground"
            onClick={startSession}
          >
            {t("reviewMore")}
          </button>
        </div>
      </div>
    </div>
  );
}
