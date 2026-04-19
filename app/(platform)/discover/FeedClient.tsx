"use client";

import { useState } from "react";

type FilterType = "Todos" | "Cursos" | "Notas" | "Conquistas";

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
}

const POSTS: Post[] = [
  {
    id: 1,
    kind: "course-share",
    who: "Amara Okafor",
    handle: "amaralearns",
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
  },
  {
    id: 2,
    kind: "note",
    who: "Tomás Ribeiro",
    handle: "tomaslearns",
    when: "há 4 horas",
    text: "A aula 5 do curso de pão reprogramou meu entendimento sobre hidratação. Deixo minhas notas caso alguém esteja travado no miolo fechado.",
    note: "Hidratação não é um número só — é um orçamento. Proteínas da farinha, umidade ambiente e quanto tempo você pode esperar, tudo vem da mesma conta.",
    course: { title: "Pão & fermentação", color: "#8a9a5b" },
    likes: 62,
    comments: 9,
  },
  {
    id: 3,
    kind: "course-share",
    who: "Priya Sundaram",
    handle: "priya",
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
  },
  {
    id: 4,
    kind: "milestone",
    who: "Iván Méndez",
    handle: "ivanm",
    when: "Ontem",
    text: "100 dias seguidos. Metade foi o curso de marcenaria japonesa. A outra metade foi aprender a aparecer nos dias que eu não queria.",
    milestone: { big: "100", label: "dias seguidos" },
    likes: 889,
    comments: 103,
  },
];

const TRENDING = [
  { title: "OSINT Fundamentals", color: "#c97a4a", lessons: 14 },
  { title: "Massa Caseira", color: "#8a9a5b", lessons: 9 },
  { title: "Harmonia Jazz", color: "#6b7a8f", lessons: 11 },
];

const TOPICS = [
  { label: "segurança", size: 3 },
  { label: "linux", size: 2 },
  { label: "ofício", size: 2 },
  { label: "música", size: 1 },
  { label: "estatística", size: 1 },
  { label: "negociação", size: 1 },
  { label: "história", size: 1 },
  { label: "tipografia", size: 1 },
];

const PEOPLE = [
  { name: "Elena Marchetti", initials: "EM", bio: "tipografia + design lento" },
  { name: "Kenji Watanabe", initials: "KW", bio: "marcenaria, 30 anos" },
  { name: "Fatima Zaidi", initials: "FZ", bio: "matemática aplicada & ensino" },
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
    <article className="post" key={post.id}>
      <div className="post-head">
        <div className="post-avatar">{getInitials(post.who)}</div>
        <div className="post-who">
          <span className="post-name">
            {post.who}
            <span className="post-handle"> @{post.handle}</span>
          </span>
          <div className="post-when">{post.when}</div>
        </div>
      </div>

      <p className="post-text">{post.text}</p>

      {post.kind === "course-share" && post.course && (
        <div className="post-course">
          <div className="pc-visual" style={{ background: post.course.color }}>
            <div className="placeholder-stripes" />
          </div>
          <div>
            <div className="pc-eye">CURSO</div>
            <div className="pc-t">{post.course.title}</div>
            {post.course.sub && <div className="pc-s">{post.course.sub}</div>}
            <div className="pc-meta">{post.course.lessons} aulas</div>
          </div>
          <span>→</span>
        </div>
      )}

      {post.kind === "note" && post.note && post.course && (
        <blockquote className="post-note">
          <span className="pn-q">&ldquo;</span>
          <p>{post.note}</p>
          <footer>
            <span className="pn-swatch" style={{ background: post.course.color }} />
            {post.course.title}
          </footer>
        </blockquote>
      )}

      {post.kind === "milestone" && post.milestone && (
        <div className="post-milestone">
          <div className="pm-big">{post.milestone.big}</div>
          <div className="pm-label">{post.milestone.label}</div>
        </div>
      )}

      <div className="post-actions">
        <button className={`pa${liked ? " liked" : ""}`} onClick={() => setLiked((l) => !l)}>
          <span className="pa-icon">♥</span> {likes}
        </button>
        <button className="pa">
          <span className="pa-icon">💬</span> {post.comments}
        </button>
        <div className="spacer" />
        <button className="pa">
          <span className="pa-icon">🔖</span>
        </button>
      </div>
    </article>
  );
}

const FILTERS: FilterType[] = ["Todos", "Cursos", "Notas", "Conquistas"];

export default function FeedClient() {
  const [active, setActive] = useState<FilterType>("Todos");

  return (
    <div className="page">
      <header className="page-head compact">
        <div>
          <div className="eyebrow">DESCOBRIR</div>
          <h1 className="h1">Feed</h1>
        </div>
        <div className="feed-search">
          <input placeholder="Buscar no feed..." />
          <span className="search-kbd">⌘K</span>
        </div>
      </header>

      <div className="feed-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter${active === f ? " on" : ""}`}
            onClick={() => setActive(f)}
          >
            {f}
          </button>
        ))}
        <div className="spacer" />
      </div>

      <div className="feed-grid">
        <div className="feed-main">
          {POSTS.map((post) => (
            <FeedPost key={post.id} post={post} />
          ))}
        </div>

        <div className="feed-side">
          <div className="side-block">
            <div className="side-head">TRENDING</div>
            <ul className="mini-courses">
              {TRENDING.map((c) => (
                <li key={c.title}>
                  <div className="mc-swatch" style={{ background: c.color }}>
                    <div className="placeholder-stripes" />
                  </div>
                  <div className="mc-body">
                    <div className="mc-t">{c.title}</div>
                    <div className="mc-m">{c.lessons} aulas</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="side-block">
            <div className="side-head">TÓPICOS</div>
            <div className="topic-cloud">
              {TOPICS.map((t) => (
                <span
                  key={t.label}
                  className={`topic${t.size >= 3 ? " t-3" : t.size >= 2 ? " t-2" : ""}`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          <div className="side-block">
            <div className="side-head">PESSOAS PARA SEGUIR</div>
            <ul className="people-list">
              {PEOPLE.map((p) => (
                <li key={p.name}>
                  <div className="p-avatar">{p.initials}</div>
                  <div className="p-body">
                    <div className="p-n">{p.name}</div>
                    <div className="p-b">{p.bio}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
