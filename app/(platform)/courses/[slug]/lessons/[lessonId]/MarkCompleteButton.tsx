"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  lessonId: string;
  courseId: string;
  isCompleted: boolean;
  nextLessonHref: string;
};

export default function MarkCompleteButton({ lessonId, courseId, isCompleted, nextLessonHref }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(isCompleted);

  async function markComplete() {
    if (done || loading) return;
    setLoading(true);
    try {
      await fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, courseId }),
      });
      setDone(true);
      router.refresh();
      router.push(nextLessonHref);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span style={{ color: "var(--ok)", fontWeight: 500, fontSize: "0.875rem" }}>
        ✓ Concluída
      </span>
    );
  }

  return (
    <button onClick={markComplete} disabled={loading} className="primary">
      {loading ? "Salvando…" : "Marcar como concluída →"}
    </button>
  );
}
