"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimatedHours: number | null;
  totalEnrollments: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

type CatalogEntry = {
  id: string;
  cat: string;
  title: string;
  color: string;
  desc: string;
  duration: string;
  lessons: number;
  learners: string;
  langs: string[];
  letter: string;
};

const CAT_LABELS: Record<string, string> = {
  tech: "Tech",
  lang: "Idioma",
  music: "Música",
  craft: "Ofício",
  science: "Ciência",
  life: "Vida",
};

const CATALOG: CatalogEntry[] = [
  // Technology
  { id: "python", cat: "tech", title: "Python, from zero", color: "#4f7cac", desc: "De variáveis a web scrapers em 22 aulas. Sem código prévio.", duration: "~14h", lessons: 22, learners: "48.2k", langs: ["EN","PT","ES","FR","DE","JA","ZH"], letter: "Py" },
  { id: "kali", cat: "tech", title: "Kali Linux", color: "#c97a4a", desc: "Segurança ofensiva, do primeiro boot a um lab completo em casa.", duration: "~9h", lessons: 18, learners: "12.4k", langs: ["EN","PT","ES"], letter: "Ka" },
  { id: "rust", cat: "tech", title: "Rust ownership", color: "#a04a3a", desc: "Borrow checker, lifetimes e por que você nunca mais vai temer um segfault.", duration: "~11h", lessons: 16, learners: "8.1k", langs: ["EN","DE"], letter: "Rs" },
  { id: "sql", cat: "tech", title: "SQL, real world", color: "#5a7a6a", desc: "Joins, window functions e query planning. Ensinado com um dataset real.", duration: "~7h", lessons: 14, learners: "31.5k", langs: ["EN","PT","ES","FR"], letter: "SQ" },
  { id: "ml", cat: "tech", title: "Machine learning, honestamente", color: "#6a5a8a", desc: "O que gradient descent realmente faz. O que um transformer realmente é. Sem hype.", duration: "~16h", lessons: 24, learners: "22.8k", langs: ["EN","PT","ES","FR","DE","JA","ZH","IT"], letter: "ML" },
  { id: "react", cat: "tech", title: "React, from first principles", color: "#4a8a9a", desc: "Estado, efeitos e o modelo mental. Construa três apps de verdade.", duration: "~12h", lessons: 20, learners: "38.9k", langs: ["EN","PT","ES","JA"], letter: "Rx" },
  // Languages
  { id: "en-convo", cat: "lang", title: "Inglês conversacional", color: "#3a6a9a", desc: "As 800 palavras que sustentam 80% da conversa diária. Fale desde o dia 1.", duration: "~20h", lessons: 40, learners: "210k", langs: ["PT","ES","FR","DE","JA","ZH","IT"], letter: "En" },
  { id: "japanese", cat: "lang", title: "Japonês · hiragana às primeiras frases", color: "#b04a5a", desc: "Três alfabetos, as partículas e como funciona a ordem das frases.", duration: "~28h", lessons: 48, learners: "67.3k", langs: ["EN","PT","ES","FR","DE"], letter: "日" },
  { id: "spanish", cat: "lang", title: "Espanhol, trilha imersiva", color: "#d4883a", desc: "Sem explicações em inglês depois da aula 3. Conjugações pelo contexto.", duration: "~22h", lessons: 36, learners: "94.1k", langs: ["EN","PT","FR","IT"], letter: "Es" },
  { id: "french", cat: "lang", title: "Francês, devagar e certeiro", color: "#5a6aa4", desc: "Pronúncia primeiro. Na terceira semana, você vai ter o que dizer e como dizer.", duration: "~24h", lessons: 40, learners: "56.7k", langs: ["EN","PT","ES","DE","IT"], letter: "Fr" },
  { id: "mandarin", cat: "lang", title: "Mandarim, tons e tudo mais", color: "#a63a3a", desc: "Pinyin, tons e seus primeiros 300 caracteres. Feito pra iniciantes reais.", duration: "~30h", lessons: 50, learners: "42.6k", langs: ["EN","PT","ES","JA"], letter: "中" },
  // Music
  { id: "piano", cat: "music", title: "Piano clássico · três primeiras peças", color: "#6b7a8f", desc: "Leitura, escalas e o prelúdio de Bach que você não imaginava tocar.", duration: "~18h", lessons: 24, learners: "28.4k", langs: ["EN","PT","DE","FR"], letter: "♪" },
  { id: "guitar", cat: "music", title: "Violão, fingerstyle do zero", color: "#8a6a4a", desc: "Seis padrões que destravam a maior parte do folk. Sem palheta, sem tab, sem medo.", duration: "~15h", lessons: 22, learners: "51.2k", langs: ["EN","PT","ES"], letter: "♫" },
  { id: "music-theory", cat: "music", title: "Teoria musical, para ouvintes", color: "#5a7a8a", desc: "Por que canções tristes soam tristes. Tons, modos e como a harmonia faz sentido.", duration: "~8h", lessons: 16, learners: "18.9k", langs: ["EN","PT","ES","FR","DE"], letter: "♭" },
  { id: "producing", cat: "music", title: "Produtor de quarto, básico", color: "#6a5a8a", desc: "Sua primeira batida, mixada e masterizada, com ferramentas grátis que você já tem.", duration: "~10h", lessons: 18, learners: "14.3k", langs: ["EN","PT","ES"], letter: "🎛" },
  // Cooking & craft
  { id: "bread", cat: "craft", title: "Pão & fermentação natural", color: "#8a9a5b", desc: "Do fermento à laminação, tempo e crosta. A física antes da receita.", duration: "~9h", lessons: 12, learners: "39.8k", langs: ["EN","PT","FR","IT"], letter: "Pã" },
  { id: "knife", cat: "craft", title: "Habilidades com faca", color: "#6a7a6a", desc: "Pegada, tábua e os seis cortes que todo cozinheiro de casa usa.", duration: "~4h", lessons: 8, learners: "72.4k", langs: ["EN","PT","ES","FR","IT","JA"], letter: "Fa" },
  { id: "pasta", cat: "craft", title: "Massa à mão", color: "#c4a04a", desc: "Massa com ovo, massa com semolina e as dez formas que você faz hoje.", duration: "~6h", lessons: 10, learners: "44.1k", langs: ["EN","PT","ES","IT","FR"], letter: "Mа" },
  { id: "joinery", cat: "craft", title: "Marcenaria japonesa", color: "#8a6a4a", desc: "Só ferramenta manual. Seis encaixes que ergueram templos. Você vai fazer um.", duration: "~12h", lessons: 16, learners: "6.8k", langs: ["EN","JA","DE"], letter: "木" },
  { id: "coffee", cat: "craft", title: "Café, de verdade", color: "#7a5a4a", desc: "Extração, moagem e por que sua água importa mais que seu grão.", duration: "~5h", lessons: 10, learners: "33.5k", langs: ["EN","PT","ES","IT"], letter: "Co" },
  // Science & math
  { id: "stats", cat: "science", title: "Estatística bayesiana, intuição antes", color: "#5a6a8a", desc: "Prior, likelihood, posterior — as três palavras, a imagem, toda a ideia.", duration: "~11h", lessons: 18, learners: "15.7k", langs: ["EN","PT","ES","DE"], letter: "P(" },
  { id: "linear", cat: "science", title: "Álgebra linear, visualizada", color: "#6a7a9a", desc: "Vetores, matrizes, autovetores — enfim explicados com imagens em movimento.", duration: "~13h", lessons: 22, learners: "19.2k", langs: ["EN","PT","ES","FR","DE"], letter: "Ax" },
  { id: "astro", cat: "science", title: "Astronomia a olho nu", color: "#3a4a6a", desc: "O que tem lá em cima hoje. Estrelas, constelações, movimento planetário e o porquê.", duration: "~6h", lessons: 12, learners: "21.4k", langs: ["EN","PT","ES","FR","DE","IT","JA"], letter: "☉" },
  { id: "bio", cat: "science", title: "Como as células realmente funcionam", color: "#6a8a5a", desc: "De membranas a metabolismo. A máquina silenciosa que move tudo que vive.", duration: "~10h", lessons: 16, learners: "11.9k", langs: ["EN","PT","ES"], letter: "🧬" },
  // Life & Business
  { id: "negotiation", cat: "life", title: "Negociação", color: "#b8a06e", desc: "Empatia tática, enquadramento e poder de recusa. Dez cenários, dez ferramentas.", duration: "~6h", lessons: 9, learners: "26.3k", langs: ["EN","PT","ES","FR"], letter: "☯" },
  { id: "chess", cat: "life", title: "Aberturas de xadrez que vencem", color: "#4a4a4a", desc: "Três aberturas, profundamente — não doze, rasas. A Caro-Kann basta.", duration: "~8h", lessons: 14, learners: "34.8k", langs: ["EN","PT","ES","DE","RU"], letter: "♞" },
  { id: "drawing", cat: "life", title: "Desenho, se você acha que não consegue", color: "#7a6a5a", desc: "Contorno, gesto e por que ver é a parte que ninguém ensina.", duration: "~9h", lessons: 16, learners: "58.6k", langs: ["EN","PT","ES","FR","IT"], letter: "✎" },
  { id: "writing", cat: "life", title: "Escrever com clareza", color: "#5a5a5a", desc: "Frases curtas. Voz ativa. Os doze cortes que salvam 80% dos rascunhos ruins.", duration: "~5h", lessons: 10, learners: "41.7k", langs: ["EN","PT","ES","FR","DE"], letter: "ℓ" },
  { id: "meditation", cat: "life", title: "Meditação, sem enrolação", color: "#5a7a7a", desc: "O que a prática é, o que não é, e como fazer oito minutos por dia.", duration: "~3h", lessons: 8, learners: "83.2k", langs: ["EN","PT","ES","FR","DE","JA"], letter: "〇" },
  { id: "typography", cat: "life", title: "Introdução à tipografia", color: "#3a3a3a", desc: "Por que Helvética não é neutra. Anatomia de uma letra. Tipografia como pensamento.", duration: "~7h", lessons: 12, learners: "17.8k", langs: ["EN","PT","ES","DE","IT"], letter: "Aa" },
];

