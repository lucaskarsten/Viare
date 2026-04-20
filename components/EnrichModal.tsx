"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type LessonType = "THEORY" | "QUIZ" | "CASE_STUDY" | "PRACTICE" | "REFLECTION";

type Props = {
  courseSlug: string;
  moduleId: string;
  referenceLessonId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type Status = "idle" | "loading" | "success" | "error" | "limit" | "pro_required";

const LESSON_TYPES: LessonType[] = ["THEORY", "QUIZ", "CASE_STUDY", "PRACTICE", "REFLECTION"];

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  THEORY: "Teoria",
  QUIZ: "Quiz",
  CASE_STUDY: "Estudo de caso",
  PRACTICE: "Prática",
  REFLECTION: "Reflexão",
};

function EnrichModalInner({
  courseSlug,
  moduleId,
  referenceLessonId,
  onClose,
  onSuccess,
}: Omit<Props, "open">) {
  const t = useTranslations("enrich");
  const [position, setPosition] = useState<"before" | "after">("after");
  const [lessonType, setLessonType] = useState<LessonType>("THEORY");
  const [topicHint, setTopicHint] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [upgradeUrl, setUpgradeUrl] = useState("/pricing");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function submit() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/courses/${courseSlug}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "insert-lesson",
          moduleId,
          referenceLessonId,
          position,
          lessonType,
          topicHint: topicHint.trim() || undefined,
        }),
      });

      if (res.status === 403) {
        const data = (await res.json()) as { error: string; upgradeUrl?: string };
        if (data.upgradeUrl) setUpgradeUrl(data.upgradeUrl);
        setStatus("pro_required");
        return;
      }
      if (res.status === 429) {
        setStatus("limit");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch {
      setStatus("error");
    }
  }

  const isLoading = status === "loading";

  return (
    <div
      ref={overlayRef}
      className="enrich-overlay"
      onClick={(e) => {
        if ((e.target as HTMLElement) === overlayRef.current) onClose();
      }}
    >
      <div className="enrich-modal" role="dialog" aria-modal="true" aria-labelledby="enrich-title">
        <div className="enrich-modal-head">
          <h2 id="enrich-title" className="enrich-modal-title">
            {t("confirmTitle")}
          </h2>
          <button className="icon" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        {status === "pro_required" ? (
          <div className="enrich-pro-gate">
            <p className="enrich-pro-msg">{t("proRequired")}</p>
            <a href={upgradeUrl} className="primary">
              {t("upgradeCta")}
            </a>
            <button className="ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        ) : status === "limit" ? (
          <div className="enrich-limit">
            <p>{t("limitReached")}</p>
            <button className="ghost" onClick={onClose}>
              Fechar
            </button>
          </div>
        ) : status === "success" ? (
          <div className="enrich-success">
            <span className="enrich-success-icon">✓</span>
            <span>{t("success")}</span>
          </div>
        ) : (
          <>
            <p className="enrich-modal-body">{t("confirmBody")}</p>

            <div className="enrich-field">
              <fieldset className="enrich-radio-group">
                <legend className="enrich-label">Posição</legend>
                <label className={`enrich-radio${position === "before" ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="position"
                    value="before"
                    checked={position === "before"}
                    onChange={() => setPosition("before")}
                  />
                  {t("insertBefore")}
                </label>
                <label className={`enrich-radio${position === "after" ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="position"
                    value="after"
                    checked={position === "after"}
                    onChange={() => setPosition("after")}
                  />
                  {t("insertAfter")}
                </label>
              </fieldset>
            </div>

            <div className="enrich-field">
              <label className="enrich-label" htmlFor="enrich-lesson-type">
                {t("lessonType")}
              </label>
              <select
                id="enrich-lesson-type"
                className="enrich-select"
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value as LessonType)}
                disabled={isLoading}
              >
                {LESSON_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {LESSON_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="enrich-field">
              <label className="enrich-label" htmlFor="enrich-topic">
                Dica de tópico (opcional)
              </label>
              <input
                id="enrich-topic"
                className="enrich-input"
                type="text"
                value={topicHint}
                onChange={(e) => setTopicHint(e.target.value)}
                disabled={isLoading}
                maxLength={120}
                placeholder="Ex: introdução prática, conceitos básicos..."
              />
            </div>

            <p className="enrich-notice">{t("progressNotice")}</p>

            {status === "error" && <p className="enrich-error">{t("error")}</p>}

            <div className="enrich-modal-foot">
              <button className="ghost" onClick={onClose} disabled={isLoading}>
                Cancelar
              </button>
              <button className="primary" onClick={() => void submit()} disabled={isLoading}>
                {isLoading ? t("loading") : t("confirmTitle")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function EnrichModal({ open, ...props }: Props) {
  if (!open) return null;
  // key=1 ensures inner state resets each time modal opens
  return <EnrichModalInner key={String(open)} {...props} />;
}
