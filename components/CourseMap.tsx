"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export type CourseMapLesson = {
  id: string;
  title: string;
  order: number;
  completed: boolean;
  current: boolean;
  locked: boolean;
};

export type CourseMapModule = {
  id: string;
  title: string;
  order: number;
  locked: boolean;
  current: boolean;
  lessons: CourseMapLesson[];
};

type CourseMapProps = { modules: CourseMapModule[]; slug: string };

const COL_W = 220;
const PAD_X = 60;
const PAD_Y = 60;
const LESSON_STEP = 100;
const MODULE_HEAD = 60;

export default function CourseMap({ modules, slug }: CourseMapProps) {
  const router = useRouter();
  const [zoom, setZoom] = useState(1);
  const [focusLessonId, setFocusLessonId] = useState<string | null>(null);

  const { nodes, edges, width, height } = useMemo(() => {
    const nodes: {
      id: string;
      moduleIdx: number;
      moduleTitle: string;
      lesson: CourseMapLesson;
      x: number;
      y: number;
      state: "done" | "current" | "locked" | "open";
    }[] = [];
    const edges: { fromId: string; toId: string; kind: "seq" | "module" }[] = [];

    let maxLessons = 0;

    modules.forEach((m, mi) => {
      const x = PAD_X + mi * COL_W + COL_W / 2;
      m.lessons.forEach((l, li) => {
        const y = PAD_Y + MODULE_HEAD + li * LESSON_STEP;
        const state: "done" | "current" | "locked" | "open" = l.completed
          ? "done"
          : l.current
            ? "current"
            : l.locked || m.locked
              ? "locked"
              : "open";
        nodes.push({ id: l.id, moduleIdx: mi, moduleTitle: m.title, lesson: l, x, y, state });

        if (li > 0) {
          edges.push({ fromId: m.lessons[li - 1].id, toId: l.id, kind: "seq" });
        }
        maxLessons = Math.max(maxLessons, m.lessons.length);
      });

      if (mi > 0) {
        const prev = modules[mi - 1];
        if (prev.lessons.length > 0 && m.lessons.length > 0) {
          edges.push({
            fromId: prev.lessons[prev.lessons.length - 1].id,
            toId: m.lessons[0].id,
            kind: "module",
          });
        }
      }
    });

    const width = PAD_X * 2 + modules.length * COL_W;
    const height = PAD_Y * 2 + MODULE_HEAD + maxLessons * LESSON_STEP;
    return { nodes, edges, width, height };
  }, [modules]);

  const focusNode = focusLessonId ? nodes.find((n) => n.id === focusLessonId) : null;

  const legend = [
    { color: "var(--accent)", opacity: 1, label: "Concluída" },
    { color: "var(--accent)", opacity: 0.3, label: "Atual" },
    { color: "var(--border)", opacity: 1, label: "Disponível" },
    { color: "var(--muted-foreground)", opacity: 0.4, label: "Bloqueada" },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: item.color, opacity: item.opacity }}
              />
              {item.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            className="w-6 h-6 flex items-center justify-center border rounded hover:bg-muted transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}
            className="w-6 h-6 flex items-center justify-center border rounded hover:bg-muted transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 h-6 border rounded hover:bg-muted transition-colors ml-1"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* SVG scroll container */}
        <div className="overflow-x-auto flex-1">
          <svg width={width * zoom} height={height * zoom} viewBox={`0 0 ${width} ${height}`}>
            {/* Module column backgrounds */}
            {modules.map((m, mi) => {
              const x = PAD_X + mi * COL_W;
              return (
                <rect
                  key={m.id}
                  x={x + 8}
                  y={PAD_Y - 10}
                  width={COL_W - 16}
                  height={height - PAD_Y * 2 + 20}
                  rx="10"
                  style={{
                    fill: "color-mix(in oklch, var(--muted) 30%, transparent)",
                    stroke: "var(--border)",
                    strokeWidth: 1,
                  }}
                />
              );
            })}

            {/* Module headers */}
            {modules.map((m, mi) => {
              const x = PAD_X + mi * COL_W + COL_W / 2;
              return (
                <g key={`header-${m.id}`}>
                  <text
                    x={x}
                    y={PAD_Y + 16}
                    textAnchor="middle"
                    style={{
                      fill: "var(--muted-foreground)",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                    }}
                  >
                    MÓDULO {mi + 1}
                  </text>
                  <text
                    x={x}
                    y={PAD_Y + 36}
                    textAnchor="middle"
                    style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
                  >
                    {m.title.length > 24 ? m.title.slice(0, 22) + "…" : m.title}
                  </text>
                </g>
              );
            })}

            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodes.find((n) => n.id === e.fromId);
              const to = nodes.find((n) => n.id === e.toId);
              if (!from || !to) return null;

              if (e.kind === "module") {
                const midY = (from.y + to.y) / 2;
                const d = `M ${from.x} ${from.y + 14} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 14}`;
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    style={{
                      stroke: "var(--border)",
                      strokeWidth: 1.5,
                      strokeDasharray: "4 3",
                    }}
                  />
                );
              }
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y + 14}
                  x2={to.x}
                  y2={to.y - 14}
                  style={{ stroke: "var(--border)", strokeWidth: 1.5 }}
                />
              );
            })}

            {/* Lesson nodes */}
            {nodes.map((n) => {
              const isDone = n.state === "done";
              const isCurrent = n.state === "current";
              const isLocked = n.state === "locked";
              const isFocused = focusLessonId === n.id;

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  style={{ cursor: isLocked ? "default" : "pointer" }}
                  onClick={() => {
                    if (isLocked) return;
                    setFocusLessonId(isFocused ? null : n.id);
                  }}
                >
                  {isCurrent && (
                    <circle
                      r="20"
                      style={{
                        fill: "color-mix(in oklch, var(--accent) 15%, transparent)",
                        stroke: "var(--accent)",
                        strokeWidth: 1,
                        strokeDasharray: "3 2",
                      }}
                    />
                  )}
                  {isFocused && (
                    <circle
                      r="18"
                      style={{
                        fill: "none",
                        stroke: "var(--accent)",
                        strokeWidth: 2,
                      }}
                    />
                  )}
                  <circle
                    r="14"
                    style={{
                      fill: isDone
                        ? "var(--accent)"
                        : isCurrent
                          ? "color-mix(in oklch, var(--accent) 20%, transparent)"
                          : isLocked
                            ? "var(--muted)"
                            : "var(--card)",
                      stroke: isDone || isCurrent ? "var(--accent)" : "var(--border)",
                      strokeWidth: 2,
                    }}
                  />
                  <text
                    textAnchor="middle"
                    y="4"
                    style={{
                      fill: isDone
                        ? "var(--accent-foreground)"
                        : isLocked
                          ? "var(--muted-foreground)"
                          : "var(--foreground)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono, monospace)",
                      userSelect: "none",
                    }}
                  >
                    {isDone ? "✓" : isLocked ? "🔒" : isCurrent ? "▸" : n.lesson.order}
                  </text>
                  <text
                    textAnchor="middle"
                    y="30"
                    style={{
                      fill: "var(--muted-foreground)",
                      fontSize: 10,
                      userSelect: "none",
                    }}
                  >
                    {n.lesson.title.length > 22
                      ? n.lesson.title.slice(0, 20) + "…"
                      : n.lesson.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        {focusNode && (
          <div className="w-56 shrink-0 rounded-lg border bg-card p-4 self-start sticky top-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
              {focusNode.moduleTitle}
            </div>
            <div className="font-medium text-[14px] mb-2">{focusNode.lesson.title}</div>
            <div className="text-[11px] text-muted-foreground mb-4">
              {focusNode.state === "done"
                ? "Concluída"
                : focusNode.state === "current"
                  ? "Atual"
                  : focusNode.state === "locked"
                    ? "Bloqueada"
                    : "Disponível"}
            </div>
            {focusNode.state !== "locked" && (
              <button
                onClick={() => router.push(`/courses/${slug}/lessons/${focusNode.lesson.id}`)}
                className="w-full text-[12px] font-medium px-3 py-2 bg-foreground text-background rounded hover:opacity-90 transition-opacity"
              >
                {focusNode.state === "done" ? "Revisitar →" : "Abrir aula →"}
              </button>
            )}
            <button
              onClick={() => setFocusLessonId(null)}
              className="w-full text-[11px] text-muted-foreground mt-2 hover:text-foreground transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
