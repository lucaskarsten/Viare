"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  courseAccentColor,
  formatLearners,
  formatDuration,
  displayLetter,
} from "@/lib/catalog";

type DbCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  estimatedHours: number | null;
  totalEnrollments: number;
  category: string;
  lessonCount: number;
};

type AdaptedCourse = DbCourse & {
  cat: string;
  color: string;
  letter: string;
  learnersStr: string;
  durationStr: string;
};

const CATEGORIES = [
  { id: "all", label: "Todos", title: "", desc: "" },
  { id: "tech", label: "Tech", title: "Tecnologia & engenharia", desc: "Da primeira linha de código a machine learning. Cursos práticos, projetos reais, sem enrolação." },
  { id: "lang", label: "Línguas", title: "Línguas", desc: "Fale desde o primeiro dia. Cada curso vem com várias versões de língua-fonte." },
  { id: "music", label: "Música", title: "Música", desc: "Do primeiro acorde à teoria que você sente. Exemplos em áudio em todas as aulas." },
  { id: "craft", label: "Cozinha & ofícios", title: "Cozinha & ofícios", desc: "Física e técnica antes da receita. Coisas que você faz com as mãos." },
  { id: "science", label: "Ciências", title: "Ciências & matemática", desc: "Explicações pela intuição pra aquelas coisas que você lembra pela metade da escola." },
  { id: "life", label: "Vida", title: "Vida & artes do pensar", desc: "Negociação, xadrez, desenho, escrita — habilidades que rendem por décadas." },
];

const CAT_LABELS: Record<string, string> = {
  tech: "Tech", lang: "Idioma", music: "Música", craft: "Ofício", science: "Ciência", life: "Vida",
};

function adaptCourse(c: DbCourse): AdaptedCourse {
  return {
    ...c,
    cat: c.category.toLowerCase(),
    color: courseAccentColor(c.id),
    letter: displayLetter(c.title),
    learnersStr: formatLearners(c.totalEnrollments),
    durationStr: formatDuration(c.estimatedHours),
  };
}

