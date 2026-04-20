"use client";

import { useState } from "react";

type FilterType = "trending" | "following" | "new" | "friends";

type PostKind = "course-share" | "note" | "milestone";

interface FeedCourse {
  title: string;
  sub?: string;
  color: string;
  rating?: number;
  learners?: string;
  lessons?: number;
}

interface Post {
  id: number;
  kind: PostKind;
  who: string;
  handle: string;
  when: string;
  text: string;
  course?: FeedCourse;
  note?: string;
  milestone?: { big: string; label: string };
  likes: number;
  comments: number;
  remixes: number;
}

const POSTS: Post[] = [
  {
    id: 1,
    kind: "course-share",
    who: "Amara Okafor",
    handle: "@amaralearns",
    when: "há 2 horas",
    text: "Acabei esse curso de Kali e foi o primeiro que me fez sentir capaz de montar um home lab sem destruir o roteador.",
    course: {
      title: "Kali Linux",
      sub: "Segurança ofensiva, do primeiro boot ao lab completo",
      color: "#c97a4a",
      rating: 4.8,
      learners: "3.2k",
      lessons: 18,
    },
    likes: 184,
    comments: 22,
    remixes: 14,
  },
  {
    id: 2,
    kind: "note",
    who: "Tomás Ribeiro",
    handle: "@tomaslearns",
    when: "há 4 horas",
    text: "A aula 5 do curso de pão reprogramou meu entendimento sobre hidratação. Deixo minhas notas caso alguém esteja travado no miolo fechado.",
    note: "Hidratação não é um número só — é um orçamento. Proteínas da farinha, umidade ambiente e quanto tempo você pode esperar, tudo vem da mesma conta.",
    course: { title: "Pão & fermentação", color: "#8a9a5b" },
    likes: 62,
    comments: 9,
    remixes: 3,
  },
  {
    id: 3,
    kind: "course-share",
    who: "Priya Sundaram",
    handle: "@priya",
    when: "Ontem",
    text: "Gerei esse curso de estatística bayesiana depois que três livros falharam comigo. Primeira vez que 'priori' e 'posteriori' deixam de parecer bruxaria.",
    course: {
      title: "Estatística bayesiana, com intuição",
      sub: "Prioris, atualizações e a gramática da crença",
      color: "#6b7a8f",
      rating: 4.9,
      learners: "1.1k",
      lessons: 12,
    },
    likes: 412,
    comments: 58,
    remixes: 91,
  },
  {
    id: 4,
    kind: "milestone",
    who: "Iván Méndez",
    handle: "@ivanm",
    when: "Ontem",
    text: "100 dias seguidos. Metade foi o curso de marcenaria japonesa. A outra metade foi aprender a aparecer nos dias que eu não queria.",
    milestone: { big: "100", label: "dias seguidos" },
    likes: 889,
    comments: 103,
    remixes: 0,
  },
];

const SUGGESTED = [
  { title: "OSINT fundamentals", color: "#c97a4a", rating: 4.7, learners: "2.1k" },
  { title: "Massa caseira", color: "#8a9a5b", rating: 4.9, learners: "5.4k" },
  { title: "Harmonia jazz", color: "#6b7a8f", rating: 4.6, learners: "890" },
];

const TOPICS = [
  { label: "security", size: 3 },
  { label: "linux", size: 2 },
  { label: "ofício", size: 2 },
  { label: "music", size: 1 },
  { label: "statistics", size: 1 },
  { label: "negociação", size: 1 },
  { label: "history", size: 1 },
  { label: "typography", size: 1 },
];

const PEOPLE = [
  { name: "Elena Marchetti", initials: "EM", bio: "tipografia + design lento" },
  { name: "Kenji Watanabe", initials: "KW", bio: "marcenaria, 30 anos" },
  { name: "Fatima Zaidi", initials: "FZ", bio: "matemática aplicada & ensino" },
];

const stripes =
  "repeating-linear-gradient(45deg,rgba(255,255,255,0.05) 0 6px,transparent 6px 14px)";

const chipBtn =
  "text-[11px] px-2.5 py-[3px] rounded-full border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer font-[inherit]";

