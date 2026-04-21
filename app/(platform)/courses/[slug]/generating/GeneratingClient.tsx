"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { remarkBlocks } from "@/lib/remark-blocks";

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
  reviewReason?: string | null;
  requiresReview?: boolean;
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
  const [resuming, setResuming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stalled, setStalled] = useState(false);
  const stalledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCompletedRef = useRef(initialData.completedLessons);

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

  async function handleResume() {
    setResuming(true);
    doneRef.current = false;
    try {
      const res = await fetch(`/api/courses/${slug}/resume`, { method: "POST" });
      if (!res.ok || !res.body) throw new Error("resume failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === "done" && event.courseSlug) {
              router.push(`/courses/${event.courseSlug}/lessons/${data.firstLessonId ?? ""}`);
              return;
            }
          } catch {}
        }
      }
      // Stream ended — refresh progress
      router.refresh();
    } catch {
      setResuming(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/courses/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      const json = await res.json();
      const topicParam = json.topic ? `?topic=${encodeURIComponent(json.topic)}` : "";
      router.push(`/courses/generate${topicParam}`);
    } catch {
      setDeleting(false);
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

        if (json.status === "PUBLISHED" || json.status === "DRAFT") {
          doneRef.current = true;
          if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
          return;
        }

        // Stall detection: reset timer whenever a new lesson completes
        if (json.completedLessons > lastCompletedRef.current) {
          lastCompletedRef.current = json.completedLessons;
          setStalled(false);
          if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
          stalledTimerRef.current = setTimeout(() => setStalled(true), 45_000);
        }
      } catch {
        // network error — retry next cycle
      }
    };

    // Start stall timer on mount
    stalledTimerRef.current = setTimeout(() => setStalled(true), 45_000);

    const interval = setInterval(poll, 2000);
    return () => {
      clearInterval(interval);
      if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
    };
  }, [slug]);

  const isDone = data.status === "PUBLISHED";
  const isFailed = data.status === "DRAFT";
  const isGenerating = !isDone && !isFailed;
  const firstLessonReady = data.completedLessons > 0 && !!data.firstLessonId;
  const pct =
    data.totalLessons > 0 ? Math.round((data.completedLessons / data.totalLessons) * 100) : 0;

  const allLessons = data.modules.flatMap((m) => m.lessons);
  const activeIndex = allLessons.findIndex((l) => !l.hasContent);

  return (
    <div className="flex flex-col gap-0">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="pb-7 border-b border-border">
        <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground mb-3">
          {isDone ? "Curso pronto" : isFailed ? "Geração interrompida" : "Gerando curso"}
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
          {isGenerating && !stalled && (
            <div className="flex items-center gap-2.5 w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="font-mono text-[12px] text-muted-foreground">
                {activeIndex >= 0 && allLessons[activeIndex]
                  ? `Gerando: ${allLessons[activeIndex].title}`
                  : "Finalizando…"}
              </span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                {elapsed}s
              </span>
              {firstLessonReady && (
                <a
                  href={`/courses/${slug}/lessons/${data.firstLessonId}`}
                  className="ml-2 bg-foreground text-background px-3 py-1.5 rounded text-[12px] font-medium no-underline transition-opacity hover:opacity-90 shrink-0"
                >
                  Iniciar aula 1 →
                </a>
              )}
            </div>
          )}
          {isGenerating && stalled && (
            <div className="flex items-center gap-3 w-full flex-wrap">
              <span className="font-mono text-[12px] text-muted-foreground">
                A geração parece ter travado.
              </span>
              <div className="ml-auto flex gap-2 flex-wrap">
                {firstLessonReady && (
                  <a
                    href={`/courses/${slug}/lessons/${data.firstLessonId}`}
                    className="bg-foreground text-background px-3 py-1.5 rounded text-[13px] font-medium no-underline transition-opacity hover:opacity-90"
                  >
                    Iniciar aula 1 →
                  </a>
                )}
                <button
                  onClick={handleResume}
                  disabled={resuming}
                  className="text-[13px] px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors bg-transparent cursor-pointer font-[inherit]"
                >
                  {resuming ? "Retomando…" : "Retomar geração"}
                </button>
              </div>
            </div>
          )}
          {isDone && (
            <div className="flex items-center gap-3 w-full">
              <span className="font-mono text-[12px] text-accent">✓ Tudo pronto</span>
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
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-muted-foreground m-0">
                {data.reviewReason === "GENERATION_INCOMPLETE"
                  ? `${data.completedLessons} de ${data.totalLessons} aulas foram geradas. O modelo recusou algumas aulas — provavelmente por conteúdo histórico sensível. Você pode continuar de onde parou ou reiniciar.`
                  : data.reviewReason === "CONTENT_RESTRICTED"
                    ? "O conteúdo gerado foi sinalizado pelo sistema de revisão antes de ser publicado."
                    : "Geração interrompida para revisão."}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleResume}
                  disabled={resuming || deleting}
                  className="text-[13px] px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-80 disabled:opacity-40 transition-opacity"
                >
                  {resuming ? "Continuando…" : "Continuar de onde parou"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={resuming || deleting}
                  className="text-[13px] px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                >
                  {deleting ? "Apagando…" : "Reiniciar do zero"}
                </button>
              </div>
            </div>
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
                    <li key={lesson.id} className="flex items-center gap-2 text-[13px]">
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkDirective, remarkBlocks]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {data.previewLesson.contentPreview}
                </ReactMarkdown>
              </div>
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
