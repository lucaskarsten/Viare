"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  topicToCategory,
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
  topic: string;
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
    cat: topicToCategory(c.topic),
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
      <header className="page-head catalog-head">
        <div>
          <div className="eyebrow">Catálogo · {courses.length} cursos</div>
          <h1 className="h1">
            <em>Aprenda qualquer coisa.</em> Comece por esses.
          </h1>
          <p className="lede">
            Cursos em múltiplos domínios — grátis para sempre. Adicione qualquer um à sua biblioteca, ou faça um remix pessoal com IA.
          </p>
        </div>
        <div className="catalog-stats">
          <div><strong>{courses.length}</strong> cursos</div>
          <div><strong>{formatLearners(totalLearners)}</strong> alunos</div>
        </div>
      </header>

      <div className="catalog-banner">
        <span className="catalog-banner-eye">Grátis sempre</span>
        <div className="catalog-banner-text">
          Esses cursos são grátis — sempre. Adicione à biblioteca do jeito que estão, ou faça um remix que você edita, traduz e expande.{" "}
          <strong>Gerar algo que não está aqui? Também é sempre opção.</strong>
        </div>
        <Link href="/courses/generate" className="ghost small">+ Gerar</Link>
      </div>

      <div className="catalog-filters">
        {CATEGORIES.map((cat) => {
          const count = cat.id === "all"
            ? adapted.length
            : adapted.filter((c) => c.cat === cat.id).length;
          return (
            <button
              key={cat.id}
              className={`catalog-filter${activeCat === cat.id ? " on" : ""}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.label}
              <span className="catalog-filter-count">{count}</span>
            </button>
          );
        })}
        <input
          className="catalog-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no catálogo…"
        />
      </div>

      {adapted.length === 0 ? (
        <div style={{ padding: "80px 40px", textAlign: "center", color: "var(--ink-4)", fontStyle: "italic" }}>
          Nenhum curso publicado ainda.{" "}
          <Link href="/courses/generate">Gere o primeiro aqui.</Link>
        </div>
      ) : activeCat === "all" ? (
        CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
          const items = grouped[cat.id] ?? [];
          if (items.length === 0) return null;
          return (
            <section key={cat.id} className="catalog-section">
              <div className="catalog-section-head">
                <h2>{cat.title}</h2>
                <span className="catalog-section-meta">{items.length} cursos</span>
              </div>
              <p className="catalog-section-desc">{cat.desc}</p>
              <div className="catalog-grid">
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

function CatalogSection({
  cat,
  items,
}: {
  cat: (typeof CATEGORIES)[number];
  items: AdaptedCourse[];
}) {
  return (
    <section className="catalog-section">
      <div className="catalog-section-head">
        <h2>{cat.title}</h2>
        <span className="catalog-section-meta">{items.length} cursos</span>
      </div>
      <p className="catalog-section-desc">{cat.desc}</p>
      <div className="catalog-grid">
        {items.map((c) => <CatalogCard key={c.id} course={c} />)}
      </div>
      {items.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-4)", fontStyle: "italic" }}>
          Nenhum curso corresponde à sua busca. Tente outra palavra ou{" "}
          <Link href="/courses/generate">gere um novo</Link>.
        </div>
      )}
    </section>
  );
}

function CatalogCard({ course }: { course: AdaptedCourse }) {
  return (
    <article className="ccard">
      <div
        className="ccard-top"
        style={{ "--accent": course.color, background: course.color } as React.CSSProperties}
      >
        <span className="ccard-tag">{CAT_LABELS[course.cat] ?? course.cat}</span>
        <span className="ccard-free-badge">grátis</span>
        <span className="ccard-big-letter">{course.letter}</span>
      </div>
      <div className="ccard-body">
        <h3 className="ccard-title">{course.title}</h3>
        <p className="ccard-desc">{course.description}</p>
        <div className="ccard-meta">
          <div className="ccard-meta-left">
            <span className="ccard-learners">{course.learnersStr}</span>
            {course.lessonCount > 0 && <span>· {course.lessonCount} aulas</span>}
            <span>· {course.durationStr}</span>
          </div>
        </div>
      </div>
      <div className="ccard-actions">
        <Link href={`/courses/${course.slug}`} className="ccard-action primary">
          + Adicionar
        </Link>
        <button className="ccard-action">⑂ Remix</button>
      </div>
    </article>
  );
}
