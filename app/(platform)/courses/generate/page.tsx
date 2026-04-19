"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { GenerationEvent } from "@/lib/generation";

type Phase =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "outlining"; outline?: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }>; estimatedMinutes?: number }> } }
  | { status: "generating"; outline: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }>; estimatedMinutes?: number }> }; completedLessons: Set<string> }
  | { status: "done"; courseSlug: string }
  | { status: "error"; message: string };

type IngestSource =
  | { type: "url"; url: string }
  | { type: "youtube"; url: string }
  | { type: "text"; content: string }

const SUGGESTIONS = [
  "Kali Linux", "Piano clássico", "Bread & sourdough", "Negociação",
  "Estatística bayesiana", "Color theory", "Rust ownership", "Aberturas de xadrez",
];

const DEPTH_IDS = ["beginner", "intermediate", "deep"] as const;
const FORMAT_IDS = ["reading", "mixed", "practical"] as const;
const PACE_VALUES = ["20", "30", "45", "60"] as const;

type DepthId = (typeof DEPTH_IDS)[number];
type FormatId = (typeof FORMAT_IDS)[number];

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

function estimatedMinutes(depth: DepthId, pace: string): number {
  const baseByDepth: Record<DepthId, number> = { beginner: 4, intermediate: 7, deep: 12 };
  const base = baseByDepth[depth];
  const paceNum = parseInt(pace, 10) || 30;
  return Math.round(base * (paceNum / 30));
}

const btnGhost = "bg-transparent text-foreground px-4 py-2.5 rounded text-[13px] border border-border cursor-pointer font-[inherit] transition-colors hover:bg-card";
const btnPrimary = "bg-foreground text-background px-4 py-2.5 rounded text-[13px] font-medium cursor-pointer border-0 font-[inherit] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

