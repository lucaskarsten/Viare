"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  courseId: string;
  enrollment: { id: string; progressPercent: number; status: string } | null;
  firstLessonHref: string | null;
  nextLessonNumber?: number;
};

const btnClass = "bg-foreground text-background px-4 py-2.5 rounded text-[13px] font-medium transition-opacity no-underline inline-flex items-center border-0 cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

export default function EnrollButton({
  courseId,
  enrollment,
  firstLessonHref,
  nextLessonNumber,
}: Props) {
  const t = useTranslations("enroll");
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
        ? t("continueLesson", { number: nextLessonNumber })
        : enrollment.progressPercent > 0
          ? t("continue")
          : t("start");
    return (
      <a href={firstLessonHref ?? "#"} className={btnClass}>
        {label}
      </a>
    );
  }

  return (
    <button onClick={enroll} disabled={loading} className={btnClass}>
      {loading ? t("enrolling") : t("start")}
    </button>
  );
}
