"use client";
import { useState } from "react";
import Link from "next/link";
import CourseMap, { CourseMapModule } from "./CourseMap";

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
  mapModules: CourseMapModule[];
};

export default function CourseDetailTabs({ courseSlug, modules, mapModules }: Props) {
  const [tab, setTab] = useState<"outline" | "map" | "notes" | "flashcards" | "reviews">("outline");

  return (
    <>
      <nav className="course-tabs">
        <button
          className={`ct-tab${tab === "outline" ? " active" : ""}`}
          onClick={() => setTab("outline")}
        >
          Estrutura
        </button>
        <button
          className={`ct-tab${tab === "map" ? " active" : ""}`}
          onClick={() => setTab("map")}
        >
          Mapa
        </button>
        <button
          className={`ct-tab${tab === "notes" ? " active" : ""}`}
          onClick={() => setTab("notes")}
        >
          Minhas notas
        </button>
        <button
          className={`ct-tab${tab === "flashcards" ? " active" : ""}`}
          onClick={() => setTab("flashcards")}
        >
          Flashcards
        </button>
        <button
          className={`ct-tab${tab === "reviews" ? " active" : ""}`}
          onClick={() => setTab("reviews")}
        >
          Avaliações
        </button>
      </nav>

      {tab === "outline" && (
        <div className="modules">
          {modules.map((m) => {
            const totalDur = m.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);
            return (
              <div
                key={m.id}
                className={`module${m.isCurrent ? " current" : ""}${m.isLocked ? " locked" : ""}`}
              >
                <div className="module-head">
                  <span className="module-n">{String(m.order).padStart(2, "0")}</span>
                  <div className="module-info">
                    <div className="module-title">{m.title}</div>
                  </div>
                  <span className="module-dur">{totalDur}m</span>
                </div>
                <div className="module-lessons">
                  {m.lessons.map((l) => {
                    const className = `course-module-lesson${l.done ? " done" : ""}${
                      l.current ? " current" : ""
                    }`;
                    const content = (
                      <>
                        <span className="cml-check">
                          {l.done ? "✓" : l.current ? "▸" : "○"}
                        </span>
                        <span className="cml-n">Aula {l.order}</span>
                        <span className="cml-title">{l.title}</span>
                        <span className="cml-kind">{l.kind}</span>
                        <span className="cml-dur">{l.estimatedMinutes}m</span>
                      </>
                    );
                    if (l.locked || m.isLocked) {
                      return (
                        <span key={l.id} className={`${className} locked`}>
                          {content}
                        </span>
                      );
                    }
                    return (
                      <Link
                        key={l.id}
                        href={`/courses/${courseSlug}/lessons/${l.id}`}
                        className={className}
                      >
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "map" && <CourseMap modules={mapModules} slug={courseSlug} />}

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
          <p style={{ color: "var(--ink-3)", padding: "24px 0" }}>
            Nenhuma avaliação ainda.
          </p>
        </div>
      )}
    </>
  );
}
