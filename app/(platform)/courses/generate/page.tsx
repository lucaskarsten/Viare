"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown, Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { GenerationEvent } from "@/lib/generation";

type Phase =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "outlining"; outline?: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }> }> } }
  | { status: "generating"; outline: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }> }> }; completedLessons: Set<string> }
  | { status: "done"; courseSlug: string }
  | { status: "error"; message: string };

export default function GeneratePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || phase.status !== "idle") return;

    abortRef.current = new AbortController();
    setPhase({ status: "searching" });

    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), customContext: customContext.trim() || undefined }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Falha ao iniciar geração");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let currentOutline: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }> }> } | undefined;
      const completed = new Set<string>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event: GenerationEvent = JSON.parse(line);

          if (event.type === "searching") {
            setPhase({ status: "searching" });
          } else if (event.type === "outline") {
            currentOutline = event.outline;
            setPhase({ status: "outlining", outline: event.outline });
            setTimeout(() => {
              if (currentOutline) {
                setPhase({ status: "generating", outline: currentOutline, completedLessons: new Set() });
              }
            }, 800);
          } else if (event.type === "lesson_done") {
            completed.add(`${event.moduleIndex}-${event.lessonIndex}`);
            if (currentOutline) {
              setPhase({ status: "generating", outline: currentOutline, completedLessons: new Set(completed) });
            }
          } else if (event.type === "done") {
            setPhase({ status: "done", courseSlug: event.courseSlug });
            setTimeout(() => router.push(`/courses/${event.courseSlug}`), 1500);
          } else if (event.type === "error") {
            setPhase({ status: "error", message: event.message });
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setPhase({ status: "error", message: (err as Error).message });
      }
    }
  }

  const isRunning = ["searching", "outlining", "generating"].includes(phase.status);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Gerar curso com IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Digite um tópico e a IA irá pesquisar e montar um curso completo para você.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Ex: Kali Linux, Python para dados, Fundamentos de redes..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isRunning}
            className="w-full rounded-md border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            autoFocus
          />
        </div>

        <button
          type="button"
          onClick={() => setShowContext(!showContext)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showContext ? "rotate-180" : ""}`} />
          Personalizar curso (opcional)
        </button>

        {showContext && (
          <textarea
            placeholder="Ex: Foco em CTF e pentest. Tenho 2 semanas. Já sei Python."
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            disabled={isRunning}
            rows={3}
            className="w-full rounded-md border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
          />
        )}

        <button
          type="submit"
          disabled={!topic.trim() || isRunning}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-3 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar curso
            </>
          )}
        </button>
      </form>

      {/* Progress feedback */}
      {phase.status !== "idle" && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <Step
            done={["outlining", "generating", "done"].includes(phase.status)}
            active={phase.status === "searching"}
            label="Pesquisando conteúdo na web..."
          />
          <Step
            done={["generating", "done"].includes(phase.status)}
            active={phase.status === "outlining"}
            label="Estruturando módulos e aulas..."
          />

          {(phase.status === "outlining" || phase.status === "generating" || phase.status === "done") && (
            <div className="ml-6 mt-2 space-y-3">
              {(phase.status === "outlining" ? phase.outline : phase.status === "generating" || phase.status === "done" ? (phase as { outline: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }> }> } }).outline : null)?.modules.map((mod, mi) => (
                <div key={mi}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{mod.title}</p>
                  <div className="space-y-1">
                    {mod.lessons.map((lesson, li) => {
                      const key = `${mi}-${li}`;
                      const isDone = phase.status === "done" || (phase.status === "generating" && (phase as { completedLessons: Set<string> }).completedLessons.has(key));
                      const isActive =
                        phase.status === "generating" &&
                        !(phase as { completedLessons: Set<string> }).completedLessons.has(key) &&
                        isNextLesson(mi, li, (phase as { completedLessons: Set<string> }).completedLessons, (phase as { outline: { modules: Array<{ lessons: unknown[] }> } }).outline.modules);

                      return (
                        <div key={li} className={`flex items-center gap-2 text-xs ${isDone ? "text-foreground" : isActive ? "text-primary" : "text-muted-foreground"}`}>
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : isActive ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          {lesson.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {phase.status === "done" && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium pt-2">
              <CheckCircle2 className="h-4 w-4" />
              Curso pronto! Redirecionando...
            </div>
          )}

          {phase.status === "error" && (
            <div className="flex items-start gap-2 text-sm text-destructive pt-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Erro ao gerar curso</p>
                <p className="text-xs mt-0.5">{phase.message}</p>
                <button
                  onClick={() => setPhase({ status: "idle" })}
                  className="mt-2 text-xs underline underline-offset-2"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Step({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 text-sm ${done ? "text-foreground" : active ? "text-primary" : "text-muted-foreground"}`}>
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : active ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        <Circle className="h-4 w-4 shrink-0" />
      )}
      <span className={active ? "font-medium" : ""}>{label}</span>
    </div>
  );
}

function isNextLesson(
  mi: number,
  li: number,
  completed: Set<string>,
  modules: Array<{ lessons: unknown[] }>
): boolean {
  for (let m = 0; m < modules.length; m++) {
    for (let l = 0; l < modules[m].lessons.length; l++) {
      if (!completed.has(`${m}-${l}`)) {
        return m === mi && l === li;
      }
    }
  }
  return false;
}
