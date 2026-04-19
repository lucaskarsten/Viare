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

type Results = { again: number; hard: number; good: number; easy: number };

type Props = {
  courses: Course[];
  totalDue: number;
  totalOverdue: number;
};

// Sample card pool used when course cards are sparse — mirrors the design reference
const SAMPLE_CARD_POOL: Card[] = [
  {
    course: "__sample__",
    q: "What does nmap -sS do?",
    a: "A stealth (SYN) scan — never completes the TCP handshake, so it's harder to log.",
    tag: "lab",
  },
  {
    course: "__sample__",
    q: "Vulnerabilidade vs. exploit?",
    a: "Vulnerabilidade é a falha. Exploit é a técnica que a abusa.",
    tag: "concept",
  },
  {
    course: "__sample__",
    q: "O que é BATNA?",
    a: "Melhor Alternativa a um Acordo Negociado — seu plano B. BATNA forte = posição forte.",
    tag: "concept",
  },
  {
    course: "__sample__",
    q: "What layer does ARP live at?",
    a: "Layer 2 (data link). It resolves IP → MAC on the local network.",
    tag: "concept",
  },
  {
    course: "__sample__",
    q: "Ancoragem, em uma frase.",
    a: "O primeiro número mencionado numa negociação molda o intervalo de todas as contra-propostas.",
    tag: "concept",
  },
  {
    course: "__sample__",
    q: "Metasploit: payload vs. exploit?",
    a: "Exploit delivers the payload. Payload is what runs after delivery (e.g. a reverse shell).",
    tag: "lab",
  },
];