export default function GeneratePage() {
  const t = useTranslations("generate");
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<DepthId>("intermediate");
  const [pace, setPace] = useState("30");
  const [format, setFormat] = useState<FormatId>("mixed");
  const [language, setLanguage] = useState("pt");
  const [alsoGenerate, setAlsoGenerate] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [logSteps, setLogSteps] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [inputMode, setInputMode] = useState<"topic" | "sources">("topic");
  const [sources, setSources] = useState<IngestSource[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [ytInput, setYtInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = ["searching", "outlining", "generating"].includes(phase.status);
  const canGenerate = (inputMode === "topic" ? !!topic.trim() : sources.length > 0) && !isRunning;
  const outline = phase.status === "outlining" ? phase.outline : phase.status === "generating" ? phase.outline : null;

  useEffect(() => {
    if (!isRunning) {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
      return;
    }
    elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [isRunning]);

  function addSource(source: IngestSource) {
    setSources((s) => [...s, source]);
  }
  function removeSource(i: number) {
    setSources((s) => s.filter((_, idx) => idx !== i));
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setElapsed(0);
    abortRef.current = new AbortController();
    setPhase({ status: "searching" });
    setLogSteps([]);
    const thinking = t.raw("thinking") as string[];
    if (inputMode === "sources" && sources.length > 0) {
      setLogSteps([t("ingesting")]);
      thinking.forEach((s, i) => { setTimeout(() => setLogSteps((prev) => [...prev, s]), 450 * (i + 1) + 600); });
    } else {
      thinking.forEach((s, i) => { setTimeout(() => setLogSteps((prev) => [...prev, s]), 450 * (i + 1)); });
    }

    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), language, ...(sources.length > 0 ? { sources } : {}) }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(t("errorStart"));

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentOutline: { title: string; modules: Array<{ title: string; lessons: Array<{ title: string; type: string }>; estimatedMinutes?: number }> } | undefined;
      const completed = new Set<string>();
      let handedOff = false;

      while (true) {
        if (handedOff) break;
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event: GenerationEvent = JSON.parse(line);
          if (event.type === "ingesting") {
            // already shown via logSteps
          } else if (event.type === "searching") {
            setPhase({ status: "searching" });
          } else if (event.type === "outline") {
            currentOutline = event.outline;
            setPhase({ status: "outlining", outline: event.outline });
            setTimeout(() => { if (currentOutline) setPhase({ status: "generating", outline: currentOutline, completedLessons: new Set() }); }, 800);
          } else if (event.type === "course_created") {
            router.push(`/courses/${event.courseSlug}/generating`);
            handedOff = true; // generating page polls from here — stop reading stream
            break;
          } else if (event.type === "lesson_done") {
            completed.add(`${event.moduleIndex}-${event.lessonIndex}`);
            if (currentOutline) setPhase({ status: "generating", outline: currentOutline, completedLessons: new Set(completed) });
          } else if (event.type === "error") {
            setPhase({ status: "error", message: event.message });
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setPhase({ status: "error", message: (err as Error).message });
    }
  }

  const estTime = estimatedMinutes(depth, pace);

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="pb-8 border-b border-border">
        <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground mb-2">{t("eyebrow")}</div>
        <h1 className="font-medium text-[28px] leading-[1.15] tracking-[-0.02em] m-0 text-foreground">
          {t("title")}
        </h1>
        <p className="text-[15px] leading-[1.6] text-muted-foreground mt-2 m-0">
          {t("lede")}
        </p>
      </header>

      <div className="flex flex-col gap-0">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
          {(["topic", "sources"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setInputMode(mode)}
              disabled={isRunning}
              className={`px-3.5 py-1.5 rounded text-[13px] transition-all border-0 cursor-pointer font-[inherit] ${
                inputMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`inputMode.${mode}`)}
            </button>
          ))}
        </div>

        {inputMode === "topic" ? (
          <>
            <textarea
              className="w-full bg-transparent border-0 border-b border-border font-[inherit] text-[22px] leading-[1.35] text-foreground py-4 resize-none min-h-[100px] outline-none tracking-[-0.02em] font-normal placeholder:text-muted-foreground focus:border-accent"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t("placeholder")}
              rows={4}
              disabled={isRunning}
            />
            <div className="flex flex-wrap gap-1.5 items-center mt-4">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mr-1">{t("suggestionsLabel")}</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button"
                  className="text-[12px] px-[11px] py-[5px] border border-border rounded-full text-muted-foreground transition-all bg-transparent cursor-pointer font-[inherit] hover:border-foreground hover:text-foreground"
                  onClick={() => setTopic(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-6 pb-2">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">URL</span>
              <div className="flex gap-2 items-end">
                <input
                  type="url"
                  className="flex-1 bg-transparent border-0 border-b border-border text-[15px] text-foreground py-2.5 outline-none placeholder:text-muted-foreground focus:border-accent"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && urlInput.trim()) { addSource({ type: "url", url: urlInput.trim() }); setUrlInput(""); } }}
                  placeholder={t("urlPlaceholder")}
                  disabled={isRunning}
                />
                <button type="button" className={btnGhost} disabled={!urlInput.trim() || isRunning}
                  onClick={() => { if (urlInput.trim()) { addSource({ type: "url", url: urlInput.trim() }); setUrlInput(""); } }}>
                  {t("addUrl")}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">YOUTUBE</span>
              <div className="flex gap-2 items-end">
                <input
                  type="url"
                  className="flex-1 bg-transparent border-0 border-b border-border text-[15px] text-foreground py-2.5 outline-none placeholder:text-muted-foreground focus:border-accent"
                  value={ytInput}
                  onChange={(e) => setYtInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && ytInput.trim()) { addSource({ type: "youtube", url: ytInput.trim() }); setYtInput(""); } }}
                  placeholder={t("youtubePlaceholder")}
                  disabled={isRunning}
                />
                <button type="button" className={btnGhost} disabled={!ytInput.trim() || isRunning}
                  onClick={() => { if (ytInput.trim()) { addSource({ type: "youtube", url: ytInput.trim() }); setYtInput(""); } }}>
                  {t("addVideo")}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">TEXTO</span>
              <textarea
                className="w-full bg-transparent border-0 border-b border-border text-[15px] text-foreground py-2.5 outline-none resize-none min-h-[80px] placeholder:text-muted-foreground"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t("textPlaceholder")}
                rows={3}
                disabled={isRunning}
              />
              <button type="button" className={`${btnGhost} self-end`} disabled={!textInput.trim() || isRunning}
                onClick={() => { if (textInput.trim()) { addSource({ type: "text", content: textInput.trim() }); setTextInput(""); } }}>
                {t("addText")}
              </button>
            </div>
            {sources.length > 0 && (
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">{t("sourcesList")}</span>
                {sources.map((src, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 bg-card rounded border border-border">
                    <span className="font-mono text-[9px] tracking-[0.1em] uppercase bg-muted px-[6px] py-[3px] rounded text-muted-foreground">
                      {src.type === "url" ? "URL" : src.type === "youtube" ? "YT" : "TXT"}
                    </span>
                    <span className="flex-1 text-[13px] text-foreground truncate">
                      {src.type === "text" ? src.content.slice(0, 80) + (src.content.length > 80 ? "…" : "") : src.url}
                    </span>
                    <button type="button"
                      className="text-[16px] leading-none text-muted-foreground hover:text-foreground border-0 bg-transparent cursor-pointer font-[inherit] px-1"
                      onClick={() => removeSource(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">{t("titleOptional")}</span>
              <input
                type="text"
                className="bg-transparent border-0 border-b border-border text-[17px] text-foreground py-2.5 outline-none placeholder:text-muted-foreground focus:border-accent"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t("titleOptionalPlaceholder")}
                disabled={isRunning}
              />
            </div>
          </div>
        )}

        <div className="mt-10 grid grid-cols-3 gap-8 py-6 border-t border-b border-border">
          <div>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-2.5">{t("depthLabel")}</div>
            <div className="flex gap-1.5 flex-wrap">
              {DEPTH_IDS.map((id) => (
                <button key={id} type="button"
                  className={`text-[13px] px-3 py-1.5 rounded-[var(--radius)] transition-all border-0 cursor-pointer font-[inherit]${
                    depth === id ? " bg-foreground text-background" : " bg-card text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setDepth(id)}
                >
                  {t(`depth.${id}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-2.5">{t("paceLabel")}</div>
            <div className="flex gap-1.5 flex-wrap">
              {PACE_VALUES.map((v) => (
                <button key={v} type="button"
                  className={`text-[13px] px-3 py-1.5 rounded-[var(--radius)] transition-all border-0 cursor-pointer font-[inherit]${
                    pace === v ? " bg-foreground text-background" : " bg-card text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setPace(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-2.5">{t("formatLabel")}</div>
            <div className="flex gap-1.5 flex-wrap">
              {FORMAT_IDS.map((id) => (
                <button key={id} type="button"
                  className={`text-[13px] px-3 py-1.5 rounded-[var(--radius)] transition-all border-0 cursor-pointer font-[inherit]${
                    format === id ? " bg-foreground text-background" : " bg-card text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setFormat(id)}
                >
                  {t(`format.${id}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">{t("languageLabel")}</span>
            <span className="text-[12px] text-muted-foreground">{t("languageSub")}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map((l) => {
              const isPrimary = language === l.code;
              const isAlso = alsoGenerate.includes(l.code);
              return (
                <button key={l.code} type="button"
                  className={`flex flex-col gap-1 px-3.5 py-3 border rounded-[var(--radius-lg)] cursor-pointer font-[inherit] transition-all text-left relative hover:border-foreground/40${
                    isPrimary ? " border-accent bg-accent/10" : isAlso ? " border-accent bg-accent/10" : " border-border bg-background hover:bg-card"
                  }`}
                  onClick={() => {
                    if (isPrimary) return;
                    if (isAlso) {
                      setAlsoGenerate((s) => s.filter((x) => x !== l.code));
                    } else {
                      setLanguage(l.code);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (isPrimary) return;
                    setAlsoGenerate((s) =>
                      s.includes(l.code) ? s.filter((x) => x !== l.code) : [...s, l.code]
                    );
                  }}
                >
                  <span className={`font-mono text-[11px] font-semibold tracking-[0.08em]${isPrimary ? " text-accent" : " text-muted-foreground"}`}>
                    {l.flag}
                  </span>
                  <span className="text-[13px] font-medium text-foreground tracking-[-0.01em]">{l.native}</span>
                  {isPrimary && (
                    <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-accent bg-accent/10 px-[6px] py-[2px] rounded-[3px] w-fit mt-[2px]">
                      {t("primaryBadge")}
                    </span>
                  )}
                  {isAlso && (
                    <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-muted-foreground bg-muted px-[6px] py-[2px] rounded-[3px] w-fit mt-[2px]">
                      {t("alsoBadge")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {alsoGenerate.length > 0 && (
            <div className="flex gap-2 items-center mt-2.5 text-[13px] text-muted-foreground">
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground/60">{t("family")}</span>
              {t(alsoGenerate.length > 1 ? "familyDescMany" : "familyDescOne", {
                native: LANGUAGES.find((l) => l.code === language)?.native ?? "",
                count: alsoGenerate.length,
              })}
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground italic">
            {t("familyHint")}
          </p>
        </div>

        <div className="flex justify-between items-center mt-7">
          <div className="text-[12px] text-muted-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            {t("timeEstimate", { minutes: estTime })}
          </div>
          <button type="button" className={btnPrimary} disabled={!canGenerate} onClick={handleGenerate}>
            {isRunning ? t("generating") : t("generateButton")}
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="mt-16">
          <div className="bg-card rounded-[var(--radius-lg)] p-6 border border-border">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-border">
              <div className={`w-2 h-2 rounded-full${isRunning ? " bg-accent animate-pulse" : " bg-muted-foreground"}`} />
              <span className="font-mono text-[12px] text-foreground/70">{t("logTitle")}</span>
              <span className="ml-auto text-[11px] text-muted-foreground font-mono">{elapsed}s</span>
            </div>
            <ul className="list-none p-0 pt-4 m-0 font-mono text-[12px] text-foreground/70 flex flex-col">
              {logSteps.map((step, i) => (
                <li key={i} className="flex gap-3.5 py-1 animate-[fadeIn_0.3s_ease-out]">
                  <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {outline && (
            <div className="mt-12">
              <div className="flex justify-between items-end gap-8 mb-8 pb-6 border-b border-border">
                <div>
                  <h2 className="font-medium text-[24px] tracking-[-0.03em] m-0 mb-1.5 text-foreground">
                    {t("curriculum", { title: outline.title })}
                  </h2>
                  <p className="text-[14px] text-muted-foreground m-0">{t("curriculumSub")}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className={btnGhost}>{t("regenerate")}</button>
                  <button className={btnGhost}>{t("editStructure")}</button>
                </div>
              </div>
              <ul className="list-none p-0 m-0">
                {outline.modules.map((mod, mi) => {
                  const completedLessons = phase.status === "generating" ? phase.completedLessons : new Set<string>();
                  return (
                    <li key={mi} className="grid grid-cols-[60px_1fr_auto] gap-6 py-6 border-b border-border">
                      <span className="font-mono text-[13px] text-muted-foreground leading-none tracking-[0.02em] pt-1.5">
                        {String(mi + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-medium text-[17px] m-0 mb-2.5 tracking-[-0.02em] text-foreground">{mod.title}</h3>
                        <ul className="list-none p-0 m-0 flex flex-col gap-1">
                          {mod.lessons.map((lesson, li) => {
                            const done = completedLessons.has(`${mi}-${li}`);
                            return (
                              <li key={li} className="flex items-center gap-2.5 text-[14px]" style={{ color: done ? "var(--primary)" : undefined }}>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                                {lesson.title}
                                {done && " ✓"}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground tracking-[0.05em] self-start pt-3.5">
                        {mod.estimatedMinutes ?? 30}min
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {phase.status === "done" && (
        <div className="mt-16">
          <div className="bg-card rounded-[var(--radius-lg)] p-6 border border-border">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="font-mono text-[12px] text-foreground/70">{t("logTitle")}</span>
              <span className="ml-auto text-[11px] text-muted-foreground font-mono">{t("logComplete")}</span>
            </div>
            <ul className="list-none p-0 pt-4 m-0 font-mono text-[12px] text-foreground/70 flex flex-col">
              {logSteps.map((s, i) => (
                <li key={i} className="flex gap-3.5 py-1">
                  <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-primary font-medium mt-4">{t("done")}</p>
        </div>
      )}

      {phase.status === "error" && (
        <div className="mt-16">
          <p className="text-destructive font-medium">{t("errorTitle")}</p>
          <p className="text-[0.85em] text-destructive mt-1">{phase.message}</p>
          <button
            className={`${btnGhost} mt-2`}
            onClick={() => { setPhase({ status: "idle" }); setLogSteps([]); }}
          >
            {t("retry")}
          </button>
        </div>
      )}
    </div>
  );
}
