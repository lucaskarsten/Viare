"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
  prevLessonHref: string | null;
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

/** Parse lesson.content (markdown-ish) into structured sections for rendering. */
type ContentSection = { title: string; paragraphs: string[]; code?: string };

function parseContent(raw: string | null): {
  firstParagraph: string | null;
  firstChar: string;
  restParagraph: string;
  sections: ContentSection[];
  codeBlocks: string[];
} {
  if (!raw) {
    return { firstParagraph: null, firstChar: "", restParagraph: "", sections: [], codeBlocks: [] };
  }

  const lines = raw.split("\n");
  const sections: ContentSection[] = [];
  const codeBlocks: string[] = [];
  let currentSection: ContentSection | null = null;
  let inCode = false;
  let codeAcc: string[] = [];
  const plainParas: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeAcc = [];
      } else {
        inCode = false;
        const block = codeAcc.join("\n");
        codeBlocks.push(block);
        if (currentSection) {
          currentSection.code = block;
        }
      }
      continue;
    }
    if (inCode) {
      codeAcc.push(line);
      continue;
    }
    if (line.startsWith("## ") || line.startsWith("# ")) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.replace(/^#{1,2}\s+/, ""), paragraphs: [] };
      continue;
    }
    if (line.trim() === "") continue;
    const text = line.replace(/^#{3,}\s+/, "").trim();
    if (!text) continue;
    if (currentSection) {
      currentSection.paragraphs.push(text);
    } else {
      plainParas.push(text);
    }
  }
  if (currentSection) sections.push(currentSection);

  const firstParagraph = plainParas[0] ?? null;
  const firstChar = firstParagraph ? firstParagraph.charAt(0) : "";
  const restParagraph = firstParagraph ? firstParagraph.slice(1) : "";

  return { firstParagraph, firstChar, restParagraph, sections, codeBlocks };
}

export default function LessonClient({
  lesson,
  course,
  totalLessons,
  lessonIdx,
  prevLessonHref,
  nextLessonHref,
  quizQuestions,
  flashcards,
  summaryPoints,
}: LessonClientProps) {
  const t = useTranslations("lesson");
  const [showTutor, setShowTutor] = useState(false);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>(() => [
    { role: "tutor", text: t("tutorGreeting") },
  ]);

  // Focus mode state
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
  useEffect(() => { safeSet(STORAGE.mode, focusMode ? "1" : "0"); }, [focusMode]);
  useEffect(() => { safeSet(STORAGE.width, focusWidth); }, [focusWidth]);
  useEffect(() => { safeSet(STORAGE.font, focusFont); }, [focusFont]);
  useEffect(() => { safeSet(STORAGE.size, String(focusSize)); }, [focusSize]);
  useEffect(() => { safeSet(STORAGE.bg, focusBg); }, [focusBg]);

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

  function sendMsg(text: string) {
    const q = text.trim();
    if (!q) return;
    setTutorMessages((m) => [...m, { role: "user", text: q }]);
    setTutorInput("");
    window.setTimeout(() => {
      setTutorMessages((m) => [
        ...m,
        {
          role: "tutor",
          text: "Resposta curta: a IA tutora responderá com base no conteúdo desta aula. (Funcionalidade em desenvolvimento.)",
        },
      ]);
    }, 700);
  }

  const { firstChar, restParagraph, sections, codeBlocks } = parseContent(lesson.content);

  const pageClassName =
    `page lesson${focusMode ? " focus-mode" : ""}` +
    ` fw-${focusWidth} ff-${focusFont} fbg-${focusBg}`;

  const tutorSuggestions = [
    "Explique com um exemplo prático",
    "Quais os pontos mais importantes?",
    "Como isso se aplica no mundo real?",
  ];

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
            AULA {lesson.lessonNumber} DE {totalLessons}
          </div>
          <div className="lpm-bar">
            {Array.from({ length: totalLessons }).map((_, i) => (
              <div
                key={i}
                className={`lpm-tick${
                  i < lessonIdx ? " done" : i === lessonIdx ? " current" : ""
                }`}
              />
            ))}
          </div>
        </div>
        <div className="lesson-chrome-right">
          <MarkCompleteButton
            lessonId={lesson.id}
            courseId={lesson.courseId}
            isCompleted={lesson.completed}
            nextLessonHref={nextLessonHref}
          />
          <button
            className="ghost small"
            onClick={() => setShowTutor((o) => !o)}
          >
            {t("tutorTitle")}
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

      <div className={`lesson-body${showTutor ? " with-tutor" : ""}`}>
        <article className="reading" ref={articleRef}>
          <div className="reading-eyebrow">
            {lesson.moduleName} · {lesson.category}
          </div>
          <h1 className="lesson-title">{lesson.title}</h1>
          {lesson.description && (
            <p className="lesson-dek">{lesson.description}</p>
          )}

          {summaryPoints.length > 0 && (
            <div className="summary-box">
              <div className="summary-label">RESUMO</div>
              <ul>
                {summaryPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {firstChar && (
            <div className="drop">
              <span className="dropcap">{firstChar}</span>
              <p>{restParagraph}</p>
            </div>
          )}

          {sections.map((s, si) => (
            <div key={si}>
              <h3 className="h3 dividered">{s.title}</h3>
              {s.paragraphs.map((p, pi) => (
                <p key={pi}>{p}</p>
              ))}
              {s.code && <pre className="code">{s.code}</pre>}
            </div>
          ))}

          {codeBlocks.length > 0 && sections.length === 0 && (
            <pre className="code">{codeBlocks[0]}</pre>
          )}

          {!lesson.content && (
            <p style={{ color: "var(--ink-3)" }}>{t("contentUnavailable")}</p>
          )}

          {quizQuestions.length > 0 && <QuizBlock questions={quizQuestions} />}

          {flashcards.length > 0 && <FlashcardPlayer cards={flashcards} />}

          <div className="lesson-foot">
            {prevLessonHref ? (
              <Link href={prevLessonHref} className="ghost">
                {t("previous")}
              </Link>
            ) : (
              <Link href={`/courses/${course.slug}`} className="ghost">
                {t("backToCourse")}
              </Link>
            )}
            <Link href={nextLessonHref} className="primary">
              {t("next")}
            </Link>
          </div>
        </article>

        {showTutor && (
          <div className="tutor">
            <div className="tutor-head">
              <div>
                <div className="tutor-title">{t("tutorTitle")}</div>
                <div className="tutor-sub">ASSISTENTE DO CURSO</div>
              </div>
              <button className="icon" onClick={() => setShowTutor(false)}>
                ×
              </button>
            </div>
            <div className="tutor-msgs">
              {tutorMessages.map((m, i) => (
                <div
                  key={i}
                  className={`tutor-msg${m.role === "user" ? " user" : ""}`}
                >
                  {m.role === "tutor" && (
                    <div className="tutor-avatar">AI</div>
                  )}
                  <div className="tutor-bubble">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="tutor-suggest">
              {tutorSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggest-chip small"
                  onClick={() => sendMsg(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="tutor-input">
              <input
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                placeholder={t("tutorPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMsg(tutorInput);
                }}
              />
              <button onClick={() => sendMsg(tutorInput)}>→</button>
            </div>
          </div>
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