const CATEGORIES = [
  { id: "all",     label: "Todos" },
  { id: "tech",    label: "Tech",              title: "Tecnologia & engenharia",     desc: "Da primeira linha de código a machine learning. Cursos práticos, projetos reais, sem enrolação." },
  { id: "lang",    label: "Línguas",           title: "Línguas",                      desc: "Fale desde o primeiro dia. Cada curso vem com várias versões de língua-fonte." },
  { id: "music",   label: "Música",            title: "Música",                       desc: "Do primeiro acorde à teoria que você sente. Exemplos em áudio em todas as aulas." },
  { id: "craft",   label: "Cozinha & ofícios", title: "Cozinha & ofícios",            desc: "Física e técnica antes da receita. Coisas que você faz com as mãos." },
  { id: "science", label: "Ciências",          title: "Ciências & matemática",        desc: "Explicações pela intuição pra aquelas coisas que você lembra pela metade da escola." },
  { id: "life",    label: "Vida",              title: "Vida & artes do pensar",       desc: "Negociação, xadrez, desenho, escrita — habilidades que rendem por décadas." },
];

// Merge DB courses into CATALOG: enrich CATALOG entries with real slug from DB where slug matches id
function mergeCourses(dbCourses: CatalogCourse[]): (CatalogEntry & { slug: string })[] {
  return CATALOG.map((entry) => {
    const match = dbCourses.find(
      (c) => c.slug === entry.id || c.slug.includes(entry.id) || c.title.toLowerCase().includes(entry.title.toLowerCase().split(",")[0].toLowerCase())
    );
    return { ...entry, slug: match?.slug ?? entry.id };
  });
}

