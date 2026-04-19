"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  courseId: string;
  enrollment: { id: string; progressPercent: number; status: string } | null;
  firstLessonHref: string | null;
  nextLessonNumber?: number;
};

export default function EnrollButton({
  courseId,
  enrollment,
  firstLessonHref,
  nextLessonNumber,
}: Props) {
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
    const label =
      enrollment.progressPercent > 0 && nextLessonNumber
        ? `Continuar aula ${nextLessonNumber} →`
        : enrollment.progressPercent > 0
          ? "Continuar →"
          : "Começar curso →";
    return (
      <a href={firstLessonHref ?? "#"} className="primary">
        {label}
      </a>
    );
  }

  return (
    <button onClick={enroll} disabled={loading} className="primary">
      {loading ? "Matriculando…" : "Começar curso →"}
    </button>
  );
}