export default function CatalogClient({ courses }: { courses: DbCourse[] }) {
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  const adapted = useMemo(() => courses.map(adaptCourse), [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adapted.filter((c) => {
      if (activeCat !== "all" && c.cat !== activeCat) return false;
      if (q && !(c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [activeCat, query, adapted]);

  const grouped = useMemo(() => {
    const groups: Record<string, AdaptedCourse[]> = {};
    filtered.forEach((c) => {
      if (!groups[c.cat]) groups[c.cat] = [];
      groups[c.cat].push(c);
    });
    return groups;
  }, [filtered]);

  const totalLearners = useMemo(
    () => courses.reduce((s, c) => s + c.totalEnrollments, 0),
    [courses]
  );

  return (
    <>
      <header className="flex items-end justify-between gap-8 pb-6 border-b border-border mb-10 flex-wrap">
        <div>
          <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted-foreground mb-3">
            Catálogo · {courses.length} cursos
          </div>
          <h1 className="font-medium text-[36px] leading-[1.15] tracking-[-0.02em] m-0 text-balance text-foreground">
            <em className="not-italic text-muted-foreground font-normal">Aprenda qualquer coisa.</em> Comece por esses.
          </h1>
          <p className="text-[15px] leading-[1.6] text-muted-foreground mt-3.5 max-w-[60ch] text-pretty m-0">
            Cursos em múltiplos domínios — grátis para sempre. Adicione qualquer um à sua biblioteca, ou faça um remix pessoal com IA.
          </p>
        </div>
        <div className="flex gap-8 font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
          <div>
            <strong className="block font-sans text-[28px] font-normal text-foreground tracking-[-0.02em] normal-case leading-none mb-1">{courses.length}</strong>
            cursos
          </div>
          <div>
            <strong className="block font-sans text-[28px] font-normal text-foreground tracking-[-0.02em] normal-case leading-none mb-1">{formatLearners(totalLearners)}</strong>
            alunos
          </div>
        </div>
      </header>

      <div className="mb-8 py-4 px-5 bg-accent/8 border-l-[3px] border-accent rounded flex items-center gap-4">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-accent font-semibold shrink-0">Grátis sempre</span>
        <p className="text-[13px] text-muted-foreground leading-[1.5] flex-1 m-0">
          Esses cursos são grátis — sempre. Adicione à biblioteca do jeito que estão, ou faça um remix que você edita, traduz e expande.{" "}
          <strong className="text-foreground font-semibold">Gerar algo que não está aqui? Também é sempre opção.</strong>
        </p>
        <Link
          href="/courses/generate"
          className="text-muted-foreground text-[12px] px-2 py-1 rounded no-underline inline-flex items-center transition-colors hover:text-foreground hover:bg-card shrink-0"
        >
          + Gerar
        </Link>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-8 pb-5 border-b border-dashed border-border items-center">
        {CATEGORIES.map((cat) => {
          const count = cat.id === "all"
            ? adapted.length
            : adapted.filter((c) => c.cat === cat.id).length;
          const isActive = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              className={`text-[13px] px-3 py-1.5 border rounded-full cursor-pointer transition-all${
                isActive
                  ? " bg-foreground text-background border-foreground"
                  : " bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.label}
              <span className={`font-mono text-[10px] ml-1${isActive ? " text-background opacity-60" : " text-muted-foreground opacity-80"}`}>
                {count}
              </span>
            </button>
          );
        })}
        <input
          className="ml-auto text-[13px] px-3.5 py-1.5 bg-card border border-transparent rounded-full min-w-[240px] text-foreground outline-none focus:border-muted-foreground focus:bg-background placeholder:text-muted-foreground"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no catálogo…"
        />
      </div>

      {adapted.length === 0 ? (
        <div className="py-20 px-10 text-center text-muted-foreground italic">
          Nenhum curso publicado ainda.{" "}
          <Link href="/courses/generate">Gere o primeiro aqui.</Link>
        </div>
      ) : activeCat === "all" ? (
        CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
          const items = grouped[cat.id] ?? [];
          if (items.length === 0) return null;
          return (
            <section key={cat.id} className="mb-14">
              <CatalogSectionHead title={cat.title} count={items.length} desc={cat.desc} />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
                {items.map((c) => <CatalogCard key={c.id} course={c} />)}
              </div>
            </section>
          );
        })
      ) : (
        <CatalogSection
          cat={CATEGORIES.find((c) => c.id === activeCat)!}
          items={filtered}
        />
      )}
    </>
  );
}

function CatalogSectionHead({ title, count, desc }: { title: string; count: number; desc: string }) {
  return (
    <>
      <div className="flex items-baseline gap-4 mb-4 pb-2.5 border-b border-border">
        <h2 className="text-[22px] tracking-[-0.02em] m-0 font-normal text-foreground">{title}</h2>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground ml-auto">{count} cursos</span>
      </div>
      <p className="text-muted-foreground text-[14px] leading-[1.55] max-w-[64ch] -mt-2 mb-5 m-0">{desc}</p>
    </>
  );
}

function CatalogSection({
  cat,
  items,
}: {
  cat: (typeof CATEGORIES)[number];
  items: AdaptedCourse[];
}) {
  return (
    <section className="mb-14">
      <CatalogSectionHead title={cat.title} count={items.length} desc={cat.desc} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
        {items.map((c) => <CatalogCard key={c.id} course={c} />)}
      </div>
      {items.length === 0 && (
        <div className="py-10 text-center text-muted-foreground italic">
          Nenhum curso corresponde à sua busca. Tente outra palavra ou{" "}
          <Link href="/courses/generate">gere um novo</Link>.
        </div>
      )}
    </section>
  );
}

function CatalogCard({ course }: { course: AdaptedCourse }) {
  return (
    <article className="group flex flex-col bg-background border border-border rounded-[var(--radius-lg)] overflow-hidden cursor-pointer transition-all text-left text-foreground relative hover:-translate-y-[3px] hover:border-foreground hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.15)]">
      <div className="h-20 relative overflow-hidden" style={{ background: course.color }}>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0_6px,transparent_6px_14px)]" />
        <span className="absolute top-2.5 left-3 font-mono text-[9px] tracking-[0.1em] uppercase text-white/90 bg-black/20 px-2 py-[3px] rounded-[3px] backdrop-blur-sm">
          {CAT_LABELS[course.cat] ?? course.cat}
        </span>
        <span className="absolute top-2.5 right-3 font-mono text-[9px] tracking-[0.1em] uppercase bg-background text-foreground px-2 py-[3px] rounded-[3px] font-semibold border border-white/40">
          grátis
        </span>
        <span className="absolute right-3.5 -bottom-3.5 text-[72px] text-white/30 leading-none tracking-[-0.04em] font-normal select-none">
          {course.letter}
        </span>
      </div>
      <div className="px-[18px] pt-4 pb-[18px] flex flex-col gap-2.5 flex-1">
        <h3 className="text-[17px] tracking-[-0.015em] font-medium leading-[1.2] m-0 text-foreground">{course.title}</h3>
        <p className="text-[13px] text-muted-foreground leading-[1.5] flex-1 m-0">{course.description}</p>
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.04em] text-muted-foreground pt-2.5 border-t border-dashed border-border">
          <span className="before:content-['●'] before:text-[#6a8d5c] before:mr-1 before:text-[8px] before:align-middle">
            {course.learnersStr}
          </span>
          {course.lessonCount > 0 && <span>· {course.lessonCount} aulas</span>}
          <span>· {course.durationStr}</span>
        </div>
      </div>
      <div className="flex gap-1.5 px-[18px] pb-3.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href={`/courses/${course.slug}`}
          className="flex-1 text-[12px] px-2.5 py-1.5 bg-foreground text-background border border-transparent rounded cursor-pointer text-center no-underline inline-flex items-center justify-center hover:opacity-85"
        >
          + Adicionar
        </Link>
        <button className="flex-1 text-[12px] px-2.5 py-1.5 bg-card border border-transparent rounded cursor-pointer text-foreground text-center inline-flex items-center justify-center hover:bg-muted">
          ⑂ Remix
        </button>
      </div>
    </article>
  );
}
