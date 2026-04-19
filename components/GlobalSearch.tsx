"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchLesson = { id: string; title: string; moduleTitle: string; type: string };
type SearchCourse = {
  id: string;
  slug: string;
  title: string;
  moduleCount: number;
  lessonCount: number;
  progressPercent?: number;
  lessons: SearchLesson[];
};

type Result = {
  type: "curso" | "aula";
  title: string;
  subtitle: string;
  href: string;
};

function score(query: string, item: { title: string; keywords?: string }): number {
  const q = query.toLowerCase();
  const hay = (item.title + " " + (item.keywords ?? "")).toLowerCase();
  if (hay.startsWith(q)) return 100;
  if (hay.includes(q)) return 50;
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.every((t) => hay.includes(t))) return 10;
  return 0;
}

const FILTER_TABS = ["Todos", "Cursos", "Aulas"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function GlobalSearch({ courses }: { courses: SearchCourse[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [filter, setFilter] = useState<FilterTab>("Todos");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (!v) {
            setQuery("");
            setSelected(0);
            setFilter("Todos");
            setTimeout(() => inputRef.current?.focus(), 0);
          }
          return !v;
        });
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const results: Result[] = (() => {
    if (!query.trim()) return [];

    const all: (Result & { _score: number })[] = [];

    for (const course of courses) {
      if (filter === "Aulas") continue;
      const s = score(query, { title: course.title });
      if (s > 0) {
        all.push({
          type: "curso",
          title: course.title,
          subtitle: `${course.lessonCount} aulas`,
          href: `/courses/${course.slug}`,
          _score: s,
        });
      }
    }

    for (const course of courses) {
      if (filter === "Cursos") continue;
      for (const lesson of course.lessons) {
        const s = score(query, { title: lesson.title, keywords: course.title + " " + lesson.moduleTitle });
        if (s > 0) {
          all.push({
            type: "aula",
            title: lesson.title,
            subtitle: `${course.title} · ${lesson.moduleTitle}`,
            href: `/courses/${course.slug}/lessons/${lesson.id}`,
            _score: s,
          });
        }
      }
    }

    return all.sort((a, b) => b._score - a._score);
  })();

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((v) => Math.min(v + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((v) => Math.max(v - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      router.push(results[selected].href);
      setOpen(false);
    }
  }

  function close() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
      onClick={close}
    >
      <div
        className="max-w-xl mx-auto mt-20 bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <span className="text-muted-foreground">⌕</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            placeholder="Buscar cursos, aulas…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKey}
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-3 pt-2 pb-1 border-b border-border">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                setSelected(0);
              }}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                filter === tab
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              Nenhum resultado para &ldquo;{query}&rdquo;
              <br />
              <button
                onClick={() => {
                  router.push("/courses/generate");
                  close();
                }}
                className="mt-3 text-accent text-[13px]"
              >
                Gerar curso sobre &ldquo;{query}&rdquo; →
              </button>
            </div>
          )}
          {!query && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Digite para buscar cursos e aulas
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.href}
              onClick={() => {
                router.push(r.href);
                close();
              }}
              className={`w-full flex items-start gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors ${
                i === selected ? "bg-muted/50" : ""
              }`}
            >
              <span className="text-[10px] font-mono uppercase text-muted-foreground mt-0.5 w-12 shrink-0">
                {r.type}
              </span>
              <div>
                <div className="text-[14px]">{r.title}</div>
                <div className="text-[12px] text-muted-foreground">{r.subtitle}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-4 px-4 py-2 border-t border-border text-[11px] text-muted-foreground">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navegar
          </span>
          <span>
            <kbd>↵</kbd> abrir
          </span>
          <span>
            <kbd>esc</kbd> fechar
          </span>
        </div>
      </div>
    </div>
  );
}