export default function CatalogClient({ dbCourses }: { dbCourses: CatalogCourse[] }) {
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  const courses = useMemo(() => mergeCourses(dbCourses), [dbCourses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (activeCat !== "all" && c.cat !== activeCat) return false;
      if (q && !(c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [activeCat, query, courses]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((c) => {
      if (!groups[c.cat]) groups[c.cat] = [];
      groups[c.cat].push(c);
    });
    return groups;
  }, [filtered]);

  const totalLearners = useMemo(() => {
    return CATALOG.reduce((s, c) => {
      const n = parseFloat(c.learners) * (c.learners.includes("k") ? 1000 : 1);
      return s + n;
    }, 0);
  }, []);

  return (
    <>
      <header className="page-head catalog-head">
        <div>
          <div className="eyebrow">Catálogo · {CATALOG.length} cursos iniciais</div>
          <h1 className="h1"><em>Aprenda qualquer coisa.</em> Comece por esses.</h1>
          <p className="lede">
            Trinta cursos feitos à mão em seis domínios — grátis para sempre, em múltiplos idiomas. Adicione qualquer um à sua biblioteca, ou faça um remix pessoal.
          </p>
        </div>
        <div className="catalog-stats">
          <div><strong>{CATALOG.length}</strong> cursos</div>
          <div><strong>{Math.round(totalLearners / 1000)}k</strong> alunos</div>
          <div><strong>8</strong> idiomas</div>
        </div>
      </header>

      <div className="catalog-banner">
        <span className="catalog-banner-eye">Grátis sempre</span>
        <div className="catalog-banner-text">
          Esses cursos-base são grátis — sempre. Pode adicionar à biblioteca do jeito que estão, ou fazer um remix pessoal que você edita, traduz e expande.{" "}
          <strong>Gerar algo que não está aqui? Também é sempre opção.</strong>
        </div>
        <Link href="/courses/generate" className="ghost small">+ Gerar</Link>
      </div>

      <div className="catalog-filters">
        {CATEGORIES.map((cat) => {
          const count = cat.id === "all" ? CATALOG.length : CATALOG.filter((c) => c.cat === cat.id).length;
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

      {activeCat === "all" ? (
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
        (() => {
          const cat = CATEGORIES.find((c) => c.id === activeCat);
          return (
            <section className="catalog-section">
              <div className="catalog-section-head">
                <h2>{cat?.title}</h2>
                <span className="catalog-section-meta">{filtered.length} cursos</span>
              </div>
              <p className="catalog-section-desc">{cat?.desc}</p>
              <div className="catalog-grid">
                {filtered.map((c) => <CatalogCard key={c.id} course={c} />)}
              </div>
              {filtered.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-4)", fontStyle: "italic" }}>
                  Nenhum curso corresponde à sua busca. Tente outra palavra ou{" "}
                  <Link href="/courses/generate">gere um novo</Link>.
                </div>
              )}
            </section>
          );
        })()
      )}
    </>
  );
}

function CatalogCard({ course }: { course: CatalogEntry & { slug: string } }) {
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
        <p className="ccard-desc">{course.desc}</p>
        <div className="ccard-meta">
          <div className="ccard-meta-left">
            <span className="ccard-learners">{course.learners}</span>
            <span>· {course.lessons} aulas</span>
            <span>· {course.duration}</span>
          </div>
          <div className="course-langs">
            {course.langs.slice(0, 3).map((l) => (
              <span key={l} className="course-lang-pill" style={{ fontSize: 8, padding: "1px 4px" }}>{l}</span>
            ))}
            {course.langs.length > 3 && (
              <span className="course-lang-more">+{course.langs.length - 3}</span>
            )}
          </div>
        </div>
      </div>
      <div className="ccard-actions">
        <Link href={`/courses/${course.slug}`} className="ccard-action primary">+ Adicionar</Link>
        <button className="ccard-action">⑂ Remix</button>
      </div>
    </article>
  );
}
