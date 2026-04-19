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
  { id: "tech", label: "Tecnologia", ex: "Kali, Rust, ML" },
  { id: "craft", label: "Ofícios", ex: "Pão, marcenaria" },
  { id: "music", label: "Música", ex: "Piano, teoria" },
  { id: "business", label: "Negócios", ex: "Negociação, finanças" },
  { id: "language", label: "Idiomas", ex: "日本語, Français" },
  { id: "science", label: "Ciência", ex: "Estat., biologia" },
  { id: "history", label: "História", ex: "Medieval, moderna" },
  { id: "art", label: "Arte & Design", ex: "Tipo, cor" },
  { id: "health", label: "Saúde", ex: "Corrida, sono" },
  { id: "philosophy", label: "Filosofia", ex: "Stoics, ethics" },
];

const SUGGESTIONS = ["Kali Linux", "Pão de fermentação", "Estatística bayesiana", "Marcenaria japonesa", "Piano clássico"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [pace, setPace] = useState("30");
  const [days, setDays] = useState(4);
  const [style, setStyle] = useState("mix");
  const [topic, setTopic] = useState("");

  const toggleInterest = (id: string) =>
    setInterests(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const canAdvance = [
    name.trim().length > 0,
    interests.length > 0,
    true,
    topic.trim().length > 0,
  ][step];

  const next = () => {
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      const prefs: Preferences = { name, interests, pace, days, style, topic };
      localStorage.setItem("viare_onboarding", JSON.stringify(prefs));
      router.push(`/courses/generate?topic=${encodeURIComponent(topic)}`);
    }
  };

  const skip = () => {
    router.push("/courses/generate");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with step dots */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="18" height="18" style={{ color: "var(--accent)" }}>
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span className="font-semibold text-[15px]">Viare</span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-border"}`} />
          ))}
        </div>
        <div className="w-16" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {step === 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Passo 1 de 4 · Bem-vindo</p>
              <h1 className="text-[32px] font-medium tracking-tight mb-3">Vamos começar com seu nome.</h1>
              <p className="text-muted-foreground text-[15px] mb-8">Viare é um espaço para o que você decide aprender. Vamos usar seu nome para escrever aulas que falam com você.</p>
              <input
                autoFocus
                className="w-full text-[20px] bg-transparent border-b-2 border-border focus:border-accent outline-none py-2 transition-colors"
                placeholder="Seu primeiro nome"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canAdvance && next()}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Passo 2 de 4 · Território</p>
              <h1 className="text-[32px] font-medium tracking-tight mb-3">Que tipo de coisas <span className="text-muted-foreground">você quer aprender?</span></h1>
              <p className="text-muted-foreground text-[15px] mb-8">Escolha algumas — isso só ajusta o que sugerimos. Você pode aprender qualquer coisa, sempre.</p>
              <div className="grid grid-cols-2 gap-2">
                {INTEREST_OPTIONS.map(o => (
                  <button
                    key={o.id}
                    onClick={() => toggleInterest(o.id)}
                    className={`text-left px-4 py-3 rounded-lg border transition-colors ${interests.includes(o.id) ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-muted-foreground/40"}`}
                  >
                    <div className="font-medium text-[14px]">{o.label}</div>
                    <div className="text-[12px] text-muted-foreground">{o.ex}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Passo 3 de 4 · Ritmo</p>
              <h1 className="text-[32px] font-medium tracking-tight mb-3">Quanto tempo <span className="text-muted-foreground">você pode dedicar?</span></h1>
              <p className="text-muted-foreground text-[15px] mb-8">Respostas honestas funcionam melhor que ambiciosas.</p>

              <div className="mb-6">
                <div className="text-[12px] text-muted-foreground font-medium mb-2">Por sessão</div>
                <div className="flex gap-2">
                  {[{ v: "15", l: "15 min" }, { v: "30", l: "30 min" }, { v: "60", l: "1 h" }, { v: "90", l: "1.5 h" }].map(o => (
                    <button key={o.v} onClick={() => setPace(o.v)} className={`flex-1 py-2 rounded border text-[13px] transition-colors ${pace === o.v ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-muted-foreground/40"}`}>{o.l}</button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-[12px] text-muted-foreground font-medium mb-2">Dias por semana</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <button key={n} onClick={() => setDays(n)} className={`w-9 h-9 rounded-full border text-[13px] transition-colors ${days === n ? "border-accent bg-accent text-white" : "border-border hover:border-muted-foreground/40"}`}>{n}</button>
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground mt-2">
                  {days <= 2 ? "Tranquilo — vamos manter leve." : days <= 5 ? "Constante. É aqui que hábitos se formam." : "Intensivo. Progresso rápido e significativo."}
                </p>
              </div>

              <div>
                <div className="text-[12px] text-muted-foreground font-medium mb-2">Você aprende melhor com…</div>
                <div className="flex gap-2">
                  {[{ v: "reading", l: "Leitura" }, { v: "doing", l: "Prática" }, { v: "watching", l: "Exemplos" }, { v: "mix", l: "Mistura" }].map(o => (
                    <button key={o.v} onClick={() => setStyle(o.v)} className={`flex-1 py-2 rounded border text-[13px] transition-colors ${style === o.v ? "border-accent bg-accent/5 text-accent" : "border-border hover:border-muted-foreground/40"}`}>{o.l}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Passo 4 de 4 · Seu primeiro curso</p>
              <h1 className="text-[32px] font-medium tracking-tight mb-3">O que você quer <span className="text-muted-foreground">aprender primeiro?</span></h1>
              <p className="text-muted-foreground text-[15px] mb-6">Descreva com suas palavras. Quanto mais específico, melhor o currículo.</p>
              <textarea
                autoFocus
                className="w-full bg-card border border-border rounded-lg p-4 text-[15px] outline-none focus:border-accent transition-colors resize-none min-h-24"
                placeholder="ex: Kali Linux para iniciante que quer um lab de pentest em casa"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setTopic(s)} className="text-[12px] px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">{s}</button>
                ))}
              </div>
              {topic && (
                <div className="mt-6 p-4 rounded-lg border bg-card flex gap-4">
                  <div className="w-16 h-12 rounded bg-accent/20 shrink-0" />
                  <div>
                    <div className="font-medium text-[15px]">{topic}</div>
                    <div className="text-[12px] text-muted-foreground mt-1">
                      {name && `${name} · `}{pace} min × {days} dias/sem
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer nav */}
      <footer className="flex items-center gap-3 px-6 py-4 border-t border-border">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-[13px] text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors"
        >
          ← Voltar
        </button>
        <div className="flex-1" />
        {step < 3 && (
          <button onClick={skip} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Pular por enquanto
          </button>
        )}
        <button
          onClick={next}
          disabled={!canAdvance}
          className="px-4 py-2 bg-foreground text-background rounded text-[13px] font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {step === 3 ? "Gerar meu primeiro curso →" : "Continuar →"}
        </button>
      </footer>
    </div>
  );
}
