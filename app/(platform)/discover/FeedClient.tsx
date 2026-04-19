"use client";

import { useState } from "react";

const COURSE_COLORS = ["#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e", "#7a5a8f", "#5a8a8a"];

const TOPICS = [
  "Segurança", "Linux", "Python", "Pão", "Piano",
  "Negociação", "Xadrez", "Francês", "ML", "Desenho", "Estatística", "Café",
];

type PostKind = "course-share" | "note" | "milestone";

interface FeedCourse {
  title: string;
  sub?: string;
  color: string;
  rating?: number;
  learners?: string;
}

interface Post {
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
    },
    likes: 184,
    comments: 22,
    remixes: 14,
  },
  {
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
    },
    likes: 412,
    comments: 58,
    remixes: 91,
  },
  {
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}

function FeedPost({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const likes = post.likes + (liked ? 1 : 0);

  return (
    <article className={`post post-${post.kind}`}>
      <header className="post-head">
        <div className="post-avatar">{getInitials(post.who)}</div>
        <div className="post-who">
          <div className="post-name">
            {post.who} <span className="post-handle">{post.handle}</span>
          </div>
          <div className="post-when">{post.when}</div>
        </div>
        <button className="icon small">⋯</button>
      </header>

      <p className="post-text">{post.text}</p>

      {post.kind === "course-share" && post.course && (
        <div className="post-course">
          <div className="pc-visual" style={{ background: post.course.color }}>
            <div className="placeholder-stripes" />
          </div>
          <div className="pc-body">
            <div className="pc-eye">CURSO COMPARTILHADO</div>
            <div className="pc-t">{post.course.title}</div>
            {post.course.sub && <div className="pc-s">{post.course.sub}</div>}
            {post.course.rating && (
              <div className="pc-meta">★ {post.course.rating} · {post.course.learners} alunos</div>
            )}
          </div>
          <button className="ghost">Remixar →</button>
        </div>
      )}

      {post.kind === "note" && post.note && post.course && (
        <blockquote className="post-note">
          <div className="pn-q">&ldquo;</div>
          <p>{post.note}</p>
          <footer>
            <span className="pn-swatch" style={{ background: post.course.color }} />
            de <em>{post.course.title}</em>
          </footer>
        </blockquote>
      )}

      {post.kind === "milestone" && post.milestone && (
        <div className="post-milestone">
          <div className="pm-big">{post.milestone.big}</div>
          <div className="pm-label">{post.milestone.label}</div>
        </div>
      )}

      <footer className="post-actions">
        <button className={`pa${liked ? " liked" : ""}`} onClick={() => setLiked((l) => !l)}>
          <span className="pa-icon">{liked ? "♥" : "♡"}</span> {likes}
        </button>
        <button className="pa">
          <span className="pa-icon">◌</span> {post.comments}
        </button>
        {post.remixes > 0 && (
          <button className="pa">
            <span className="pa-icon">⟲</span> {post.remixes} remixes
          </button>
        )}
        <div className="spacer" />
        <button className="pa">
          <span className="pa-icon">↗</span> Compartilhar
        </button>
      </footer>
    </article>
  );
}

interface FeaturedCourse {
  id: string;
  slug: string;
  title: string;
  totalEnrollments: number;
}

interface FeedClientProps {
  featuredCourses: FeaturedCourse[];
}

export default function FeedClient({ featuredCourses }: FeedClientProps) {
  const [filter, setFilter] = useState<"trending" | "following" | "new" | "friends">("trending");

  return (
    <div className="page feed">
      <header className="page-head">
        <div>
          <div className="eyebrow">Descobrir</div>
          <h1 className="h1">
            <em>O que os outros</em> estão aprendendo.
          </h1>
          <p className="lede">
            Cursos, notas e descobertas de quem você segue e da comunidade. Remixe qualquer curso para torná-lo seu.
          </p>
        </div>
        <div className="feed-search">
          <input placeholder="Buscar 4.218 cursos públicos…" />
          <span className="search-kbd">/</span>
        </div>
      </header>

      <div className="feed-filters">
        <button
          className={`filter ${filter === "trending" ? "on" : ""}`}
          onClick={() => setFilter("trending")}
        >
          Em alta
        </button>
        <button
          className={`filter ${filter === "following" ? "on" : ""}`}
          onClick={() => setFilter("following")}
        >
          Seguindo
        </button>
        <button
          className={`filter ${filter === "new" ? "on" : ""}`}
          onClick={() => setFilter("new")}
        >
          Novos
        </button>
        <button
          className={`filter ${filter === "friends" ? "on" : ""}`}
          onClick={() => setFilter("friends")}
        >
          Amigos
        </button>
        <div className="spacer" />
        <button className="ghost small">Tópicos ↓</button>
      </div>

      <div className="feed-grid">
        <div className="feed-main">
          {POSTS.map((p, i) => (
            <FeedPost key={i} post={p} />
          ))}
        </div>

        <aside className="feed-side">
          <div className="side-section">
            <div className="side-section-head">Cursos em destaque</div>
            {featuredCourses.map((c, i) => (
              <a href={`/courses/${c.slug}`} key={c.id} className="side-course">
                <div
                  className="sc-dot"
                  style={{ background: COURSE_COLORS[i % COURSE_COLORS.length] }}
                />
                <div className="sc-body">
                  <div className="sc-title">{c.title}</div>
                  <div className="sc-meta">{c.totalEnrollments} alunos</div>
                </div>
              </a>
            ))}
          </div>

          <div className="side-section">
            <div className="side-section-head">Tópicos</div>
            <div className="topic-cloud">
              {TOPICS.map((t) => (
                <span key={t} className="tc-item">{t}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
