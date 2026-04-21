"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { remarkBlocks } from "@/lib/remark-blocks";
import CalloutBlock, { type CalloutType } from "@/components/blocks/CalloutBlock";
import QuizBlock, { type QuizBlockQuestion } from "@/components/QuizBlock";
import FlashcardPlayer, { type FlashCard } from "@/components/FlashcardPlayer";
import MarkCompleteButton from "@/app/(platform)/courses/[slug]/lessons/[lessonId]/MarkCompleteButton";
import LabBlock from "@/components/LabBlock";
import DemoBlock from "@/components/DemoBlock";
import SandpackBlock from "@/components/blocks/SandpackBlock";
import PythonSandboxBlock from "@/components/blocks/PythonSandboxBlock";
import PracticeBlock from "@/components/blocks/PracticeBlock";
import CaseStudyBlock from "@/components/blocks/CaseStudyBlock";
import type { LabData } from "@/lib/lab";
import EnrichModal from "@/components/EnrichModal";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

function renderInlineMd(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

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
    moduleId: string;
    type: string; // LessonType — kept as string to avoid Prisma client import in this file
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
  lab?: LabData | null;
  // RULE: SUB-03 — client-side isPro flag reflects server check
  isPro: boolean;
  courseNav: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      completed: boolean;
    }>;
  }>;
};

