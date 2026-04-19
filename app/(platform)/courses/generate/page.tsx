"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GenerationEvent } from "@/lib/generation";

type Phase =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "outlining"; outline?: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }>; estimatedMinutes?: number }> } }
  | { status: "generating"; outline: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }>; estimatedMinutes?: number }> }; completedLessons: Set<string> }
  | { status: "done"; courseSlug: string }
  | { status: "error"; message: string };

const SUGGESTIONS = [
  "Kali Linux",
  "Piano clássico",
  "Bread & sourdough",
  "Negociação",
  "Estatística bayesiana",
  "Color theory",
  "Rust ownership",
  "Aberturas de xadrez",
];

const THINKING = [
  "Varrendo fontes primárias…",
  "Verificando atualidade das informações…",
  "Estruturando módulos e aulas…",
  "Rascunhando quizzes e labs…",
  "Selecionando vocabulário para flashcards…",
  "Pronto.",
];

const LANGUAGES = [
  { code: "pt", flag: "PT", native: "Português" },
  { code: "en", flag: "EN", native: "English" },
  { code: "es", flag: "ES", native: "Español" },
  { code: "fr", flag: "FR", native: "Français" },
  { code: "de", flag: "DE", native: "Deutsch" },
  { code: "it", flag: "IT", native: "Italiano" },
  { code: "zh", flag: "ZH", native: "中文" },
  { code: "ja", flag: "JP", native: "日本語" },
];

function estimatedMinutes(depth: string, pace: string): number {
  const baseByDepth: Record<string, number> = { "Iniciante": 4, "Intermediário": 7, "Profundo": 12 };
  const base = baseByDepth[depth] ?? 7;
  const paceNum = parseInt(pace, 10) || 30;
  return Math.round(base * (paceNum / 30));
}