export default function ReviewClient({ courses, totalDue, totalOverdue }: Props) {
  const [mode, setMode] = useState<"dashboard" | "session" | "done">("dashboard");
  const [sessionCards, setSessionCards] = useState<(Card & { courseMeta: Course })[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Results>({ again: 0, hard: 0, good: 0, easy: 0 });

  // Build a flat pool of cards across all courses, each tagged with course metadata
  const buildPool = useCallback(
    (filter: "all" | "overdue" | string): (Card & { courseMeta: Course })[] => {
      let pool: (Card & { courseMeta: Course })[] = [];

      const targetCourses =
        filter === "all" || filter === "overdue"
          ? courses
          : courses.filter((c) => c.id === filter);

      for (const course of targetCourses) {
        const cards = course.cards.length > 0 ? course.cards : SAMPLE_CARD_POOL;
        const limit = filter === "overdue" ? course.overdue : course.due;
        const slice = cards.slice(0, Math.max(limit, 1));
        pool = pool.concat(slice.map((card) => ({ ...card, courseMeta: course })));
      }

      if (pool.length === 0) {
        pool = SAMPLE_CARD_POOL.map((card) => ({
          ...card,
          courseMeta: courses[0] ?? {
            id: "__sample__",
            name: "Revisão",
            color: "#c97a4a",
            due: 0,
            total: 0,
            new: 0,
            learning: 0,
            overdue: 0,
            cards: [],
          },
        }));
      }

      // Shuffle
      return [...pool].sort(() => Math.random() - 0.5);
    },
    [courses]
  );

  const startSession = useCallback(
    (filter: "all" | "overdue" | string) => {
      const pool = buildPool(filter);
      setSessionCards(pool);
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
      if (idx + 1 >= sessionCards.length) {
        setMode("done");
      } else {
        setIdx((i) => i + 1);
        setRevealed(false);
      }
    },
    [idx, sessionCards.length]
  );

  const endSession = useCallback(() => setMode("dashboard"), []);

  // Keyboard shortcuts: Space to reveal, 1-4 to rate
  useEffect(() => {
    if (mode !== "session") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setRevealed((f) => !f);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        const map: Record<string, keyof Results> = {
          "1": "again",
          "2": "hard",
          "3": "good",
          "4": "easy",
        };
        rate(map[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, revealed, rate]);

  // ——— DASHBOARD: render only the action buttons (host page renders the rest) ———
  if (mode === "dashboard") {
    return (
      <>
        <button
          className="primary big"
          onClick={() => startSession("all")}
          disabled={totalDue === 0}
        >
          Revisar tudo · ~{Math.ceil(totalDue * 0.5)} min
        </button>
        <button className="ghost" onClick={() => startSession("overdue")}>
          Só os {totalOverdue} atrasados
        </button>
        <button className="ghost">Sessão customizada…</button>
      </>
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
      <div className="review-session">
        <header className="rs-top">
          <button className="rs-exit" onClick={endSession}>
            ← Encerrar
          </button>
          <div className="rs-progress">
            <div className="rs-progress-bar">
              <div style={{ width: `${progress}%` }} />
            </div>
            <span>
              {idx + 1} / {total}
            </span>
          </div>
          <div className="rs-results">
            <span className="rr again">{results.again}</span>
            <span className="rr hard">{results.hard}</span>
            <span className="rr good">{results.good}</span>
            <span className="rr easy">{results.easy}</span>
          </div>
        </header>

        <main className="rs-card-wrap">
          <div className="rs-card-meta">
            <span className="rs-course" style={{ color: courseMeta.color }}>
              <span
                className="rs-course-dot"
                style={{ background: courseMeta.color }}
              />
              {courseMeta.name}
            </span>
            <span className="rs-tag">{card.tag}</span>
          </div>

          <div className={`rs-card ${revealed ? "revealed" : ""}`}>
            <div className="rs-q-label">Pergunta</div>
            <div className="rs-q">{card.q}</div>
            {revealed && (
              <>
                <div className="rs-divider" />
                <div className="rs-a-label">Resposta</div>
                <div className="rs-a">{card.a}</div>
              </>
            )}
          </div>

          {!revealed && (
            <button className="rs-reveal" onClick={() => setRevealed(true)}>
              Mostrar resposta{" "}
              <span className="rs-reveal-kbd">Space</span>
            </button>
          )}

          {revealed && (
            <div className="rs-rate">
              <div className="rs-rate-label">Quão bem você lembrou?</div>
              <div className="rs-rate-buttons">
                <button className="rb rb-again" onClick={() => rate("again")}>
                  <span className="rb-label">De novo</span>
                  <span className="rb-next">&lt; 1 min</span>
                  <span className="rb-kbd">1</span>
                </button>
                <button className="rb rb-hard" onClick={() => rate("hard")}>
                  <span className="rb-label">Difícil</span>
                  <span className="rb-next">10 min</span>
                  <span className="rb-kbd">2</span>
                </button>
                <button className="rb rb-good" onClick={() => rate("good")}>
                  <span className="rb-label">Bom</span>
                  <span className="rb-next">2 dias</span>
                  <span className="rb-kbd">3</span>
                </button>
                <button className="rb rb-easy" onClick={() => rate("easy")}>
                  <span className="rb-label">Fácil</span>
                  <span className="rb-next">6 dias</span>
                  <span className="rb-kbd">4</span>
                </button>
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
    totalRated > 0
      ? Math.round(((results.good + results.easy) / totalRated) * 100)
      : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--paper)",
        zIndex: 50,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div className="page review-done" style={{ position: "static", inset: "unset" }}>
        <div className="rd-card">
          <div className="rd-eye">Sessão completa</div>
          <h1 className="h1">Muito bem.</h1>
          <p className="lede">
            Você revisou {totalRated} cartões com {retention}% de retenção.
          </p>
          <div className="rd-grid">
            <div className="rd-stat">
              <div className="rd-n">{results.again}</div>
              <div className="rd-l">De novo</div>
            </div>
            <div className="rd-stat">
              <div className="rd-n">{results.hard}</div>
              <div className="rd-l">Difícil</div>
            </div>
            <div className="rd-stat">
              <div className="rd-n">{results.good}</div>
              <div className="rd-l">Bom</div>
            </div>
            <div className="rd-stat">
              <div className="rd-n">{results.easy}</div>
              <div className="rd-l">Fácil</div>
            </div>
          </div>
          <div className="rd-next">
            <div className="rd-next-label">Agendado para depois</div>
            <div className="rd-next-grid">
              <div>
                <strong>{results.again}</strong> em alguns minutos
              </div>
              <div>
                <strong>{results.hard}</strong> em 10 minutos
              </div>
              <div>
                <strong>{results.good}</strong> em 2 dias
              </div>
              <div>
                <strong>{results.easy}</strong> em 6 dias
              </div>
            </div>
          </div>
          <div className="rd-actions">
            <button className="primary" onClick={endSession}>
              Voltar para revisão
            </button>
            <button className="ghost" onClick={() => startSession("all")}>
              Revisar mais
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