const STORAGE = {
  mode: "viare:focus",
  width: "viare:focusWidth",
  font: "viare:focusFont",
  size: "viare:focusSize",
  bg: "viare:focusBg",
  nav: "viare:navOpen",
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

const ALERT_MARKER_RE = /^\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/i;

// Strip the leading `[!TYPE]` marker from a blockquote's first paragraph
// so it doesn't render inside the callout body.
function stripFirstAlertMarker(children: ReactNode): ReactNode {
  const arr = Children.toArray(children);
  const idx = arr.findIndex((c) => isValidElement(c) && c.type === "p");
  if (idx === -1) return arr;
  const para = arr[idx] as React.ReactElement<{ children?: ReactNode }>;
  const inner = Children.toArray(para.props.children);
  const first = inner[0];
  if (typeof first === "string") {
    const stripped = first.replace(ALERT_MARKER_RE, "");
    const newInner = stripped ? [stripped, ...inner.slice(1)] : inner.slice(1);
    if (newInner.length === 0) {
      return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
    }
    const cloned = cloneElement(para, undefined, newInner);
    return [...arr.slice(0, idx), cloned, ...arr.slice(idx + 1)];
  }
  return arr;
}

const lessonMarkdownComponents: Components = {
  blockquote({ children, node }) {
    // Detect GFM alert syntax: > [!TYPE] — remark-gfm v4 sets dataGithubAlert property
    const props = (node as { properties?: Record<string, unknown> })?.properties ?? {};
    const ghAlert = (props.dataGithubAlert ?? props["data-github-alert"]) as string | undefined;
    if (ghAlert) {
      return <CalloutBlock type={ghAlert.toLowerCase() as CalloutType}>{children}</CalloutBlock>;
    }
    // Fallback: parse first-child text for [!TYPE] marker (with or without trailing content)
    const firstPara = (
      node as {
        children?: Array<{
          type: string;
          tagName?: string;
          children?: Array<{ type: string; value?: string }>;
        }>;
      }
    )?.children?.[0];
    if (firstPara?.type === "element" && firstPara.tagName === "p") {
      const firstText = firstPara.children?.[0];
      if (firstText?.type === "text") {
        const raw = firstText.value ?? "";
        const m = raw.match(ALERT_MARKER_RE);
        if (m) {
          const type = m[1].toLowerCase() as CalloutType;
          return <CalloutBlock type={type}>{stripFirstAlertMarker(children)}</CalloutBlock>;
        }
      }
      // Detect answer blockquotes: first child is <strong> (e.g. **Resposta:** / **Answer:**)
      const firstChild = firstPara.children?.[0] as { type: string; tagName?: string } | undefined;
      if (firstChild?.type === "element" && firstChild.tagName === "strong") {
        return (
          <details className="answer-spoiler">
            <summary>Ver resposta</summary>
            <div className="answer-content">{children}</div>
          </details>
        );
      }
    }
    return <blockquote>{children}</blockquote>;
  },
  // Catch bare `[!TYPE] ...` paragraphs (model omitted the `>` blockquote prefix entirely)
  p({ children }) {
    const arr = Children.toArray(children);
    const first = arr[0];
    if (typeof first === "string") {
      const m = first.match(ALERT_MARKER_RE);
      if (m) {
        const type = m[1].toLowerCase() as CalloutType;
        const rest = first.replace(ALERT_MARKER_RE, "");
        const remainder = rest ? [rest, ...arr.slice(1)] : arr.slice(1);
        return (
          <CalloutBlock type={type}>
            <p>{remainder}</p>
          </CalloutBlock>
        );
      }
    }
    return <p>{children}</p>;
  },
  div({ children, node: _node, ...props }) {
    const block = (props as Record<string, unknown>)["data-block"] as string | undefined;
    const dtype = (props as Record<string, unknown>)["data-type"] as string | undefined;
    const did = (props as Record<string, unknown>)["data-id"] as string | undefined;
    if (block === "callout")
      return <CalloutBlock type={(dtype ?? "note") as CalloutType}>{children}</CalloutBlock>;
    if (block === "cards") return <div className="block-cards">{children}</div>;
    if (block === "steps") return <div className="block-steps">{children}</div>;
    if (block === "demo") return <DemoBlock id={did ?? ""} />;
    if (block === "sandbox") {
      const tmpl = (props as Record<string, unknown>)["data-template"] as string | undefined;
      if (tmpl === "python") return <PythonSandboxBlock />;
      return <SandpackBlock template={tmpl} />;
    }
    return <div {...props}>{children}</div>;
  },
};

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
  lab = null,
  isPro,
  courseNav,
}: LessonClientProps) {
  const t = useTranslations("lesson");
  const tEnrich = useTranslations("enrich");
  const tProgress = useTranslations("progress");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const [showTutor, setShowTutor] = useState(false);
  const [showEnrich, setShowEnrich] = useState(false);
  // Hydration guard — server/client localStorage mismatch would otherwise flash
  const [hydrated, setHydrated] = useState(false);
  const [showNav, setShowNav] = useState<boolean>(false);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>(() => [
    { role: "tutor", text: t("tutorGreeting") },
  ]);

  // Focus mode state — defaults match server render; real values read in hydration effect below
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [focusWidth, setFocusWidth] = useState<FocusWidth>("comfortable");
  const [focusFont, setFocusFont] = useState<FocusFont>("serif");
  const [focusSize, setFocusSize] = useState<number>(18);
  const [focusBg, setFocusBg] = useState<FocusBg>("paper");
  const [focusSettingsOpen, setFocusSettingsOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const articleRef = useRef<HTMLElement | null>(null);

  // Read persisted values on mount (client-only) to avoid hydration mismatch.
  // Effect-based setState is required here: SSR cannot access localStorage, so
  // initial render must use defaults and reconcile after mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const navStored = safeGet(STORAGE.nav);
    if (navStored !== null) setShowNav(navStored === "1");
    const modeStored = safeGet(STORAGE.mode);
    if (modeStored !== null) setFocusMode(modeStored === "1");
    const w = safeGet(STORAGE.width);
    if (w === "narrow" || w === "wide" || w === "comfortable") setFocusWidth(w);
    const f = safeGet(STORAGE.font);
    if (f === "sans" || f === "mono" || f === "serif") setFocusFont(f);
    const s = safeGet(STORAGE.size);
    const n = s ? parseInt(s, 10) : NaN;
    if (Number.isFinite(n)) setFocusSize(Math.max(14, Math.min(28, n)));
    const bg = safeGet(STORAGE.bg);
    if (bg === "cream" || bg === "sepia" || bg === "dim" || bg === "dark" || bg === "paper")
      setFocusBg(bg);
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist changes — skip before hydration to avoid overwriting localStorage with defaults
  useEffect(() => {
    if (!hydrated) return;
    safeSet(STORAGE.mode, focusMode ? "1" : "0");
  }, [hydrated, focusMode]);
  useEffect(() => {
    if (!hydrated) return;
    safeSet(STORAGE.width, focusWidth);
  }, [hydrated, focusWidth]);
  useEffect(() => {
    if (!hydrated) return;
    safeSet(STORAGE.font, focusFont);
  }, [hydrated, focusFont]);
  useEffect(() => {
    if (!hydrated) return;
    safeSet(STORAGE.size, String(focusSize));
  }, [hydrated, focusSize]);
  useEffect(() => {
    if (!hydrated) return;
    safeSet(STORAGE.bg, focusBg);
  }, [hydrated, focusBg]);
  useEffect(() => {
    if (!hydrated) return;
    safeSet(STORAGE.nav, showNav ? "1" : "0");
  }, [hydrated, showNav]);

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

  const pageClassName =
    `page lesson${focusMode ? " focus-mode" : ""}` +
    ` fw-${focusWidth} ff-${focusFont} fbg-${focusBg}`;

  const tutorSuggestions = [
    "Explique com um exemplo prático",
    "Quais os pontos mais importantes?",
    "Como isso se aplica no mundo real?",
  ];

  const courseNavPanel = (
    <div className="course-nav">
      <div className="course-nav-head">
        <div>
          <div className="course-nav-title">{t("courseIndex")}</div>
          <div className="course-nav-sub">{course.title}</div>
          <div className="course-nav-progress">
            {tProgress("lessonCount", {
              completed: courseNav.flatMap((m) => m.lessons).filter((l) => l.completed).length,
              total: courseNav.flatMap((m) => m.lessons).length,
            })}
          </div>
        </div>
        <button className="icon" onClick={() => setShowNav(false)}>
          ×
        </button>
      </div>
      <div className="course-nav-body">
        {courseNav.map((mod) => (
          <div key={mod.id} className="course-nav-module">
            <div className="cnm-title">
              <span className="cnm-num">{String(mod.order + 1).padStart(2, "0")}</span>
              {mod.title}
            </div>
            {mod.lessons.map((l) => (
              <Link
                key={l.id}
                href={`/courses/${course.slug}/lessons/${l.id}`}
                className={`cnl${l.id === lesson.id ? " cnl-current" : ""}${l.completed ? " cnl-done" : ""}`}
              >
                <span className="cnl-dot">
                  {l.completed ? "✓" : l.id === lesson.id ? "▸" : "○"}
                </span>
                <span className="cnl-name">{l.title}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const tutorPanel = (
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
          <div key={i} className={`tutor-msg${m.role === "user" ? " user" : ""}`}>
            {m.role === "tutor" && <div className="tutor-avatar">AI</div>}
            <div className="tutor-bubble">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="tutor-suggest">
        {tutorSuggestions.map((s, i) => (
          <button key={i} className="suggest-chip small" onClick={() => sendMsg(s)}>
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
  );

  return (
    <div
      className={pageClassName}
      style={{ "--focus-size": `${focusSize}px` } as React.CSSProperties}
      data-focus={focusMode ? "on" : "off"}
    >
      {focusMode && (
        <div className="focus-progress" style={{ transform: `scaleX(${readProgress})` }} />
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
                className={`lpm-tick${i < lessonIdx ? " done" : i === lessonIdx ? " current" : ""}`}
              />
            ))}
          </div>
        </div>
        <div className="lesson-chrome-right">
          {!lab && (
            <MarkCompleteButton
              lessonId={lesson.id}
              courseId={lesson.courseId}
              isCompleted={lesson.completed}
              nextLessonHref={nextLessonHref}
            />
          )}
          {isPro ? (
            <button
              className="enrich-btn"
              onClick={() => setShowEnrich(true)}
              title={tEnrich("button")}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{tEnrich("button")}</span>
            </button>
          ) : (
            <a
              href="/pricing"
              className="enrich-btn enrich-btn-locked"
              title={tEnrich("upgradeCta")}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
              </svg>
              <span>{tEnrich("upgradeCta")}</span>
            </a>
          )}
          <button
            className="ghost small"
            onClick={() => {
              setShowNav((o) => !o);
              setShowTutor(false);
            }}
          >
            {t("courseIndex")}
          </button>
          <button
            className="ghost small"
            onClick={() => {
              setShowTutor((o) => !o);
              setShowNav(false);
            }}
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

      <div
        className={`lesson-body${showTutor && isLg ? " with-tutor" : ""}${showNav && isLg ? " with-nav" : ""}`}
      >
        <article className="reading" ref={articleRef}>
          <div className="reading-eyebrow">
            {lesson.moduleName} · {lesson.category}
          </div>
          <h1 className="lesson-title">{lesson.title}</h1>
          {lesson.description && <p className="lesson-dek">{lesson.description}</p>}

          {lab ? (
            <LabBlock
              labData={lab}
              lessonId={lesson.id}
              courseId={lesson.courseId}
              nextLessonHref={nextLessonHref}
              isCompleted={lesson.completed}
            />
          ) : (
            <>
              {summaryPoints.length > 0 && (
                <div className="summary-box">
                  <div className="summary-label">RESUMO</div>
                  <ul>
                    {summaryPoints.map((p, i) => (
                      <li key={i}>{renderInlineMd(p)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.content ? (
                lesson.type === "PRACTICE" ? (
                  <PracticeBlock
                    lessonId={lesson.id}
                    courseId={lesson.courseId}
                    isCompleted={lesson.completed}
                    nextLessonHref={nextLessonHref}
                  >
                    <div className="md-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkDirective, remarkBlocks]}
                        rehypePlugins={[rehypeRaw]}
                        components={lessonMarkdownComponents}
                      >
                        {lesson.content}
                      </ReactMarkdown>
                    </div>
                  </PracticeBlock>
                ) : lesson.type === "CASE_STUDY" ? (
                  <CaseStudyBlock
                    lessonId={lesson.id}
                    courseId={lesson.courseId}
                    isCompleted={lesson.completed}
                    nextLessonHref={nextLessonHref}
                  >
                    <div className="md-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkDirective, remarkBlocks]}
                        rehypePlugins={[rehypeRaw]}
                        components={lessonMarkdownComponents}
                      >
                        {lesson.content}
                      </ReactMarkdown>
                    </div>
                  </CaseStudyBlock>
                ) : (
                  <div className="md-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkDirective, remarkBlocks]}
                      components={lessonMarkdownComponents}
                    >
                      {lesson.content}
                    </ReactMarkdown>
                  </div>
                )
              ) : (
                <p style={{ color: "var(--ink-3)" }}>{t("contentUnavailable")}</p>
              )}

              {lesson.type !== "PRACTICE" &&
                lesson.type !== "CASE_STUDY" &&
                quizQuestions.length > 0 && <QuizBlock questions={quizQuestions} />}

              {lesson.type !== "PRACTICE" &&
                lesson.type !== "CASE_STUDY" &&
                flashcards.length > 0 && <FlashcardPlayer cards={flashcards} />}
            </>
          )}

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

        {isLg && showNav && courseNavPanel}
        {isLg && showTutor && tutorPanel}
      </div>

      <Sheet
        open={!isLg && showNav}
        onOpenChange={(o) => {
          if (!o) setShowNav(false);
        }}
      >
        <SheetContent side="right" className="p-0 w-full sm:max-w-md bg-card overflow-y-auto">
          <SheetTitle className="sr-only">{t("courseIndex")}</SheetTitle>
          {courseNavPanel}
        </SheetContent>
      </Sheet>

      <Sheet
        open={!isLg && showTutor}
        onOpenChange={(o) => {
          if (!o) setShowTutor(false);
        }}
      >
        <SheetContent side="right" className="p-0 w-full sm:max-w-md bg-card flex flex-col">
          <SheetTitle className="sr-only">{t("tutorTitle")}</SheetTitle>
          {tutorPanel}
        </SheetContent>
      </Sheet>

      <EnrichModal
        courseSlug={course.slug}
        moduleId={lesson.moduleId}
        referenceLessonId={lesson.id}
        open={showEnrich}
        onClose={() => setShowEnrich(false)}
        onSuccess={() => window.location.reload()}
      />
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
        <button className="fc-btn" onClick={() => setOpen(!open)} title="Configurações de leitura">
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
              <button className="fs-step" onClick={() => setSize(Math.max(14, size - 1))}>
                −
              </button>
              <span className="fs-size-val">{size}px</span>
              <button className="fs-step" onClick={() => setSize(Math.min(28, size + 1))}>
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
          <div className="fs-hint">Pressione F em qualquer lugar para alternar o modo foco.</div>
        </div>
      )}
    </>
  );
}