export default function GeneratePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState("Intermediário");
  const [pace, setPace] = useState("30");
  const [format, setFormat] = useState("Misto");
  const [language, setLanguage] = useState("pt");
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [logSteps, setLogSteps] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = ["searching", "outlining", "generating"].includes(phase.status);

  const outline =
    phase.status === "outlining" ? phase.outline :
    phase.status === "generating" ? phase.outline :
    null;

  useEffect(() => {
    if (!isRunning) {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
      return;
    }
    elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [isRunning]);

  async function handleGenerate() {
    if (!topic.trim() || isRunning) return;
    setElapsed(0);

    abortRef.current = new AbortController();
    setPhase({ status: "searching" });
    setLogSteps([]);

    THINKING.forEach((s, i) => {
      setTimeout(() => setLogSteps((prev) => [...prev, s]), 450 * (i + 1));
    });

    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Falha ao iniciar geração");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentOutline: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }>; estimatedMinutes?: number }> } | undefined;
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

  const estTime = estimatedMinutes(depth, pace);

  return (
    <div className="page">
      <header className="page-head compact">
        <div>
          <div className="eyebrow">GERAR CURSO</div>
          <h1 className="h1">Sobre o que quer aprender?</h1>
          <p className="lede">Digite um tema, quanto mais específico, melhor o currículo gerado.</p>
        </div>
      </header>

      <div className="gen-form">
        <textarea
          className="gen-input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ex: Redes de computadores, história do jazz, panificação..."
          rows={4}
          disabled={isRunning}
        />

        <div className="gen-suggest">
          <span className="gen-suggest-label">SUGESTÕES</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="suggest-chip" onClick={() => setTopic(s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="gen-options">
          <div>
            <div className="opt-label">PROFUNDIDADE</div>
            <div className="opt-row">
              {["Iniciante", "Intermediário", "Profundo"].map((v) => (
                <button key={v} type="button" className={`seg${depth === v ? " on" : ""}`} onClick={() => setDepth(v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="opt-label">DURAÇÃO (min/aula)</div>
            <div className="opt-row">
              {["20", "30", "45", "60"].map((v) => (
                <button key={v} type="button" className={`seg${pace === v ? " on" : ""}`} onClick={() => setPace(v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="opt-label">FORMATO</div>
            <div className="opt-row">
              {["Leitura", "Misto", "Prático"].map((v) => (
                <button key={v} type="button" className={`seg${format === v ? " on" : ""}`} onClick={() => setFormat(v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="gen-lang">
          <div className="opt-label">
            IDIOMA
            <span className="gen-lang-hint">Selecione o idioma principal do curso</span>
          </div>
          <div className="lang-grid">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                className={`lang-card${language === l.code ? " primary" : ""}`}
                onClick={() => setLanguage(l.code)}
              >
                <span className="lang-code">{l.flag}</span>
                <span className="lang-native">{l.native}</span>
                {language === l.code && <span className="lang-badge">PRINCIPAL</span>}
              </button>
            ))}
          </div>
          <div className="gen-lang-hint-small">
            Dica: clique para selecionar o idioma principal do curso.
          </div>
        </div>

        <div className="gen-actions">
          <div className="gen-estimate">
            <div className="dot" />
            ~{estTime} min para gerar
          </div>
          <button
            type="button"
            className="primary"
            disabled={!topic.trim() || isRunning}
            onClick={handleGenerate}
          >
            {isRunning ? "Gerando…" : "Gerar curso"}
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="gen-output">
          <div className="thinking-panel">
            <div className="thinking-head">
              <div className={`pulse${isRunning ? " on" : ""}`} />
              <span className="mono">Gerando curso...</span>
              <span className="thinking-meta">{elapsed}s</span>
            </div>
            <ul className="thinking-log">
              {logSteps.map((step, i) => (
                <li key={i}>
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {outline && (
            <div className="curriculum">
              <div className="curriculum-head">
                <div>
                  <h2>{outline.title} · seu currículo</h2>
                  <p className="lede">Edite o que quiser antes de começar.</p>
                </div>
                <div className="curriculum-actions">
                  <button className="ghost">Regenerar</button>
                  <button className="ghost">Editar estrutura</button>
                </div>
              </div>
              <ul className="modules">
                {outline.modules.map((mod, mi) => {
                  const completedLessons = phase.status === "generating" ? phase.completedLessons : new Set<string>();
                  return (
                    <li key={mi} className="module">
                      <span className="module-num">{String(mi + 1).padStart(2, "0")}</span>
                      <div className="module-body">
                        <h3>{mod.title}</h3>
                        <ul className="module-lessons">
                          {mod.lessons.map((lesson, li) => {
                            const done = completedLessons.has(`${mi}-${li}`);
                            return (
                              <li key={li} style={{ color: done ? "var(--ok)" : undefined }}>
                                <span className="bullet" />
                                {lesson.title}
                                {done && " ✓"}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <span className="module-mins">{mod.estimatedMinutes ?? 30}min</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {phase.status === "done" && (
        <div className="gen-output">
          <div className="thinking-panel">
            <div className="thinking-head">
              <div className="pulse" />
              <span className="mono">Gerando curso...</span>
              <span className="thinking-meta">concluído</span>
            </div>
            <ul className="thinking-log">
              {logSteps.map((s, i) => (
                <li key={i}>
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <p style={{ color: "var(--ok)", fontWeight: 500, marginTop: "1rem" }}>
            ✓ Curso pronto! Redirecionando…
          </p>
        </div>
      )}

      {phase.status === "error" && (
        <div className="gen-output">
          <div style={{ color: "var(--danger)", marginTop: "1rem" }}>
            <p style={{ fontWeight: 500 }}>Erro ao gerar curso</p>
            <p style={{ fontSize: "0.85em", marginTop: "0.25rem" }}>{phase.message}</p>
            <button
              className="ghost"
              style={{ marginTop: "0.5rem" }}
              onClick={() => { setPhase({ status: "idle" }); setLogSteps([]); }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
