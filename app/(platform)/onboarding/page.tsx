"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Preferences = {
  name: string;
  interests: string[];
  pace: string;
  days: number;
  style: string;
  topic: string;
};

const INTEREST_OPTIONS = [
  { id: "tech",       label: "Tecnologia",   ex: "Kali, Rust, ML" },
  { id: "craft",      label: "Ofícios",       ex: "Pão, marcenaria" },
  { id: "music",      label: "Música",        ex: "Piano, teoria" },
  { id: "business",   label: "Negócios",      ex: "Negociação, finanças" },
  { id: "language",   label: "Idiomas",       ex: "日本語, Français" },
  { id: "science",    label: "Ciência",       ex: "Estat., biologia" },
  { id: "history",    label: "História",      ex: "Medieval, moderna" },
  { id: "art",        label: "Arte & Design", ex: "Tipo, cor" },
  { id: "health",     label: "Saúde",         ex: "Corrida, sono" },
  { id: "philosophy", label: "Filosofia",     ex: "Stoics, ethics" },
];

const SUGGESTIONS = [
  "Kali Linux",
  "Pão de fermentação",
  "Estatística bayesiana",
  "Marcenaria japonesa",
  "Piano clássico",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [pace, setPace] = useState("30");
  const [days, setDays] = useState(4);
  const [style, setStyle] = useState("mix");
  const [topic, setTopic] = useState("");

  const toggleInterest = (id: string) =>
    setInterests((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const canAdvance = [
    name.trim().length > 0,
    interests.length > 0,
    true,
    topic.trim().length > 0,
  ][step];

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      const prefs: Preferences = { name, interests, pace, days, style, topic };
      localStorage.setItem("viare_onboarding", JSON.stringify(prefs));
      router.push(`/courses/generate?topic=${encodeURIComponent(topic)}`);
    }
  };

  const handleSkip = () => router.push("/courses/generate");

  return (
    <div className="onboarding">
      <header className="onb-chrome">
        <div className="onb-brand">
          <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: "var(--accent)" }}>
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span>Viare</span>
        </div>
        <div className="onb-steps">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`onb-step${i <= step ? " on" : ""}${i === step ? " current" : ""}`}
            />
          ))}
        </div>
        <div className="onb-lang">
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
        </div>
      </header>

      <div className="onb-main">
        <div className="onb-slide">

          {step === 0 && (
            <div>
              <div className="onb-eye">Passo 1 de 4 · Bem-vindo</div>
              <h1 className="onb-h1">Vamos começar com seu nome.</h1>
              <p className="onb-lede">
                Viare é um espaço para o que você decide aprender. Vamos usar seu nome para escrever aulas que falam com você, não para você.
              </p>
              <input
                autoFocus
                className="onb-input big"
                placeholder="Seu primeiro nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAdvance && handleNext()}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="onb-eye">Passo 2 de 4 · Território</div>
              <h1 className="onb-h1">
                Que tipo de coisas <span className="onb-soft">você quer aprender?</span>
              </h1>
              <p className="onb-lede">
                Escolha algumas — isso só ajusta o que sugerimos no seu feed. Você pode aprender qualquer coisa, sempre.
              </p>
              <div className="onb-chips">
                {INTEREST_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    className={`onb-chip${interests.includes(o.id) ? " on" : ""}`}
                    onClick={() => toggleInterest(o.id)}
                  >
                    <div className="oc-label">{o.label}</div>
                    <div className="oc-ex">{o.ex}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="onb-eye">Passo 3 de 4 · Ritmo</div>
              <h1 className="onb-h1">
                Quanto tempo <span className="onb-soft">você pode dedicar?</span>
              </h1>
              <p className="onb-lede">
                Respostas honestas funcionam melhor que ambiciosas. Vamos dimensionar as aulas.
              </p>

              <div className="onb-group">
                <div className="onb-group-label">Por sessão</div>
                <div className="onb-seg">
                  {[
                    { v: "15", l: "15 min" },
                    { v: "30", l: "30 min" },
                    { v: "60", l: "1 h" },
                    { v: "90", l: "1.5 h" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      className={`onb-segbtn${pace === o.v ? " on" : ""}`}
                      onClick={() => setPace(o.v)}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="onb-group">
                <div className="onb-group-label">Dias por semana</div>
                <div className="onb-days">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      className={`onb-day${days === n ? " on" : ""}`}
                      onClick={() => setDays(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="onb-day-hint">
                  {days <= 2 && "Tranquilo — vamos manter leve."}
                  {days >= 3 && days <= 5 && "Constante. É aqui que hábitos se formam."}
                  {days >= 6 && "Intensivo. Progresso rápido e significativo."}
                </div>
              </div>

              <div className="onb-group">
                <div className="onb-group-label">Você aprende melhor com…</div>
                <div className="onb-seg">
                  {[
                    { v: "reading", l: "Leitura" },
                    { v: "doing",   l: "Prática" },
                    { v: "watching",l: "Exemplos" },
                    { v: "mix",     l: "Mistura" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      className={`onb-segbtn${style === o.v ? " on" : ""}`}
                      onClick={() => setStyle(o.v)}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="onb-eye">Passo 4 de 4 · Seu primeiro curso</div>
              <h1 className="onb-h1">
                O que você quer <span className="onb-soft">aprender primeiro?</span>
              </h1>
              <p className="onb-lede">
                Descreva com suas palavras. Quanto mais específico, melhor o currículo. Não se preocupe — você pode mudar, regenerar ou remixar tudo depois.
              </p>
              <textarea
                autoFocus
                className="onb-textarea"
                placeholder="ex: Kali Linux para iniciante que quer um lab de pentest em casa"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <div className="onb-suggest">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="onb-suggest-chip" onClick={() => setTopic(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="onb-preview">
                <div className="op-label">Prévia</div>
                <div className="op-card">
                  <div className="op-visual" />
                  <div className="op-body">
                    <div className="op-title">{topic || "Seu primeiro curso"}</div>
                    <div className="op-meta">
                      {name && `${name} · `}
                      {pace} min × {days} dias/sem
                      {interests.length > 0 && ` · ${interests.length} tópicos`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <footer className="onb-foot">
        <button
          className="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ← Voltar
        </button>
        <div className="onb-foot-spacer" />
        {step < 3 && (
          <button className="ghost" onClick={handleSkip}>
            Pular por enquanto
          </button>
        )}
        <button className="primary" onClick={handleNext} disabled={!canAdvance}>
          {step === 3 ? "Gerar meu primeiro curso →" : "Continuar →"}
        </button>
      </footer>
    </div>
  );
}