function FeedPost({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const likes = post.likes + (liked ? 1 : 0);

  return (
    <article className="bg-card rounded-[var(--radius-lg)] p-6">
      {/* Post header */}
      <div className="flex items-center gap-3 mb-3.5">
        <div className="w-9 h-9 bg-muted rounded-full grid place-items-center text-[11px] font-semibold text-foreground shrink-0">
          {post.who
            .split(" ")
            .map((p) => p[0])
            .join("")}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-medium text-foreground">
            {post.who}
            <span className="font-normal text-muted-foreground ml-1">{post.handle}</span>
          </div>
          <div className="text-[12px] text-muted-foreground font-mono tracking-[0.02em]">
            {post.when}
          </div>
        </div>
        <button className="flex items-center justify-center w-7 h-7 rounded-[var(--radius)] text-[16px] text-muted-foreground bg-transparent border-0 cursor-pointer hover:bg-muted hover:text-foreground transition-colors">
          ⋯
        </button>
      </div>

      <p className="text-[15px] leading-[1.55] m-0 mb-4 text-foreground tracking-[-0.005em] text-pretty">
        {post.text}
      </p>

      {/* Course share card */}
      {post.kind === "course-share" && post.course && (
        <div className="grid grid-cols-[80px_1fr_auto] gap-4 items-center p-4 bg-background rounded-[var(--radius)] cursor-pointer transition-transform hover:-translate-y-px">
          <div
            className="aspect-square rounded-[var(--radius)] relative overflow-hidden"
            style={{ background: post.course.color }}
          >
            <div className="absolute inset-0" style={{ background: stripes }} />
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground mb-1">
              CURSO COMPARTILHADO
            </div>
            <div className="text-[15px] font-medium tracking-[-0.015em] text-foreground">
              {post.course.title}
            </div>
            {post.course.sub && (
              <div className="text-[12px] text-muted-foreground mt-0.5">{post.course.sub}</div>
            )}
            {post.course.rating && post.course.learners && (
              <div className="text-[11px] text-muted-foreground mt-1.5 font-mono tracking-[0.02em]">
                ★ {post.course.rating} · {post.course.learners} alunos
              </div>
            )}
          </div>
          <button className="text-[13px] px-3 py-1.5 rounded-[var(--radius)] border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer font-[inherit] transition-colors whitespace-nowrap">
            Remixar →
          </button>
        </div>
      )}

      {/* Note card */}
      {post.kind === "note" && post.note && post.course && (
        <blockquote className="m-0 px-8 py-6 bg-background rounded-[var(--radius)] relative">
          <span className="absolute top-1 left-3.5 text-[48px] leading-none text-muted-foreground opacity-40 font-medium">
            &ldquo;
          </span>
          <p className="text-[15px] leading-[1.6] m-0 mb-3 text-foreground tracking-[-0.005em]">
            {post.note}
          </p>
          <footer className="text-[12px] text-muted-foreground flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-[2px] inline-block"
              style={{ background: post.course.color }}
            />
            {post.course.title}
          </footer>
        </blockquote>
      )}

      {/* Milestone card */}
      {post.kind === "milestone" && post.milestone && (
        <div className="p-10 bg-background rounded-[var(--radius)] text-center">
          <div className="text-[88px] leading-none text-foreground tracking-[-0.05em] font-medium tabular-nums">
            {post.milestone.big}
          </div>
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground mt-2">
            {post.milestone.label}
          </div>
        </div>
      )}

      {/* Post actions */}
      <div className="flex gap-1 mt-4 pt-4 border-t border-border items-center">
        <button
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] text-[12px] transition-colors bg-transparent border-0 cursor-pointer hover:bg-muted hover:text-foreground${
            liked ? " text-accent" : " text-muted-foreground"
          }`}
          onClick={() => setLiked((l) => !l)}
        >
          <span className="text-[14px]">{liked ? "♥" : "♡"}</span> {likes}
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] text-[12px] text-muted-foreground transition-colors bg-transparent border-0 cursor-pointer hover:bg-muted hover:text-foreground">
          <span className="text-[14px]">◌</span> {post.comments}
        </button>
        {post.remixes > 0 && (
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] text-[12px] text-muted-foreground transition-colors bg-transparent border-0 cursor-pointer hover:bg-muted hover:text-foreground">
            <span className="text-[14px]">⟲</span> {post.remixes} remixes
          </button>
        )}
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] text-[12px] text-muted-foreground transition-colors bg-transparent border-0 cursor-pointer hover:bg-muted hover:text-foreground">
          <span className="text-[14px]">↗</span> Compartilhar
        </button>
      </div>
    </article>
  );
}

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "trending", label: "Em alta" },
  { id: "following", label: "Seguindo" },
  { id: "new", label: "Novos" },
  { id: "friends", label: "Amigos" },
];

export default function FeedClient() {
  const [active, setActive] = useState<FilterType>("trending");

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Page header */}
      <header className="flex items-end justify-between pb-8 border-b border-border gap-8">
        <div>
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground mb-2">
            DESCOBRIR
          </div>
          <h1 className="font-medium text-[36px] leading-[1.15] tracking-[-0.02em] m-0 mb-2 text-foreground">
            <em className="not-italic text-muted-foreground font-normal">O que os outros</em> estão
            aprendendo.
          </h1>
          <p className="text-[14px] text-muted-foreground leading-[1.5] m-0 max-w-[420px]">
            Cursos, notas e descobertas de quem você segue e da comunidade. Remixe qualquer curso
            para torná-lo seu.
          </p>
        </div>
        <div className="relative w-72 shrink-0">
          <input
            placeholder="Buscar 4.218 cursos públicos…"
            className="w-full px-3.5 py-2.5 bg-card border border-border rounded-[var(--radius)] font-[inherit] text-[13px] text-foreground focus:outline-none focus:border-accent"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] px-1.5 py-0.5 bg-muted rounded-[3px] text-muted-foreground">
            /
          </span>
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-1 items-center pb-3 border-b border-border">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`text-[13px] px-3.5 py-1.5 border rounded-full cursor-pointer transition-all font-[inherit]${
              active === f.id
                ? " bg-foreground text-background border-foreground"
                : " bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
            onClick={() => setActive(f.id)}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <button className="text-[13px] px-3 py-1.5 rounded-[var(--radius)] border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer font-[inherit] transition-colors">
          Tópicos ↓
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_300px] gap-12">
        <div className="flex flex-col gap-6">
          {POSTS.map((post) => (
            <FeedPost key={post.id} post={post} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 sticky top-12 self-start">
          {/* Suggested for you */}
          <div className="bg-card rounded-[var(--radius-lg)] p-[18px]">
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3.5 pb-2.5 border-b border-border">
              SUGERIDOS PARA VOCÊ
            </div>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              {SUGGESTED.map((c) => (
                <li key={c.title} className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-[var(--radius)] relative overflow-hidden shrink-0"
                    style={{ background: c.color }}
                  >
                    <div className="absolute inset-0" style={{ background: stripes }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis text-foreground">
                      {c.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono tracking-[0.02em]">
                      ★ {c.rating} · {c.learners}
                    </div>
                  </div>
                  <button className={chipBtn}>+</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Topics */}
          <div className="bg-card rounded-[var(--radius-lg)] p-[18px]">
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3.5 pb-2.5 border-b border-border">
              TÓPICOS QUE VOCÊ EXPLORA
            </div>
            <div className="flex flex-wrap gap-1">
              {TOPICS.map((t) => (
                <span
                  key={t.label}
                  className={`px-2.5 py-[3px] rounded-full cursor-pointer${
                    t.size >= 3
                      ? " text-[14px] bg-accent text-background"
                      : t.size >= 2
                        ? " text-[13px] bg-background"
                        : " text-[12px] bg-muted"
                  }`}
                  style={t.size >= 3 ? undefined : { color: "var(--ink-2)" }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* People to follow */}
          <div className="bg-card rounded-[var(--radius-lg)] p-[18px]">
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3.5 pb-2.5 border-b border-border">
              PESSOAS PARA SEGUIR
            </div>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {PEOPLE.map((p) => (
                <li key={p.name} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-muted rounded-full grid place-items-center text-[10px] font-semibold text-foreground shrink-0">
                    {p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                      {p.bio}
                    </div>
                  </div>
                  <button className={chipBtn}>Seguir</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
