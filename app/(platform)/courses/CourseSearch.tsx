"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar cursos..."
          defaultValue={initialQ}
          className="w-full pl-9 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => update(e.target.value, initialDifficulty ?? "")}
        />
      </div>
      <div className="flex gap-1 rounded-md border bg-background p-1">
        {difficulties.map((d) => (
          <button
            key={d.value}
            onClick={() => update(initialQ ?? "", d.value)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              (initialDifficulty ?? "") === d.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
