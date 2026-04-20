"use client";

import { useState, useEffect, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Shield, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";
import { getTemplate } from "@/lib/labs/templates/registry";
import type { LabData } from "@/lib/lab";

type Props = {
  labData: Extract<LabData, { type: "INTERACTIVE" }>;
  lessonId: string;
  courseId: string;
  courseSlug?: string;
  nextLessonHref: string | null;
  isCompleted: boolean;
};

export function InteractiveLabBlock({
  labData,
  lessonId,
  courseId,
  nextLessonHref,
  isCompleted,
}: Props) {
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
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  // RULE: LAB-05 — configSchema validation before render
  const template = getTemplate(labData.templateId);
  const configResult = template?.configSchema.safeParse(labData.config);
  const validConfig = configResult?.success ? configResult.data : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [TemplateComponent, setTemplateComponent] = useState<ComponentType<{ config: any }> | null>(
    null
  );

  useEffect(() => {
    if (!template || !validConfig) return;
    template
      .component()
      .then((mod) => {
        setTemplateComponent(() => mod.default);
      })
      .catch(() => {
        console.warn(
          `[LAB_TEMPLATE_MISMATCH] Failed to load template component: ${labData.templateId}`
        );
      });
  }, [labData.templateId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!template || !validConfig) {
    console.warn(
      `[LAB_TEMPLATE_MISMATCH] templateId=${labData.templateId} config invalid or template not found`
    );
  }

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

  // RULE: LAB-04 — INTERACTIVE completion via /complete
  async function markComplete() {
    if (completing || completed) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/labs/${labData.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, courseId }),
      });
      if (res.ok) {
        setCompleted(true);
        router.refresh();
        if (nextLessonHref) {
          setTimeout(() => router.push(nextLessonHref), 1800);
        }
      }
    } finally {
      setCompleting(false);
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
          <div className="lab-type-badge">{t("interactiveDescription")}</div>
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

      <section className="lab-section">
        {!template || !validConfig ? (
          <div className="lab-template-unavailable">
            <p>{t("templateUnavailable")}</p>
          </div>
        ) : TemplateComponent ? (
          <TemplateComponent config={validConfig} />
        ) : (
          <div className="lab-template-loading">…</div>
        )}
      </section>

      <section className="lab-section lab-complete-section">
        {completed ? (
          <div className="lab-success">
            <span className="lab-success-icon">✓</span>
            <span>{t("completedInteractive")}</span>
          </div>
        ) : (
          <button className="primary" onClick={() => void markComplete()} disabled={completing}>
            {completing ? "…" : t("markComplete")}
          </button>
        )}
      </section>
    </div>
  );
}
