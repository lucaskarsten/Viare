"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { GenerationEvent } from "@/lib/generation";

type Phase =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "outlining"; outline?: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }> }> } }
  | { status: "generating"; outline: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }> }> }; completedLessons: Set<string> }
  | { status: "done"; courseSlug: string }
  | { status: "error"; message: string };

const SUGGESTIONS = [
  "Kali Linux",
  "Pão de fermentação",
  "Estatística bayesiana",
  "Color theory",
  "Violão fingerstyle",
  "História medieval",
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
  { code: "en", flag: "EN", native: "English" },
  { code: "pt", flag: "PT", native: "Português" },
  { code: "es", flag: "ES", native: "Español" },
  { code: "fr", flag: "FR", native: "Français" },
  { code: "de", flag: "DE", native: "Deutsch" },
  { code: "it", flag: "IT", native: "Italiano" },
  { code: "ja", flag: "JA", native: "日本語" },
  { code: "zh", flag: "ZH", native: "中文" },
];

export default function GeneratePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState("intermediário");
  const [pace, setPace] = useState("30");
  const [format, setFormat] = useState("mixed");
  const [language, setLanguage] = useState("pt");
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [logSteps, setLogSteps] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const isRunning = ["searching", "outlining", "generating"].includes(phase.status);
  const stage = isRunning ? "thinking" : phase.status === "done" ? "done" : phase.status === "error" ? "error" : "idle";

  const outline =
    phase.status === "outlining" ? phase.outline :
    phase.status === "generating" ? phase.outline :
    null;

  async function handleGenerate() {
    if (!topic.trim() || isRunning) return;

    abortRef.current = new AbortController();
    setPhase({ status: "searching" });
    setLogSteps([]);

    // Animate THINKING steps while real generation runs
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

  return (
    <div className="page generate">
      <header className="page-head compact">
        <div>
          <div className="eyebrow">Novo curso</div>
          <h1 className="h1"><em>O que você</em> quer aprender?</h1>
          <p className="lede">Descreva com suas palavras. Quanto mais específico, melhor o currículo.</p>
        </div>
      </header>

      <div className="gen-form">
        <textarea
          className="gen-input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="ex: Aprender marcenaria japonesa, começando pelas ferramentas manuais…"
          disabled={isRunning}
        />

        <div className="gen-suggest">
          <span className="gen-suggest-label">Tente:</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="suggest-chip" onClick={() => setTopic(s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="gen-options">
          <div className="opt-group">
            <div className="opt-label">Profundidade</div>
            <div className="opt-row">
              {["iniciante", "intermediário", "profundo"].map((v) => (
                <button key={v} type="button" className={`seg${depth === v ? " on" : ""}`} onClick={() => setDepth(v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="opt-group">
            <div className="opt-label">Duração de sessão</div>
            <div className="opt-row">
              {[{ v: "20", l: "20 min" }, { v: "30", l: "30 min" }, { v: "45", l: "45 min" }, { v: "60", l: "60 min" }].map((o) => (
                <button key={o.v} type="button" className={`seg${pace === o.v ? " on" : ""}`} onClick={() => setPace(o.v)}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div className="opt-group">
            <div className="opt-label">Formato</div>
            <div className="opt-row">
              {[{ v: "reading", l: "Só leitura" }, { v: "mixed", l: "Misto" }, { v: "hands-on", l: "Prático" }].map((o) => (
                <button key={o.v} type="button" className={`seg${format === o.v ? " on" : ""}`} onClick={() => setFormat(o.v)}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="gen-lang">
          <div className="opt-label">
            Idioma
            <span className="gen-lang-hint">
              Você pode gerar traduções do mesmo curso depois — ficam linkadas como uma família.
            </span>
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
                {language === l.code && <span className="lang-badge">Principal</span>}
              </button>
            ))}
          </div>
          <div className="gen-lang-hint-small">
            Dica: clique para selecionar o idioma principal do curso.
          </div>
        </div>

        <div className="gen-actions">
          <div className="gen-estimate">
            <span className="dot" />
            Estimado: 6 módulos · 18 aulas · ~9 horas
          </div>
          <button
            type="button"
            className="primary"
            disabled={!topic.trim() || stage === "thinking"}
            onClick={handleGenerate}
          >
            {stage === "thinking" ? "Gerando…" : "Gerar currículo →"}
          </button>
        </div>
      </div>

      {stage === "thinking" && (
        <div className="gen-output">
          <div className="thinking-panel">
            <div className="thinking-head">
              <span className="pulse on" />
              <span className="mono">lumen.reason()</span>
              <span className="thinking-meta">processando…</span>
            </div>
            <ul className="thinking-log">
              {logSteps.map((s, i) => (
                <li key={i}>
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s}</span>
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
              <ol className="modules">
                {outline.modules.map((mod, mi) => {
                  const completedLessons = phase.status === "generating" ? phase.completedLessons : new Set<string>();
                  return (
                    <li key={mi} className="module">
                      <div className="module-num">{String(mi + 1).padStart(2, "0")}</div>
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
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      )}

      {phase.status === "done" && (
        <div className="gen-output">
          <div className="thinking-panel">
            <div className="thinking-head">
              <span className="pulse" />
              <span className="mono">lumen.reason()</span>
              <span className="thinking-meta">concluído</span>
            </div>
            <ul className="thinking-log">
              {logSteps.map((s, i) => (
                <li key={i}>
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s}</span>
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
