import Link from "next/link";
import { Shield, Zap, Target, Award } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Viare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
              Cursos
            </Link>
            <Link
              href="/login"
              className="text-sm rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-yellow-500" />
          Aprenda fazendo, não só lendo
        </div>
        <h1 className="text-5xl font-bold tracking-tight max-w-3xl mx-auto">
          Domine Kali Linux e{" "}
          <span className="text-primary">Cybersecurity</span> na prática
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trilhas interativas com labs reais, desafios CTF e projetos guiados.
          Para devs que querem entrar no mundo da segurança.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
          >
            Começar grátis
          </Link>
          <Link
            href="/courses"
            className="rounded-md border px-6 py-3 font-medium hover:bg-accent transition-colors"
          >
            Ver cursos
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Target,
              title: "Labs CTF",
              desc: "Desafios práticos estilo Capture the Flag com validação automática de flags.",
            },
            {
              icon: Zap,
              title: "Projetos guiados",
              desc: "Construa projetos reais passo a passo com objetivos claros e feedback imediato.",
            },
            {
              icon: Award,
              title: "Badges & Streaks",
              desc: "Mantenha a consistência com streaks diários e conquiste badges por marcos alcançados.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 space-y-3">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
