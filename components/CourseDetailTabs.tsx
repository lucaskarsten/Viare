"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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

const TAB_IDS: Tab[] = ["overview", "lessons", "flashcards", "reviews", "notes"];

function kindStyle(kind: string): { className: string; style?: React.CSSProperties } {
  const base =
    "font-mono text-[10px] uppercase tracking-[0.08em] text-center px-2 py-[2px] rounded-[2px]";
  if (kind === "quiz")
    return {
      className: base,
      style: { background: "color-mix(in oklch, var(--ok), transparent 88%)", color: "var(--ok)" },
    };
  if (kind === "lab")
    return {
      className: base,
      style: {
        background: "color-mix(in oklch, var(--accent), transparent 85%)",
        color: "var(--accent)",
      },
    };
  if (kind === "cenário")
    return {
      className: base,
      style: {
        background: "color-mix(in oklch, var(--accent), transparent 85%)",
        color: "var(--accent)",
      },
    };
  if (kind === "reflexão")
    return {
      className: base,
      style: {
        background: "color-mix(in oklch, oklch(65% 0.2 280), transparent 85%)",
        color: "oklch(55% 0.2 280)",
      },
    };
  if (kind === "prática")
    return {
      className: base,
      style: {
        background: "color-mix(in oklch, oklch(65% 0.2 150), transparent 85%)",
        color: "oklch(50% 0.2 150)",
      },
    };
  return { className: `${base} bg-muted text-muted-foreground` };
}

export default function CourseDetailTabs({ courseSlug, modules }: Props) {
  const t = useTranslations("courseDetail");
  const [tab, setTab] = useState<Tab>("lessons");
  const router = useRouter();

  return (
    <div className="flex flex-col">
      <div className="flex gap-1 border-b border-border overflow-x-auto flex-nowrap -mx-4 sm:mx-0 px-4 sm:px-0">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            className={`text-[13px] px-3.5 py-2.5 -mb-px cursor-pointer font-[inherit] bg-transparent transition-colors whitespace-nowrap${
              tab === id
                ? " text-foreground font-medium [border-bottom:2px_solid_var(--accent)]"
                : " text-muted-foreground [border-bottom:2px_solid_transparent] hover:text-foreground"
            }`}
            onClick={() => setTab(id)}
          >
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      <div className="pt-8">
        {tab === "overview" && (
          <p
            className="text-muted-foreground py-6 [&_strong]:text-foreground [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: t.raw("selectLessonsTab") }}
          />
        )}

        {tab === "lessons" && (
          <ul className="list-none p-0 m-0">
            {modules.map((m) => {
              const allDone = m.lessons.every((l) => l.done);
              return (
                <li
                  key={m.id}
                  className={`py-7 border-b border-border${m.isLocked ? " opacity-50" : ""}`}
                >
                  <div className="flex items-baseline gap-4 mb-3.5">
                    <span className="font-mono text-[12px] text-muted-foreground tracking-[0.08em]">
                      {String(m.order).padStart(2, "0")}
                    </span>
                    <h3 className="font-medium text-[17px] m-0 tracking-[-0.02em] flex-1 text-foreground">
                      {m.title}
                    </h3>
                    {allDone && (
                      <span className="font-mono text-[10px] px-2 py-[3px] bg-accent/15 text-accent rounded-full tracking-[0.05em] uppercase">
                        {t("completedBadge")}
                      </span>
                    )}
                    {m.isCurrent && !allDone && (
                      <span className="font-mono text-[10px] px-2 py-[3px] bg-accent/15 text-accent rounded-full tracking-[0.05em] uppercase">
                        {t("youAreHere")}
                      </span>
                    )}
                    {m.isLocked && (
                      <span className="font-mono text-[10px] text-muted-foreground tracking-[0.05em]">
                        {t("locked")}
                      </span>
                    )}
                  </div>
                  <ul className="list-none p-0 m-0">
                    {m.lessons.map((l) => {
                      const isClickable = !m.isLocked && !l.locked;
                      return (
                        <li
                          key={l.id}
                          className={`grid grid-cols-[24px_1fr_auto] sm:grid-cols-[24px_80px_1fr_80px_60px] gap-3 sm:gap-4 items-center px-2 py-2.5 rounded text-[14px] transition-colors${
                            l.current ? " bg-accent/15" : ""
                          }${isClickable ? " cursor-pointer hover:bg-card" : " cursor-default"}`}
                          onClick={
                            isClickable
                              ? () => router.push(`/courses/${courseSlug}/lessons/${l.id}`)
                              : undefined
                          }
                        >
                          <span
                            className={`text-center${l.done ? " text-primary" : l.current ? " text-accent" : " text-muted-foreground"}`}
                          >
                            {l.done ? (
                              "✓"
                            ) : l.current ? (
                              "▸"
                            ) : (
                              <span className="w-2.5 h-2.5 border border-muted-foreground rounded-full inline-block" />
                            )}
                          </span>
                          <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">
                            {String(l.order).padStart(2, "0")}
                          </span>
                          <span
                            className={`min-w-0 truncate ${l.done ? "text-muted-foreground" : "text-foreground"}`}
                          >
                            {l.title}
                          </span>
                          {(() => {
                            const k = kindStyle(l.kind);
                            return (
                              <span
                                className={`${k.className} hidden sm:inline-block`}
                                style={k.style}
                              >
                                {l.kind}
                              </span>
                            );
                          })()}
                          <span className="font-mono text-[11px] text-muted-foreground text-right whitespace-nowrap">
                            {l.estimatedMinutes}min
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        {tab === "notes" && <p className="text-muted-foreground py-6">{t("noNotes")}</p>}

        {tab === "flashcards" && <p className="text-muted-foreground py-6">{t("noFlashcards")}</p>}

        {tab === "reviews" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-8 sm:gap-12 p-5 sm:p-6 bg-card rounded-[var(--radius-lg)] items-center">
              <div className="text-center">
                <div className="text-[48px] leading-none tracking-[-0.04em] font-medium tabular-nums text-foreground">
                  —
                </div>
                <div className="text-accent tracking-[0.08em] text-[16px]">★★★★★</div>
                <div className="text-[12px] text-muted-foreground mt-1.5">{t("noReviewsYet")}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <div
                    key={n}
                    className="grid grid-cols-[20px_1fr_40px] gap-3 items-center text-[12px] text-muted-foreground"
                  >
                    <span>{n}</span>
                    <div className="h-1 bg-border/50 rounded-[2px] overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: "0%" }} />
                    </div>
                    <span className="text-right tabular-nums">0%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-muted-foreground py-6">{t("noReviewsBody")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
