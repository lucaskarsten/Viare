"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = 4;

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

const SUGGESTIONS = ["Kali Linux", "Piano", "Pão artesanal"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [pace, setPace] = useState("Moderado");
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [style, setStyle] = useState("Misto");
  const [topic, setTopic] = useState("");

  const toggleInterest = (id: string) =>
    setInterests((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleDay = (i: number) =>
    setDays((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const handleFinish = () => {
    const prefs = { name, interests, pace, days, style, topic };
    try {
      localStorage.setItem("viare_onboarding", JSON.stringify(prefs));
    } catch {
      // localStorage unavailable, continue anyway
    }
    router.push(`/courses/generate?topic=${encodeURIComponent(topic)}`);
  };

  const isPrimaryDisabled =
    (step === 0 && !name.trim()) || (step === 3 && !topic.trim());

  return (
    <div className="onboarding">
      {/* Header */}
      <div className="onb-chrome">
        <div className="onb-brand">
          <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: "var(--vr-accent)" }}>
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          Viare
        </div>
        <div className="onb-steps">
          {Array(STEPS).fill(0).map((_, i) => (
            <div
              key={i}
              className={`onb-step${i < step ? " on" : i === step ? " current" : ""}`}
            />
          ))}
        </div>
        <div className="onb-lang">
          <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
      </div>

      {/* Main content */}
      <div className="onb-main">
        <div className="onb-slide" key={step}>

          {step === 0 && (
            <>
              <div className="onb-eye">PASSO 1 DE 4</div>
              <h1 className="onb-h1">
                Olá! <span className="onb-soft">Como você se chama?</span>
              </h1>
              <p className="onb-lede">Seu nome personaliza a experiência de aprendizado.</p>
              <input
                autoFocus
                className="onb-input big"
                placeholder="Seu nome..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isPrimaryDisabled && setStep((s) => s + 1)}
              />
            </>
          )}

          {step === 1 && (
            <>
              <div className="onb-eye">PASSO 2 DE 4</div>
              <h1 className="onb-h1">
                O que te <span className="onb-soft">interessa?</span>
              </h1>
              <p className="onb-lede">Escolha quantas áreas quiser.</p>
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
            </>
          )}

          {step === 2 && (
            <>
              <div className="onb-eye">PASSO 3 DE 4</div>
              <h1 className="onb-h1">
                Como você <span className="onb-soft">aprende?</span>
              </h1>
              <div className="onb-group">
                <div className="onb-group-label">RITMO</div>
                <div className="onb-seg">
                  {["Casual", "Moderado", "Intenso"].map((p) => (
                    <button
                      key={p}
                      className={`onb-segbtn${pace === p ? " on" : ""}`}
                      onClick={() => setPace(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="onb-group">
                <div className="onb-group-label">DIAS POR SEMANA</div>
                <div className="onb-days">
                  {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                    <button
                      key={i}
                      className={`onb-day${days.includes(i) ? " on" : ""}`}
                      onClick={() => toggleDay(i)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="onb-day-hint">{days.length} dias selecionados</p>
              </div>
              <div className="onb-group">
                <div className="onb-group-label">ESTILO</div>
                <div className="onb-seg">
                  {["Leitura", "Misto", "Prático"].map((s) => (
                    <button
                      key={s}
                      className={`onb-segbtn${style === s ? " on" : ""}`}
                      onClick={() => setStyle(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="onb-eye">PASSO 4 DE 4</div>
              <h1 className="onb-h1">
                Qual será seu <span className="onb-soft">primeiro curso?</span>
              </h1>
              <p className="onb-lede">
                Digite um tema e a IA vai criar um currículo personalizado.
              </p>
              <textarea
                autoFocus
                className="onb-textarea"
                placeholder="Ex: Segurança de redes, cozinha italiana..."
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
              {topic && (
                <div className="onb-preview">
                  <div className="op-label">PRÉVIA</div>
                  <div className="op-card">
                    <div className="op-visual" />
                    <div>
                      <div className="op-title">{topic}</div>
                      <div className="op-meta">
                        {pace} · {days.length}× semana · {style}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="onb-foot">
        <button
          className="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ← Voltar
        </button>
        <div className="onb-foot-spacer" />
        {step < STEPS - 1 && (
          <button className="ghost" onClick={() => setStep((s) => s + 1)}>
            Pular
          </button>
        )}
        <button
          className="primary"
          onClick={step < STEPS - 1 ? () => setStep((s) => s + 1) : handleFinish}
          disabled={isPrimaryDisabled}
        >
          {step < STEPS - 1 ? "Continuar →" : "Começar agora →"}
        </button>
      </div>
    </div>
  );
}
