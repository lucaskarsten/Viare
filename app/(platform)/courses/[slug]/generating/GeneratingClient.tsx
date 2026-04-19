"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

type LessonInfo = {
  id: string;
  slug: string;
  title: string;
  type: string;
  hasContent: boolean;
};

type ModuleInfo = {
  id: string;
  title: string;
  order: number;
  lessons: LessonInfo[];
};

type ProgressData = {
  status: string;
  title: string;
  description: string;
  modules: ModuleInfo[];
  totalLessons: number;
  completedLessons: number;
  firstLessonId: string | null;
  previewLesson: { id: string; title: string; contentPreview: string } | null;
};

export default function GeneratingClient({
  slug,
  initialData,
}: {
  slug: string;
  initialData: ProgressData;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [elapsed, setElapsed] = useState(0);
  const doneRef = useRef(false);
  const [enrichStatus, setEnrichStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleEnrich() {
    setEnrichStatus("loading");
    try {
      const res = await fetch(`/api/courses/${slug}/enrich`, { method: "POST" });
      if (!res.ok) throw new Error();
      setEnrichStatus("done");
      router.refresh();
    } catch {
      setEnrichStatus("error");
    }
  }

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (doneRef.current) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/courses/${slug}/progress`);
        if (!res.ok) return;
        const json: ProgressData = await res.json();
        setData(json);
        if (json.status === "PUBLISHED" && json.firstLessonId) {
          doneRef.current = true;
          setTimeout(
            () => router.push(`/courses/${slug}/lessons/${json.firstLessonId}`),
            2500
          );
        }
      } catch {
        // network error — retry next cycle
      }
    };

    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [slug, router]);

  const isDone = data.status === "PUBLISHED";
  const isFailed = data.status === "DRAFT";
  const isGenerating = !isDone && !isFailed;
  const pct =
    data.totalLessons > 0
      ? Math.round((data.completedLessons / data.totalLessons) * 100)
      : 0;

  const allLessons = data.modules.flatMap((m) => m.lessons);
  const activeIndex = allLessons.findIndex((l) => !l.hasContent);

  return (
    <div className="flex flex-col gap-0">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="pb-7 border-b border-border">
        <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground mb-3">
          {isDone
            ? "Curso pronto"
            : isFailed
            ? "Geração interrompida"
            : "Gerando curso"}
        </div>

        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="font-medium text-[28px] leading-[1.15] tracking-[-0.02em] m-0 text-foreground">
              {data.title}
            </h1>
            {data.description && (
              <p className="text-[14px] text-muted-foreground mt-2 m-0 line-clamp-2 max-w-[60ch]">
                {data.description}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right pt-1">
            <div className="font-mono text-[28px] font-medium tabular-nums text-foreground leading-none">
              {data.completedLessons}
              <span className="text-[16px] text-muted-foreground font-normal">
                /{data.totalLessons}
              </span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mt-1">
              aulas prontas
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 h-[3px] bg-border/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Status line */}
        <div className="flex items-center gap-2.5 mt-3 min-h-[24px]">
          {isGenerating && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="font-mono text-[12px] text-muted-foreground">
                {activeIndex >= 0 && allLessons[activeIndex]
                  ? `Gerando: ${allLessons[activeIndex].title}`
                  : "Finalizando…"}
              </span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                {elapsed}s
              </span>
            </>
          )}
          {isDone && (
            <div className="flex items-center gap-3 w-full">
              <span className="font-mono text-[12px] text-accent">
                ✓ Tudo pronto — redirecionando…
              </span>
              <div className="ml-auto flex gap-2">
                <a
                  href={`/courses/${slug}/lessons/${data.firstLessonId}`}
                  className="bg-foreground text-background px-4 py-2 rounded text-[13px] font-medium no-underline transition-opacity hover:opacity-90"
                >
                  Começar agora →
                </a>
                <a
                  href={`/courses/${slug}`}
                  className="text-[13px] text-muted-foreground no-underline hover:text-foreground transition-colors px-3 py-2"
                >
                  Ver curso
                </a>
                <button
                  type="button"
                  onClick={handleEnrich}
                  disabled={enrichStatus === "loading" || enrichStatus === "done"}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-3 py-2 border border-border rounded bg-transparent cursor-pointer font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrichStatus === "loading"
                    ? "Enriquecendo…"
                    : enrichStatus === "done"
                    ? "✓ Módulos adicionados"
                    : "Enriquecer com web"}
                </button>
              </div>
            </div>
          )}
          {isFailed && (
            <span className="text-[13px] text-muted-foreground">
              Geração interrompida para revisão.{" "}
              <a
                href="/dashboard"
                className="text-foreground underline hover:no-underline"
              >
                Ir à biblioteca
              </a>
            </span>
          )}
        </div>
      </div>

      {/* ── Split layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-[252px_1fr] gap-0 mt-0">
        {/* Left: module / lesson tree */}
        <div className="border-r border-border pt-7 pr-7 flex flex-col gap-6">
          {data.modules.map((mod) => (
            <div key={mod.id}>
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-2.5">
                {String(mod.order + 1).padStart(2, "0")} · {mod.title}
              </div>
              <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                {mod.lessons.map((lesson) => {
                  const globalIdx = allLessons.indexOf(lesson);
                  const isActive = globalIdx === activeIndex;
                  const done = lesson.hasContent;
                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-2 text-[13px]"
                    >
                      <span
                        className={`shrink-0 font-mono text-[11px] w-4 text-center leading-none ${
                          done
                            ? "text-accent"
                            : isActive
                            ? "text-foreground"
                            : "text-muted-foreground/30"
                        }`}
                      >
                        {done ? "✓" : isActive ? "⟳" : "○"}
                      </span>
                      <span
                        className={`truncate leading-snug ${
                          done
                            ? "text-foreground"
                            : isActive
                            ? "text-foreground"
                            : "text-muted-foreground/40"
                        }`}
                      >
                        {lesson.title}
                      </span>
                      {isActive && (
                        <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Right: content preview */}
        <div className="pl-8 pt-7 overflow-hidden">
          {data.previewLesson ? (
            <div>
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-1">
                Prévia · {data.previewLesson.title}
              </div>
              <div className="h-px bg-border/50 mb-5" />
              <div className="prose prose-sm max-w-none text-foreground [&_h1]:text-[18px] [&_h1]:font-medium [&_h1]:tracking-[-0.01em] [&_h2]:text-[16px] [&_h2]:font-medium [&_h3]:text-[14px] [&_h3]:font-medium [&_p]:text-[14px] [&_p]:leading-[1.7] [&_p]:text-muted-foreground [&_li]:text-[14px] [&_li]:text-muted-foreground [&_code]:text-[12px] [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-[var(--radius)] [&_strong]:text-foreground [&_strong]:font-medium">
                <ReactMarkdown>{data.previewLesson.contentPreview}</ReactMarkdown>
              </div>
              {isGenerating && (
                <p className="mt-5 text-[12px] text-muted-foreground/50 italic font-mono">
                  Conteúdo completo disponível após a geração concluir.
                </p>
              )}
            </div>
          ) : (
            /* Skeleton while first lesson generates */
            <div className="flex flex-col gap-3 pt-1">
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground/40 mb-1">
                Prévia
              </div>
              <div className="h-px bg-border/30 mb-2" />
              {[72, 100, 100, 88, 0, 100, 96, 80, 100, 64].map((w, i) =>
                w === 0 ? (
                  <div key={i} className="h-4" />
                ) : (
                  <div
                    key={i}
                    className="h-3 bg-muted/60 rounded animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                )
              )}
              <p className="mt-4 font-mono text-[11px] text-muted-foreground/40 uppercase tracking-[0.08em]">
                Preparando primeiro conteúdo…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
