"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  lessonId: string;
  courseId: string;
  nextLessonHref: string;
  isCompleted: boolean;
  content: string;
};

const MIN_CHARS = 50;

// Splits the generated markdown into the leading question and the trailing
// support-points block. The reflection spec emits the question first and the
// support points (separated by a blank line, typically under a `##` heading)
// after — a simple split is enough.
function splitContent(raw: string): { question: string; support: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { question: "", support: "" };
  const headingIdx = trimmed.search(/\n#{1,6}\s/);
  if (headingIdx >= 0) {
    return {
      question: trimmed.slice(0, headingIdx).trim(),
      support: trimmed.slice(headingIdx).trim(),
    };
  }
  const blocks = trimmed.split(/\n\s*\n/);
  if (blocks.length <= 1) return { question: trimmed, support: "" };
  return {
    question: blocks[0].trim(),
    support: blocks.slice(1).join("\n\n").trim(),
  };
}

export default function ReflectionBlock({
  lessonId,
  courseId,
  nextLessonHref,
  isCompleted,
  content,
}: Props) {
  const t = useTranslations("reflection");
  const router = useRouter();
  const { question, support } = splitContent(content);

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isCompleted);
  const [revealed, setRevealed] = useState(isCompleted);
  const [error, setError] = useState(false);
  const [completing, setCompleting] = useState(false);

  // For the already-completed state: hydrate the textarea with the previous
  // reflection so the learner can re-read what they wrote.
  useEffect(() => {
    if (!isCompleted) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reflections?lessonId=${encodeURIComponent(lessonId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { content: string | null };
        if (!cancelled && data.content) setText(data.content);
      } catch {
        // non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCompleted, lessonId]);

  const charCount = text.trim().length;
  const canSave = !saving && !saved && charCount >= MIN_CHARS;

  async function saveReflection() {
    if (!canSave) return;
    setSaving(true);
    setError(false);
    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content: text }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(true);
      setRevealed(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function continueNext() {
    if (completing) return;
    setCompleting(true);
    try {
      // RULE: PROG-04 — completion already persisted by /api/reflections, but
      // we still hit /api/courses/progress so the route can run the same
      // post-completion side-effects (enrollment %, certificates).
      await fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, courseId }),
      });
      router.refresh();
      router.push(nextLessonHref);
    } catch {
      setError(true);
      setCompleting(false);
    }
  }

  return (
    <div className="reflection-block">
      {question && (
        <div className="reflection-question">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{question}</ReactMarkdown>
        </div>
      )}

      <textarea
        className="reflection-textarea"
        placeholder={t("placeholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={saved}
        rows={8}
      />

      {!saved && charCount < MIN_CHARS && (
        <div className="reflection-hint">{t("minCharsHint")}</div>
      )}

      <div className="reflection-footer">
        {error && <span className="reflection-error">{t("error")}</span>}
        {!saved ? (
          <button className="primary" onClick={saveReflection} disabled={!canSave}>
            {saving ? t("saving") : t("saveButton")}
          </button>
        ) : (
          <span className="reflection-done">{t("completedLabel")}</span>
        )}
      </div>

      {revealed && support && (
        <div className="reflection-support">
          <h3 className="reflection-support-title">{t("supportTitle")}</h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{support}</ReactMarkdown>
        </div>
      )}

      {saved && (
        <div className="reflection-continue">
          <button className="primary" onClick={continueNext} disabled={completing}>
            {completing ? t("saving") : t("continueButton")}
          </button>
        </div>
      )}
    </div>
  );
}
