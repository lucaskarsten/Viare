"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

const difficulties = [
  { value: "", label: "Todos" },
  { value: "EASY", label: "Iniciante" },
  { value: "MEDIUM", label: "Intermediário" },
  { value: "HARD", label: "Avançado" },
];

export default function CourseSearch({
  initialQ,
  initialDifficulty,
}: {
  initialQ?: string;
  initialDifficulty?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback(
    (q: string, difficulty: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (difficulty) params.set("difficulty", difficulty);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  return (
    <div className="catalog-filters">
      {difficulties.map((d) => (
        <button
          key={d.value}
          onClick={() => update(initialQ ?? "", d.value)}
          className={`catalog-filter${(initialDifficulty ?? "") === d.value ? " on" : ""}`}
        >
          {d.label}
        </button>
      ))}
      <input
        type="text"
        placeholder="Buscar cursos..."
        defaultValue={initialQ}
        className="catalog-search-input"
        onChange={(e) => update(e.target.value, initialDifficulty ?? "")}
      />
    </div>
  );
}
