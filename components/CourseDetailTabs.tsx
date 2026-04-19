"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type CourseDetailLesson = {
  id: string;
  title: string;
  order: number;
  kind: string;
  estimatedMinutes: number;
  done: boolean;
  current: boolean;
  locked: boolean;
};

export type CourseDetailModule = {
  id: string;
  title: string;
  order: number;
  isCurrent: boolean;
  isLocked: boolean;
  lessons: CourseDetailLesson[];
};

type Props = {
  courseSlug: string;
  modules: CourseDetailModule[];
};

type Tab = "overview" | "lessons" | "flashcards" | "reviews" | "notes";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "lessons", label: "Aulas" },
  { id: "flashcards", label: "Flashcards" },
  { id: "reviews", label: "Avaliações" },
  { id: "notes", label: "Notas" },
];

function kindClass(kind: string): string {
  if (kind === "quiz") return "k-quiz";
  if (kind === "lab") return "k-lab";
  return "k-read";
}

export default function CourseDetailTabs({ courseSlug, modules }: Props) {
  const [tab, setTab] = useState<Tab>("lessons");
  const router = useRouter();

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? " on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="notes-list">
          <p style={{ color: "var(--ink-3)", padding: "24px 0" }}>
            Selecione a aba <strong>Aulas</strong> para ver o conteúdo do curso.
          </p>
        </div>
      )}

      {tab === "lessons" && (
        <ul className="course-modules">
          {modules.map((m) => {
            const allDone = m.lessons.every((l) => l.done);
            return (
              <li
                key={m.id}
                className={`course-module${m.isLocked ? " locked" : ""}${m.isCurrent ? " current" : ""}`}
              >
                <div className="cm-head">
                  <span className="cm-num">{String(m.order).padStart(2, "0")}</span>
                  <h3>{m.title}</h3>
                  {allDone && <span className="cm-badge">Concluído</span>}
                  {m.isCurrent && !allDone && <span className="cm-badge">Você está aqui</span>}
                  {m.isLocked && <span className="cm-lock">bloqueado</span>}
                </div>
                <ul className="cm-lessons">
                  {m.lessons.map((l) => {
                    const lessonClass = `cm-lesson${l.done ? " done" : ""}${l.current ? " current" : ""}`;
                    const inner = (
                      <>
                        <span className="cml-check">
                          {l.done ? "✓" : l.current ? "▸" : <span className="empty-circle" />}
                        </span>
                        <span className="cml-n">{String(l.order).padStart(2, "0")}</span>
                        <span className="cml-title">{l.title}</span>
                        <span className={`cml-kind ${kindClass(l.kind)}`}>{l.kind}</span>
                        <span className="cml-dur">{l.estimatedMinutes}min</span>
                      </>
                    );
                    if (m.isLocked || l.locked) {
                      return (
                        <li key={l.id} className={`${lessonClass} locked`}>
                          {inner}
                        </li>
                      );
                    }
                    return (
                      <li
                        key={l.id}
                        className={lessonClass}
                        onClick={() => router.push(`/courses/${courseSlug}/lessons/${l.id}`)}
                      >
                        {inner}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "notes" && (
        <div className="notes-list">
          <p style={{ color: "var(--ink-3)", padding: "24px 0" }}>
            Nenhuma nota ainda. Adicione notas durante as aulas.
          </p>
        </div>
      )}

      {tab === "flashcards" && (
        <div className="flash-grid">
          <p style={{ color: "var(--ink-3)", padding: "24px 0" }}>
            Nenhum flashcard ainda.
          </p>
        </div>
      )}

      {tab === "reviews" && (
        <div className="reviews">
          <div className="reviews-head">
            <div className="big-rating">
              <div className="big-num">—</div>
              <div className="stars">★★★★★</div>
              <div className="rc">Sem avaliações ainda</div>
            </div>
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map((n) => (
                <div key={n} className="rb">
                  <span>{n}</span>
                  <div className="rb-bar">
                    <div style={{ width: "0%" }} />
                  </div>
                  <span className="rb-n">0%</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ color: "var(--ink-3)", padding: "24px 0" }}>
            Nenhuma avaliação ainda.
          </p>
        </div>
      )}
    </>
  );
}
