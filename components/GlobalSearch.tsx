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
  color?: string;
  letter?: string;
};

function score(query: string, item: { title: string; keywords?: string }): number {
  const q = query.toLowerCase();
  const hay = (item.title + " " + (item.keywords ?? "")).toLowerCase();
  if (hay.startsWith(q)) return 100;
  if (item.title.toLowerCase().startsWith(q)) return 100;
  if (item.title.toLowerCase().includes(q)) return 50;
  if (hay.includes(q)) return 50;
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.every((t) => hay.includes(t))) return 10;
  return 0;
}

const FILTER_TABS = ["Todos", "Cursos", "Aulas"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const COURSE_COLORS = ["#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e", "#7a5a8f", "#5a8a8a", "#4f7cac", "#a04a3a"];

export default function GlobalSearch({ courses }: { courses: SearchCourse[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("Todos");
  const inputRef = useRef<HTMLInputElement>(null);

  // Open via Cmd+K or document 'open-search' event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (!v) {
            setQuery("");
            setSelected(0);
            setActiveTab("Todos");
            setTimeout(() => inputRef.current?.focus(), 0);
          }
          return !v;
        });
      }
      if (e.key === "Escape") setOpen(false);
    }

    function onOpenSearch() {
      setOpen(true);
      setQuery("");
      setSelected(0);
      setActiveTab("Todos");
      setTimeout(() => inputRef.current?.focus(), 30);
    }

    window.addEventListener("keydown", onKey);
    document.addEventListener("open-search", onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("open-search", onOpenSearch);
    };
  }, []);

  const results: Result[] = (() => {
    if (!query.trim()) return [];
    const all: (Result & { _score: number })[] = [];

    for (const [i, course] of courses.entries()) {
      if (activeTab === "Aulas") continue;
      const s = score(query, { title: course.title });
      if (s > 0) {
        all.push({
          type: "curso",
          title: course.title,
          subtitle: `${course.lessonCount} aulas`,
          href: `/courses/${course.slug}`,
          color: COURSE_COLORS[i % COURSE_COLORS.length],
          letter: course.title.slice(0, 2),
          _score: s,
        });
      }
    }

    for (const course of courses) {
      if (activeTab === "Cursos") continue;
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
      onClose();
    }
  }

  function onClose() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="gs-overlay" onClick={onClose}>
      <div className="gs" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="gs-input-wrap">
          <span className="gs-icon">⌕</span>
          <input
            ref={inputRef}
            className="gs-input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            placeholder="Buscar cursos, aulas, notas, flashcards…"
            autoFocus
          />
          <span className="gs-kbd-esc" onClick={onClose} style={{ cursor: "pointer" }}>esc</span>
        </div>

        {/* Filters */}
        <div className="gs-filters">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              className={`gs-filter${activeTab === tab ? " on" : ""}`}
              onClick={() => { setActiveTab(tab); setSelected(0); }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="gs-results">
          {!query && (
            <div className="gs-empty">
              <div className="gs-empty-title">Digite para buscar cursos e aulas</div>
            </div>
          )}
          {query && results.length === 0 && (
            <div className="gs-empty">
              <div className="gs-empty-title">Nenhum resultado para &ldquo;<span>{query}</span>&rdquo;</div>
              <div className="gs-empty-sub">Tente menos palavras, ou gere um novo curso sobre isso.</div>
              <button
                className="gs-empty-cta"
                onClick={() => { router.push("/courses/generate"); onClose(); }}
              >
                Gerar curso: &ldquo;<span>{query}</span>&rdquo; →
              </button>
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.href + i}
              className={`gs-item${i === selected ? " sel" : ""} kind-${r.type}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => { router.push(r.href); onClose(); }}
            >
              <span
                className="gs-item-icon"
                style={r.color ? { color: r.color } : undefined}
              >
                {r.type === "curso" ? "▣" : "▸"}
              </span>
              <span className="gs-item-main">
                <span className="gs-item-title">{r.title}</span>
                {r.subtitle && <span className="gs-item-sub">{r.subtitle}</span>}
              </span>
              {i === selected && <span className="gs-item-enter">↵</span>}
            </button>
          ))}
        </div>

        {/* Footer */}
        <footer className="gs-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>esc</kbd> fechar</span>
          <span className="gs-foot-spacer" />
          <span className="gs-foot-hint">Dica: digite pra filtrar ou comece com /course, /note</span>
        </footer>
      </div>
    </div>
  );
}
