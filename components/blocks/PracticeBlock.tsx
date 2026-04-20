"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type Props = {
  lessonId: string;
  courseId: string;
  nextLessonHref: string;
  isCompleted: boolean;
  children: ReactNode;
};

export default function PracticeBlock({
  lessonId,
  courseId,
  nextLessonHref,
  isCompleted,
  children,
}: Props) {
  const t = useTranslations("practice");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(isCompleted);
  const [error, setError] = useState(false);

  async function markComplete() {
    if (done || loading) return;
    setLoading(true);
    setError(false);
    try {
      await fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, courseId }),
      });
      setDone(true);
      router.refresh();
      router.push(nextLessonHref);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="practice-block">
      <div className="practice-body">{children}</div>
      <div className="practice-footer">
        {error && <span className="practice-error">{t("error")}</span>}
        {done ? (
          <span className="practice-done">{t("completedLabel")}</span>
        ) : (
          <button className="primary" onClick={markComplete} disabled={loading}>
            {loading ? t("saving") : t("completeButton")}
          </button>
        )}
      </div>
    </div>
  );
}
