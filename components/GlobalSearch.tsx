"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

type SearchLesson = {
  id: string;
  title: string;
  moduleTitle: string;
  type: string;
};

type SearchCourse = {
  id: string;
  slug: string;
  title: string;
  moduleCount: number;
  lessonCount: number;
  progressPercent?: number;
  lessons: SearchLesson[];
};

type Kind = "course" | "lesson" | "note" | "flash" | "action";

type CorpusItem = {
  kind: Kind;
  id: string;
  title: string;
  sub: string;
  keywords?: string;
  color?: string;
  kindBadge?: "read" | "lab" | "quiz";
  current?: boolean;
  shortcut?: string;
  href?: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

const COURSE_COLORS = [
  "#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e",
  "#7a5a8f", "#5a8a8a", "#4f7cac", "#a04a3a",
];

const KIND_ICON: Record<Kind, string> = {
  course: "▣",
  lesson: "▸",
  note: "✎",
  flash: "◆",
  action: "⌘",
};

const KIND_LABEL: Record<Kind, string> = {
  course: "Cursos",
  lesson: "Aulas",
  note: "Notas",
  flash: "Flashcards",
  action: "Ações",
};

const KIND_ORDER: Kind[] = ["action", "course", "lesson", "note", "flash"];

const STATIC_ACTIONS: CorpusItem[] = [
  { kind: "action", id: "a-generate", title: "Gerar novo curso",       sub: "Ação", shortcut: "⌘N", href: "/courses/generate" },
  { kind: "action", id: "a-review",   title: "Iniciar revisão de hoje", sub: "Ação", shortcut: "⌘R", href: "/review" },
  { kind: "action", id: "a-library",  title: "Ir para Biblioteca",      sub: "Ação", shortcut: "G L", href: "/library" },
  { kind: "action", id: "a-goals",    title: "Ir para Metas",           sub: "Ação", shortcut: "G G", href: "/goals" },
];

type FilterId = "all" | Kind;

const FILTER_TABS: { id: FilterId; label: string }[] = [
  { id: "all",    label: "Todos" },
  { id: "course", label: "Cursos" },
  { id: "lesson", label: "Aulas" },
  { id: "note",   label: "Notas" },
  { id: "flash",  label: "Flashcards" },
  { id: "action", label: "Ações" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildCorpus(courses: SearchCourse[]): CorpusItem[] {
  const items: CorpusItem[] = [];

  for (const [i, course] of courses.entries()) {
    items.push({
      kind: "course",
      id: `course-${course.slug}`,
      title: course.title,
      sub: `${course.moduleCount} módulos · ${course.lessonCount} aulas`,
      color: COURSE_COLORS[i % COURSE_COLORS.length],
      keywords: course.title,
      href: `/courses/${course.slug}`,
    });

    for (const lesson of course.lessons) {
      const kindBadge = (lesson.type === "lab" || lesson.type === "quiz")
        ? (lesson.type as "lab" | "quiz")
        : "read";
      items.push({
        kind: "lesson",
        id: `lesson-${lesson.id}`,
        title: lesson.title,
        sub: `${course.title} · ${lesson.moduleTitle}`,
        kindBadge,
        keywords: `${course.title} ${lesson.moduleTitle}`,
        href: `/courses/${course.slug}/lessons/${lesson.id}`,
      });
    }
  }

  return [...STATIC_ACTIONS, ...items];
}

function fuzzyScore(query: string, item: CorpusItem): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const hay = `${item.title} ${item.sub ?? ""} ${item.keywords ?? ""}`.toLowerCase();
  if (item.title.toLowerCase().startsWith(q)) return 100;
  if (item.title.toLowerCase().includes(q)) return 50;
  if (hay.includes(q)) return 20;
  const toks = q.split(/\s+/).filter(Boolean);
  if (toks.every((tk) => hay.includes(tk))) return 10;
  // char-sequence fuzzy
  let ci = 0;
  for (const ch of hay) {
    if (ch === q[ci]) ci++;
    if (ci >= q.length) return 1;
  }
  return 0;
}

// ── HighlightMatch ───────────────────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const q = query.toLowerCase();
  const lc = text.toLowerCase();
  const idx = lc.indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/20 text-foreground px-[2px] rounded-[2px] not-italic">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function GlobalSearch({ courses }: { courses: SearchCourse[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [filter, setFilter] = useState<FilterId>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Open/close shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (!v) {
            setQuery("");
            setSelected(0);
            setFilter("all");
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
      setFilter("all");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("open-search", onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("open-search", onOpenSearch);
    };
  }, []);

  // ── Corpus ────────────────────────────────────────────────────────────────

  const corpus = useMemo(() => buildCorpus(courses), [courses]);

  // ── Grouped results ───────────────────────────────────────────────────────

  const groups: { heading: string; items: CorpusItem[] }[] = useMemo(() => {
    const filtered = filter === "all" ? corpus : corpus.filter((c) => c.kind === filter);

    if (!query.trim()) {
      if (filter === "all") {
        // No query: show Recentes (lessons) + Ações rápidas
        const recentLessons = corpus.filter((c) => c.kind === "lesson").slice(0, 3);
        const quickActions = corpus.filter((c) => c.kind === "action").slice(0, 4);
        return [
          { heading: "Recentes", items: recentLessons },
          { heading: "Ações rápidas", items: quickActions },
        ].filter((g) => g.items.length > 0);
      }
      return [{ heading: KIND_LABEL[filter as Kind], items: filtered.slice(0, 10) }];
    }

    const scored = filtered
      .map((item) => ({ item, s: fuzzyScore(query, item) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    // Group by kind in defined order
    const byKind: Partial<Record<Kind, CorpusItem[]>> = {};
    for (const { item } of scored) {
      (byKind[item.kind] ??= []).push(item);
    }

    return KIND_ORDER.filter((k) => byKind[k]?.length).map((k) => ({
      heading: KIND_LABEL[k],
      items: (byKind[k] ?? []).slice(0, 6),
    }));
  }, [query, filter, corpus]);

  // Flat list for keyboard nav
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // ── Keyboard nav (inside dialog) ─────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((v) => Math.min(v + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((v) => Math.max(v - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[selected];
        if (item) activate(item);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flatItems, selected]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selected}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selected]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function activate(item: CorpusItem) {
    if (item.href) {
      router.push(item.href);
    }
    onClose();
  }

  function onClose() {
    setOpen(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!open) return null;

  let runningIdx = -1;
  const hasResults = groups.some((g) => g.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] animate-[gsOverlayIn_0.15s_ease-out]"
      style={{
        background: "color-mix(in oklch, var(--foreground), transparent 70%)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-[min(640px,92vw)] max-h-[70vh] flex flex-col bg-background border border-border rounded-[var(--radius-lg)] shadow-[0_32px_64px_-24px_rgba(0,0,0,0.35)] overflow-hidden animate-[gsIn_0.18s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-[18px] py-3.5 border-b border-border">
          <span className="text-[18px] text-muted-foreground leading-none">⌕</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-0 outline-none font-[inherit] text-[16px] text-foreground tracking-[-0.01em] py-1 placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Buscar cursos, aulas, notas, flashcards…"
            autoFocus
          />
          <span
            className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground px-2 py-[3px] bg-card rounded-[4px] cursor-pointer"
            onClick={onClose}
          >
            esc
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-3.5 py-2 border-b border-border overflow-x-auto shrink-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`text-[11px] px-2.5 py-[5px] border-0 rounded-[4px] cursor-pointer font-mono tracking-[0.04em] uppercase whitespace-nowrap transition-all font-[inherit]${
                filter === tab.id
                  ? " text-foreground bg-card font-semibold"
                  : " bg-transparent text-muted-foreground hover:text-foreground/70 hover:bg-card"
              }`}
              onClick={() => { setFilter(tab.id); setSelected(0); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="overflow-y-auto py-2 px-2 flex-1" ref={listRef}>
          {/* Empty state */}
          {query && !hasResults && (
            <div className="px-5 py-10 text-center">
              <div className="text-[14px] text-foreground/70">
                Nenhum resultado para &ldquo;<span className="text-foreground font-medium">{query}</span>&rdquo;
              </div>
              <div className="text-[12px] text-muted-foreground mt-1.5">
                Tente menos palavras, ou gere um novo curso sobre isso.
              </div>
              <button
                className="mt-5 px-[18px] py-2.5 bg-foreground text-background border-0 rounded-[var(--radius)] font-[inherit] text-[13px] font-medium cursor-pointer"
                onClick={() => { router.push("/courses/generate"); onClose(); }}
              >
                Gerar curso: &ldquo;<span className="opacity-80">{query}</span>&rdquo; →
              </button>
            </div>
          )}

          {/* Grouped results */}
          {groups.map((group, gi) => {
            if (group.items.length === 0) return null;
            return (
              <div key={gi} className="mb-1">
                <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground px-3 pt-2 pb-1">
                  {group.heading}
                </div>
                {group.items.map((item) => {
                  runningIdx++;
                  const idx = runningIdx;
                  const isSel = idx === selected;
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      className={`grid grid-cols-[22px_1fr_auto] gap-3 items-center w-full px-3 py-2.5 border-0 rounded-[6px] cursor-pointer font-[inherit] text-left text-foreground transition-colors${
                        isSel ? " bg-card" : " bg-transparent"
                      }`}
                      onMouseEnter={() => setSelected(idx)}
                      onClick={() => activate(item)}
                    >
                      {/* Icon */}
                      <span
                        className="text-[14px] text-center leading-none font-mono"
                        style={item.color ? { color: item.color } : { color: "var(--muted-foreground)" }}
                      >
                        {KIND_ICON[item.kind]}
                      </span>

                      {/* Main content */}
                      <span className="min-w-0 flex flex-col gap-0.5">
                        <span className="text-[14px] tracking-[-0.005em] flex items-center gap-1.5 flex-wrap">
                          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                            <HighlightMatch text={item.title} query={query} />
                          </span>
                          {item.current && (
                            <span className="font-mono text-[9px] tracking-[0.08em] uppercase px-[6px] py-[2px] rounded-[3px] bg-card text-muted-foreground font-semibold text-accent bg-accent/10">
                              · atual
                            </span>
                          )}
                          {item.kindBadge && (
                            <span
                              className={`font-mono text-[9px] tracking-[0.08em] uppercase px-[6px] py-[2px] rounded-[3px] font-semibold${
                                item.kindBadge === "lab"
                                  ? " text-accent bg-accent/10"
                                  : " bg-card text-muted-foreground"
                              }`}
                            >
                              {item.kindBadge}
                            </span>
                          )}
                        </span>
                        {item.sub && (
                          <span className="text-[11px] text-muted-foreground font-mono tracking-[0.02em] whitespace-nowrap overflow-hidden text-ellipsis">
                            {item.sub}
                          </span>
                        )}
                      </span>

                      {/* Shortcut or Enter hint */}
                      {item.shortcut ? (
                        <span
                          className={`font-mono text-[10px] px-[7px] py-[3px] rounded-[4px] tracking-[0.04em] whitespace-nowrap${
                            isSel ? " bg-background text-foreground/70" : " bg-card text-muted-foreground"
                          }`}
                        >
                          {item.shortcut}
                        </span>
                      ) : isSel ? (
                        <span
                          className={`font-mono text-[10px] px-[7px] py-[3px] rounded-[4px] tracking-[0.04em]${
                            isSel ? " bg-background text-foreground/70" : " bg-card text-muted-foreground"
                          }`}
                        >
                          ↵
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-card text-[11px] text-muted-foreground font-mono tracking-[0.02em]">
          <span>
            <kbd className="inline-block px-1.5 py-0.5 bg-background rounded-[3px] font-mono text-[10px] text-foreground/70 mr-1">↑</kbd>
            <kbd className="inline-block px-1.5 py-0.5 bg-background rounded-[3px] font-mono text-[10px] text-foreground/70 mr-1">↓</kbd>
            navegar
          </span>
          <span>
            <kbd className="inline-block px-1.5 py-0.5 bg-background rounded-[3px] font-mono text-[10px] text-foreground/70 mr-1">↵</kbd>
            abrir
          </span>
          <span>
            <kbd className="inline-block px-1.5 py-0.5 bg-background rounded-[3px] font-mono text-[10px] text-foreground/70 mr-1">esc</kbd>
            fechar
          </span>
          <span className="flex-1" />
          <span className="italic">Dica: digite pra filtrar ou comece com /course, /note</span>
        </footer>
      </div>
    </div>
  );
}
