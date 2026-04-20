"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Shield, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";
import type { LabData } from "@/lib/lab";

type Props = {
  labData: Extract<LabData, { type: "CTF" }>;
  lessonId: string;
  courseId: string;
  nextLessonHref: string;
  isCompleted: boolean;
};

export function CtfLabBlock({ labData, lessonId, courseId, nextLessonHref, isCompleted }: Props) {
  const t = useTranslations("lab");
  const router = useRouter();

  const [checkedObjectives, setCheckedObjectives] = useState<boolean[]>(
    labData.objectives.map(() => false)
  );
  const [revealedHints, setRevealedHints] = useState<(string | null)[]>(
    labData.hints.map((h) => h.text)
  );
  const [expandedHint, setExpandedHint] = useState<number | null>(null);
  const [xpRemaining, setXpRemaining] = useState<number | null>(null);
  const [revealingIdx, setRevealingIdx] = useState<number | null>(null);
  const [flag, setFlag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(
    isCompleted ? "correct" : null
  );
  const [attempts, setAttempts] = useState(0);

  async function revealHint(idx: number) {
    if (revealedHints[idx] !== null || revealingIdx !== null) return;
    setRevealingIdx(idx);
    try {
      const res = await fetch(`/api/labs/${labData.id}/hints/${idx}`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { hint: string; xpRemaining: number };
        setRevealedHints((prev) => {
          const next = [...prev];
          next[idx] = data.hint;
          return next;
        });
        setXpRemaining(data.xpRemaining);
        setExpandedHint(idx);
      }
    } finally {
      setRevealingIdx(null);
    }
  }

  function toggleHint(idx: number) {
    if (revealedHints[idx] === null) {
      void revealHint(idx);
    } else {
      setExpandedHint(expandedHint === idx ? null : idx);
    }
  }

  function toggleObjective(idx: number) {
    setCheckedObjectives((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  }

  async function submitFlag() {
    const trimmed = flag.trim();
    if (!trimmed || submitting || result === "correct") return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/labs/${labData.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: trimmed, lessonId, courseId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { correct: boolean; attempts: number };
        setAttempts(data.attempts);
        if (data.correct) {
          setResult("correct");
          router.refresh();
          setTimeout(() => router.push(nextLessonHref), 1800);
        } else {
          setResult("incorrect");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const difficultyLabel: Record<string, string> = {
    EASY: t("difficultyEasy"),
    MEDIUM: t("difficultyMedium"),
    HARD: t("difficultyHard"),
  };

  const doneCount = checkedObjectives.filter(Boolean).length;

  return (
    <div className="lab-block">
      <div className="lab-header">
        <div className="lab-header-left">
          <div className={`lab-difficulty diff-${labData.difficulty.toLowerCase()}`}>
            <Shield size={12} />
            <span>{difficultyLabel[labData.difficulty]}</span>
          </div>
        </div>
        {xpRemaining !== null && <div className="lab-xp-badge">{xpRemaining} XP</div>}
      </div>

      <section className="lab-section">
        <div className="lab-label">{t("scenario")}</div>
        <div className="lab-scenario md-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{labData.scenario}</ReactMarkdown>
        </div>
      </section>

      <section className="lab-section">
        <div className="lab-label-row">
          <span className="lab-label">{t("objectives")}</span>
          <span className="lab-obj-progress">
            {doneCount}/{labData.objectives.length}
          </span>
        </div>
        <ul className="lab-objectives">
          {labData.objectives.map((obj, i) => (
            <li
              key={i}
              className={`lab-obj-item${checkedObjectives[i] ? " checked" : ""}`}
              onClick={() => toggleObjective(i)}
            >
              <span className="lab-obj-icon">
                {checkedObjectives[i] ? <CheckSquare size={16} /> : <Square size={16} />}
              </span>
              <span className="lab-obj-text">{obj}</span>
            </li>
          ))}
        </ul>
      </section>

      {labData.hints.length > 0 && (
        <section className="lab-section">
          <div className="lab-label">{t("hints")}</div>
          <div className="lab-hints">
            {labData.hints.map((h, idx) => {
              const revealed = revealedHints[idx] !== null;
              const expanded = expandedHint === idx;
              return (
                <div key={idx} className={`lab-hint${revealed ? " revealed" : ""}`}>
                  <button
                    className="lab-hint-trigger"
                    onClick={() => toggleHint(idx)}
                    disabled={revealingIdx === idx}
                  >
                    <span className="lab-hint-title">
                      {revealingIdx === idx
                        ? "…"
                        : revealed
                          ? `${t("hintN", { n: idx + 1 })}`
                          : `${t("revealHint")} · ${h.cost} XP`}
                    </span>
                    {revealed && (
                      <span className="lab-hint-chevron">
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </button>
                  {revealed && (
                    <div className={`lab-hint-body${expanded ? " open" : ""}`}>
                      <div className="lab-hint-inner">
                        <p>{revealedHints[idx]}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="lab-section lab-flag-section">
        <div className="lab-label">{t("submitFlag")}</div>

        {result === "correct" ? (
          <div className="lab-success">
            <span className="lab-success-icon">✓</span>
            <span>{t("correct")}</span>
          </div>
        ) : (
          <>
            <div className="lab-flag-row">
              <input
                className="lab-flag-input"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder={t("flagPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitFlag();
                }}
                disabled={submitting}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                className="primary"
                onClick={() => void submitFlag()}
                disabled={submitting || !flag.trim()}
              >
                {submitting ? "…" : "→"}
              </button>
            </div>
            {result === "incorrect" && (
              <p className="lab-incorrect">
                ✗ {t("incorrect")}
                {attempts > 0 && ` · ${t("attemptsUsed", { count: attempts })}`}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
