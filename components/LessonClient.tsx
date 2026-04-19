"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import QuizBlock, { type QuizBlockQuestion } from "@/components/QuizBlock";
import FlashcardPlayer, { type FlashCard } from "@/components/FlashcardPlayer";
import MarkCompleteButton from "@/app/(platform)/courses/[slug]/lessons/[lessonId]/MarkCompleteButton";

type TutorMessage = { role: "user" | "tutor"; text: string };

type FocusWidth = "narrow" | "comfortable" | "wide";
type FocusFont = "serif" | "sans" | "mono";
type FocusBg = "paper" | "cream" | "sepia" | "dim" | "dark";

export type LessonClientProps = {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    completed: boolean;
    estimatedMinutes: number;
    category: string;
    moduleName: string;
    moduleOrder: number;
    lessonNumber: number;
    courseId: string;
  };
  course: {
    slug: string;
    title: string;
  };
  totalLessons: number;
  lessonIdx: number;
  nextLessonHref: string;
  quizQuestions: QuizBlockQuestion[];
  flashcards: FlashCard[];
  summaryPoints: string[];
};

const STORAGE = {
  mode: "viare:focus",
  width: "viare:focusWidth",
  font: "viare:focusFont",
  size: "viare:focusSize",
  bg: "viare:focusBg",
} as const;

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export default function LessonClient({
  lesson,
  course,
  totalLessons,
  lessonIdx,
  nextLessonHref,
  quizQuestions,
  flashcards,
  summaryPoints,
}: LessonClientProps) {
  const [summary, setSummary] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorQuery, setTutorQuery] = useState("");
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([
    {
      role: "tutor",
      text:
        "Travou? Pergunte qualquer coisa sobre a aula. Respondo com base no material e sinalizo o que fugir dele.",
    },
  ]);

  // Focus mode state: use lazy initializers so we read localStorage during
  // the initial render (client components can safely touch `window` in the
  // initializer function because it only runs on the client).
  const [focusMode, setFocusMode] = useState<boolean>(
    () => safeGet(STORAGE.mode) === "1",
  );
  const [focusWidth, setFocusWidth] = useState<FocusWidth>(() => {
    const w = safeGet(STORAGE.width);
    return w === "narrow" || w === "wide" ? w : "comfortable";
  });
  const [focusFont, setFocusFont] = useState<FocusFont>(() => {
    const f = safeGet(STORAGE.font);
    return f === "sans" || f === "mono" ? f : "serif";
  });
  const [focusSize, setFocusSize] = useState<number>(() => {
    const s = safeGet(STORAGE.size);
    const n = s ? parseInt(s, 10) : NaN;
    return Number.isFinite(n) ? Math.max(14, Math.min(28, n)) : 18;
  });
  const [focusBg, setFocusBg] = useState<FocusBg>(() => {
    const bg = safeGet(STORAGE.bg);
    return bg === "cream" || bg === "sepia" || bg === "dim" || bg === "dark"
      ? bg
      : "paper";
  });
  const [focusSettingsOpen, setFocusSettingsOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const articleRef = useRef<HTMLElement | null>(null);

  // Persist changes
  useEffect(() => {
    safeSet(STORAGE.mode, focusMode ? "1" : "0");
  }, [focusMode]);
  useEffect(() => {
    safeSet(STORAGE.width, focusWidth);
  }, [focusWidth]);
  useEffect(() => {
    safeSet(STORAGE.font, focusFont);
  }, [focusFont]);
  useEffect(() => {
    safeSet(STORAGE.size, String(focusSize));
  }, [focusSize]);
  useEffect(() => {
    safeSet(STORAGE.bg, focusBg);
  }, [focusBg]);

  // Tag body so shell can react
  useEffect(() => {
    document.body.dataset.focus = focusMode ? "on" : "off";
    document.body.dataset.focusBg = focusBg;
    return () => {
      delete document.body.dataset.focus;
      delete document.body.dataset.focusBg;
    };
  }, [focusMode, focusBg]);

  // Keyboard: F to toggle, Esc to exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setFocusMode((f) => !f);
      } else if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusMode]);

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const total = el.scrollHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, window.scrollY / Math.max(1, total)));
      setReadProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sendTutor = (e: React.FormEvent) => {
    e.preventDefault();
    const q = tutorQuery.trim();
    if (!q) return;
    setTutorMessages((m) => [...m, { role: "user", text: q }]);
    setTutorQuery("");
    window.setTimeout(() => {
      setTutorMessages((m) => [
        ...m,
        {
          role: "tutor",
          text:
            "Resposta curta: a IA tutora responderá com base no conteúdo desta aula. (Funcionalidade em desenvolvimento.)",
        },
      ]);
    }, 700);
  };

  const pageClassName =
    `page lesson${focusMode ? " focus-mode" : ""}` +
    ` fw-${focusWidth} ff-${focusFont} fbg-${focusBg}`;

  return (
    <div
      className={pageClassName}
      style={{ "--focus-size": `${focusSize}px` } as React.CSSProperties}
      data-focus={focusMode ? "on" : "off"}
    >
      {focusMode && (
        <div
          className="focus-progress"
          style={{ transform: `scaleX(${readProgress})` }}
        />
      )}

      <header className="lesson-chrome">
        <Link href={`/courses/${course.slug}`} className="lesson-back">
          ← {course.title}
        </Link>
        <div className="lesson-progress-mini">
          <div className="lpm-label">
            Aula {lesson.lessonNumber} de {totalLessons} · Módulo{" "}
            {String(lesson.moduleOrder).padStart(2, "0")}
          </div>
          <div className="lpm-bar">
            {Array.from({ length: totalLessons }).map((_, i) => (
              <span
                key={i}
                className={`lpm-tick${
                  i < lessonIdx ? " done" : i === lessonIdx ? " current" : ""
                }`}
              />
            ))}
          </div>
        </div>
        <div className="lesson-chrome-right">
          <button
            className="ghost small"
            onClick={() => setSummary((s) => !s)}
          >
            {summary ? "Ocultar resumo" : "Resumir"}
          </button>
          <button
            className="ghost small"
            onClick={() => setTutorOpen((o) => !o)}
          >
            {tutorOpen ? "Fechar tutor" : "Perguntar"}
          </button>
          <button
            className="ghost small focus-toggle"
            onClick={() => setFocusMode(true)}
            title="Modo foco · F"
          >
            <span className="focus-icon">◐</span> Foco
          </button>
        </div>
      </header>

      {focusMode && (
        <FocusControls
          onExit={() => setFocusMode(false)}
          width={focusWidth}
          setWidth={setFocusWidth}
          font={focusFont}
          setFont={setFocusFont}
          size={focusSize}
          setSize={setFocusSize}
          bg={focusBg}
          setBg={setFocusBg}
          open={focusSettingsOpen}
          setOpen={setFocusSettingsOpen}
        />
      )}

      <div className={`lesson-body${tutorOpen ? " with-tutor" : ""}`}>
        <article className="reading" ref={articleRef}>
          <div className="reading-eyebrow">
            {lesson.moduleName} · {lesson.category} · {lesson.estimatedMinutes} min
          </div>
          <h1 className="lesson-title">{lesson.title}</h1>
          {lesson.description && (
            <p className="lesson-dek">{lesson.description}</p>
          )}

          {summary && summaryPoints.length > 0 && (
            <div className="summary-box">
              <div className="summary-label">Resumo IA · 30 segundos</div>
              <ul>
                {summaryPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="lesson-prose">
            {lesson.content ? (
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            ) : (
              <p style={{ color: "var(--ink-3)" }}>Conteúdo ainda não disponível.</p>
            )}
          </div>

          {quizQuestions.length > 0 && <QuizBlock questions={quizQuestions} />}

          {flashcards.length > 0 && <FlashcardPlayer cards={flashcards} />}

          <div className="lesson-foot">
            <Link href={`/courses/${course.slug}`} className="ghost big">
              ← Voltar à estrutura
            </Link>
            <MarkCompleteButton
              lessonId={lesson.id}
              courseId={lesson.courseId}
              isCompleted={lesson.completed}
              nextLessonHref={nextLessonHref}
            />
          </div>
        </article>

        {tutorOpen && (
          <aside className="tutor">
            <div className="tutor-head">
              <div>
                <div className="tutor-title">Tutor</div>
                <div className="tutor-sub">baseado nesta aula</div>
              </div>
              <button
                className="icon small"
                onClick={() => setTutorOpen(false)}
                title="Fechar"
              >
                ×
              </button>
            </div>
            <div className="tutor-msgs">
              {tutorMessages.map((m, i) => (
                <div key={i} className={`tutor-msg ${m.role}`}>
                  {m.role === "tutor" && <div className="tutor-avatar">L</div>}
                  <div className="tutor-bubble">{m.text}</div>
                </div>
              ))}
            </div>
            <form className="tutor-input" onSubmit={sendTutor}>
              <input
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                placeholder="Pergunte sobre esta aula…"
              />
              <button type="submit">→</button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}

// ---------- Focus controls ----------

type FocusControlsProps = {
  onExit: () => void;
  width: FocusWidth;
  setWidth: (w: FocusWidth) => void;
  font: FocusFont;
  setFont: (f: FocusFont) => void;
  size: number;
  setSize: (n: number) => void;
  bg: FocusBg;
  setBg: (b: FocusBg) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
};

function FocusControls({
  onExit,
  width,
  setWidth,
  font,
  setFont,
  size,
  setSize,
  bg,
  setBg,
  open,
  setOpen,
}: FocusControlsProps) {
  const widthOptions: { v: FocusWidth; l: string }[] = [
    { v: "narrow", l: "Estreita" },
    { v: "comfortable", l: "Confortável" },
    { v: "wide", l: "Larga" },
  ];
  const fontOptions: { v: FocusFont; l: string }[] = [
    { v: "serif", l: "Serif" },
    { v: "sans", l: "Sans" },
    { v: "mono", l: "Mono" },
  ];
  const bgOptions: { v: FocusBg; l: string; c: string }[] = [
    { v: "paper", l: "Papel", c: "var(--paper)" },
    { v: "cream", l: "Creme", c: "#f5efe3" },
    { v: "sepia", l: "Sépia", c: "#ebe0cc" },
    { v: "dim", l: "Penumbra", c: "#2a2826" },
    { v: "dark", l: "Escuro", c: "#161513" },
  ];

  return (
    <>
      <div className="focus-chrome">
        <button className="fc-btn fc-exit" onClick={onExit} title="Sair do foco · Esc">
          <span>×</span> Sair do foco <span className="fc-kbd">Esc</span>
        </button>
        <button
          className="fc-btn"
          onClick={() => setOpen(!open)}
          title="Configurações de leitura"
        >
          <span className="fc-icon">Aa</span>
        </button>
      </div>
      {open && (
        <div className="focus-settings" onClick={(e) => e.stopPropagation()}>
          <div className="fs-group">
            <div className="fs-label">Largura</div>
            <div className="fs-row">
              {widthOptions.map((o) => (
                <button
                  key={o.v}
                  className={`fs-chip${width === o.v ? " on" : ""}`}
                  onClick={() => setWidth(o.v)}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div className="fs-group">
            <div className="fs-label">Fonte</div>
            <div className="fs-row">
              {fontOptions.map((o) => (
                <button
                  key={o.v}
                  className={`fs-chip ff-${o.v}${font === o.v ? " on" : ""}`}
                  onClick={() => setFont(o.v)}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div className="fs-group">
            <div className="fs-label">Tamanho</div>
            <div className="fs-row">
              <button
                className="fs-step"
                onClick={() => setSize(Math.max(14, size - 1))}
              >
                −
              </button>
              <span className="fs-size-val">{size}px</span>
              <button
                className="fs-step"
                onClick={() => setSize(Math.min(28, size + 1))}
              >
                +
              </button>
            </div>
          </div>
          <div className="fs-group">
            <div className="fs-label">Fundo</div>
            <div className="fs-row fs-bg-row">
              {bgOptions.map((o) => (
                <button
                  key={o.v}
                  className={`fs-swatch${bg === o.v ? " on" : ""}`}
                  onClick={() => setBg(o.v)}
                  title={o.l}
                >
                  <span style={{ background: o.c }} />
                </button>
              ))}
            </div>
          </div>
          <div className="fs-hint">
            Pressione F em qualquer lugar para alternar o modo foco.
          </div>
        </div>
      )}
    </>
  );
}
