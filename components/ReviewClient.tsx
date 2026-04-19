"use client";
import { useState, useEffect } from "react";

type CourseReview = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  progressPercent: number;
  dueCount: number;
  cards: { front: string; back: string }[];
};

type Props = { courses: CourseReview[] };

export default function ReviewClient({ courses }: Props) {
  const [mode, setMode] = useState<"dashboard" | "session" | "done">("dashboard");
  const [activeCourse, setActiveCourse] = useState<CourseReview | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<string[]>([]);

  const startSession = (course: CourseReview) => {
    setActiveCourse(course);
    setCardIndex(0);
    setFlipped(false);
    setSessionResults([]);
    setMode("session");
  };

  const rate = (rating: string) => {
    setSessionResults((r) => [...r, rating]);
    if (activeCourse && cardIndex < activeCourse.cards.length - 1) {
      setCardIndex((i) => i + 1);
      setFlipped(false);
    } else {
      setMode("done");
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (mode === "session") {
        if (e.code === "Space") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
        if (flipped) {
          if (e.key === "1") rate("again");
          if (e.key === "2") rate("hard");
          if (e.key === "3") rate("good");
          if (e.key === "4") rate("easy");
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, flipped, cardIndex, activeCourse]);

  if (mode === "dashboard") {
    return (
      <div className="px-16 py-12 max-w-[800px] mx-auto">
        <h1 className="text-3xl font-medium tracking-tight mb-2">Revisão</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Reforce o que você aprendeu com repetição espaçada.
        </p>
        {courses.length === 0 ? (
          <p className="text-muted-foreground">Nenhum curso em andamento.</p>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <div
                key={c.courseId}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[15px]">{c.courseTitle}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {c.progressPercent}% concluído
                  </div>
                </div>
                <span className="text-[12px] font-mono bg-accent/10 text-accent px-2 py-1 rounded">
                  {c.dueCount} para revisar
                </span>
                <button
                  onClick={() => startSession(c)}
                  className="text-[13px] font-medium px-3 py-1.5 bg-foreground text-background rounded"
                >
                  Revisar →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === "session" && activeCourse) {
    const card = activeCourse.cards[cardIndex];
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="text-[12px] text-muted-foreground font-mono mb-8">
          {cardIndex + 1} / {activeCourse.cards.length} · {activeCourse.courseTitle}
        </div>
        <div
          onClick={() => setFlipped((f) => !f)}
          className="w-full max-w-lg min-h-40 rounded-xl border bg-card p-8 flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-3">
              {flipped ? "Módulo" : "Aula"}
            </div>
            <div className="text-[20px] font-medium">{flipped ? card.back : card.front}</div>
            {!flipped && (
              <div className="text-[12px] text-muted-foreground mt-4">Espaço para revelar</div>
            )}
          </div>
        </div>
        {flipped && (
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => rate("again")}
              className="px-4 py-2 rounded border text-[13px] border-red-300 text-red-600 hover:bg-red-50"
            >
              De novo
            </button>
            <button
              onClick={() => rate("hard")}
              className="px-4 py-2 rounded border text-[13px] border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Difícil
            </button>
            <button
              onClick={() => rate("good")}
              className="px-4 py-2 rounded border text-[13px] border-accent/40 text-accent hover:bg-accent/5"
            >
              Bom
            </button>
            <button
              onClick={() => rate("easy")}
              className="px-4 py-2 rounded border text-[13px] border-green-300 text-green-600 hover:bg-green-50"
            >
              Fácil
            </button>
          </div>
        )}
        {!flipped && (
          <div className="text-[11px] text-muted-foreground mt-6 font-mono">
            Espaço · revelar &nbsp;|&nbsp; 1-4 · avaliar
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-4xl mb-4">✓</div>
      <h2 className="text-2xl font-medium mb-2">Sessão concluída</h2>
      <p className="text-muted-foreground mb-8">{sessionResults.length} cartões revisados</p>
      <button
        onClick={() => setMode("dashboard")}
        className="px-4 py-2 bg-foreground text-background rounded text-[13px] font-medium"
      >
        Voltar ao início
      </button>
    </div>
  );
}
