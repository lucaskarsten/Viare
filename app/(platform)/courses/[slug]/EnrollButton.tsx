"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, PlayCircle } from "lucide-react";

type Props = {
  courseId: string;
  enrollment: { id: string; progressPercent: number; status: string } | null;
  firstLessonHref: string | null;
};

export default function EnrollButton({ courseId, enrollment, firstLessonHref }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function enroll() {
    setLoading(true);
    try {
      await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      router.refresh();
      if (firstLessonHref) router.push(firstLessonHref);
    } finally {
      setLoading(false);
    }
  }

  if (enrollment) {
    return (
      <a
        href={firstLessonHref ?? "#"}
        className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
      >
        <PlayCircle className="h-4 w-4" />
        {enrollment.progressPercent > 0 ? "Continuar" : "Começar"}
      </a>
    );
  }

  return (
    <button
      onClick={enroll}
      disabled={loading}
      className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
      Matricular-se grátis
    </button>
  );
}
