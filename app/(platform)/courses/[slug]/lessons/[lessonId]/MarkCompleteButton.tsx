"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

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
      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Concluída
      </div>
    );
  }

  return (
    <button
      onClick={markComplete}
      disabled={loading}
      className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Marcar como concluída
    </button>
  );
}
