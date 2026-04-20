"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { courseAccentGradient, formatLearners, formatDuration, displayLetter } from "@/lib/catalog";

type DbCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  estimatedHours: number | null;
  totalEnrollments: number;
  avgRating: number | null;
  totalRatings: number;
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

type Category = {
  id: string;
  label: string;
  title: string;
  desc: string;
};

function adaptCourse(c: DbCourse): AdaptedCourse {
  return {
    ...c,
    cat: c.category.toLowerCase(),
    color: courseAccentGradient(c.id),
    letter: displayLetter(c.title),
    learnersStr: formatLearners(c.totalEnrollments),
    durationStr: formatDuration(c.estimatedHours),
  };
}

export default function CatalogClient({
  courses,
  languageCount,
}: {
  courses: DbCourse[];
  languageCount: number;
}) {
  const t = useTranslations("catalog");
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  const categories: Category[] = [
    { id: "all", label: t("categories.all"), title: "", desc: "" },
    {
      id: "tech",
      label: t("categories.tech"),
      title: t("categoryTitles.tech"),
      desc: t("categoryDescs.tech"),
    },
    {
      id: "lang",
      label: t("categories.lang"),
      title: t("categoryTitles.lang"),
      desc: t("categoryDescs.lang"),
    },
    {
      id: "music",
      label: t("categories.music"),
      title: t("categoryTitles.music"),
      desc: t("categoryDescs.music"),
    },
    {
      id: "craft",
      label: t("categories.craft"),
      title: t("categoryTitles.craft"),
      desc: t("categoryDescs.craft"),
    },
    {
      id: "science",
      label: t("categories.science"),
      title: t("categoryTitles.science"),
      desc: t("categoryDescs.science"),
    },
    {
      id: "life",
      label: t("categories.life"),
      title: t("categoryTitles.life"),
      desc: t("categoryDescs.life"),
    },
  ];

  const adapted = useMemo(() => courses.map(adaptCourse), [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adapted.filter((c) => {
      if (activeCat !== "all" && c.cat !== activeCat) return false;
      if (q && !(c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)))
        return false;
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
            {t("label", { count: courses.length })}
          </div>
          <h1 className="font-medium text-[36px] leading-[1.15] tracking-[-0.02em] m-0 text-balance text-foreground">
            <em className="not-italic text-muted-foreground font-normal">{t("headline")}</em>{" "}
            {t("headlineSuffix")}
          </h1>
          <p className="text-[15px] leading-[1.6] text-muted-foreground mt-3.5 max-w-[60ch] text-pretty m-0">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-8 font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
          <div>
            <strong className="block font-sans text-[28px] font-normal text-foreground tracking-[-0.02em] normal-case leading-none mb-1">
              {courses.length}
            </strong>
            {t("courses")}
          </div>
          <div>
            <strong className="block font-sans text-[28px] font-normal text-foreground tracking-[-0.02em] normal-case leading-none mb-1">
              {formatLearners(totalLearners)}
            </strong>
            {t("learners")}
          </div>
          <div>
            <strong className="block font-sans text-[28px] font-normal text-foreground tracking-[-0.02em] normal-case leading-none mb-1">
              {languageCount}
            </strong>
            {t("languages")}
          </div>
        </div>
      </header>

      <div
        className="mb-8 py-4 px-5 rounded flex items-center gap-4"
        style={{
          background: "color-mix(in oklch, var(--accent), transparent 92%)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <span
          className="font-mono text-[10px] tracking-[0.1em] uppercase font-semibold shrink-0"
          style={{ color: "var(--accent)" }}
        >
          {t("freeBadge")}
        </span>
        <p className="text-[13px] text-muted-foreground leading-[1.5] flex-1 m-0">
          {t("freeDescription")}{" "}
          <strong className="text-foreground font-semibold">{t("freeGenerate")}</strong>
        </p>
        <Link
          href="/courses/generate"
          className="text-muted-foreground text-[12px] px-2 py-1 rounded no-underline inline-flex items-center transition-colors hover:text-foreground hover:bg-card shrink-0"
        >
          {t("generate")}
        </Link>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-8 pb-5 border-b border-dashed border-border items-center">
        {categories.map((cat) => {
          const count =
            cat.id === "all" ? adapted.length : adapted.filter((c) => c.cat === cat.id).length;
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
              <span
                className={`font-mono text-[10px] ml-1${isActive ? " text-background opacity-60" : " text-muted-foreground opacity-80"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
        <input
          className="ml-auto text-[13px] px-3.5 py-1.5 bg-card border border-transparent rounded-full min-w-[240px] text-foreground outline-none focus:border-muted-foreground focus:bg-background placeholder:text-muted-foreground"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
        />
      </div>

      {adapted.length === 0 ? (
        <div className="py-20 px-10 text-center text-muted-foreground italic">
          {t("noCourses")} <Link href="/courses/generate">{t("generateFirst")}</Link>
        </div>
      ) : activeCat === "all" ? (
        categories
          .filter((c) => c.id !== "all")
          .map((cat) => {
            const items = grouped[cat.id] ?? [];
            if (items.length === 0) return null;
            return (
              <section key={cat.id} className="mb-14">
                <CatalogSectionHead
                  title={cat.title}
                  desc={cat.desc}
                  courseCountLabel={t("courseCount", { count: items.length })}
                />
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
                  {items.map((c) => (
                    <CatalogCard key={c.id} course={c} />
                  ))}
                </div>
              </section>
            );
          })
      ) : (
        <CatalogSection cat={categories.find((c) => c.id === activeCat)!} items={filtered} />
      )}
    </>
  );
}

function CatalogSectionHead({
  title,
  desc,
  courseCountLabel,
}: {
  title: string;
  desc: string;
  courseCountLabel: string;
}) {
  return (
    <>
      <div className="flex items-baseline gap-4 mb-4 pb-2.5 border-b border-border">
        <h2 className="text-[22px] tracking-[-0.02em] m-0 font-normal text-foreground">{title}</h2>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground ml-auto">
          {courseCountLabel}
        </span>
      </div>
      <p className="text-muted-foreground text-[14px] leading-[1.55] max-w-[64ch] -mt-2 mb-5 m-0">
        {desc}
      </p>
    </>
  );
}

function CatalogSection({ cat, items }: { cat: Category; items: AdaptedCourse[] }) {
  const t = useTranslations("catalog");
  return (
    <section className="mb-14">
      <CatalogSectionHead
        title={cat.title}
        desc={cat.desc}
        courseCountLabel={t("courseCount", { count: items.length })}
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
        {items.map((c) => (
          <CatalogCard key={c.id} course={c} />
        ))}
      </div>
      {items.length === 0 && (
        <div className="py-10 text-center text-muted-foreground italic">
          {t("noResults")} <Link href="/courses/generate">{t("generateNew")}</Link>.
        </div>
      )}
    </section>
  );
}

function CatalogCard({ course }: { course: AdaptedCourse }) {
  const t = useTranslations("catalog");
  const catLabel = (t as unknown as (k: string) => string)(`catLabels.${course.cat}`) ?? course.cat;

  return (
    <article className="group flex flex-col bg-background border border-border rounded-[var(--radius-lg)] overflow-hidden cursor-pointer transition-all text-left text-foreground relative hover:-translate-y-[3px] hover:border-foreground hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.15)]">
      <div className="h-20 relative overflow-hidden" style={{ background: course.color }}>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0_6px,transparent_6px_14px)]" />
        <span className="absolute top-2.5 left-3 font-mono text-[9px] tracking-[0.1em] uppercase text-white/90 bg-black/20 px-2 py-[3px] rounded-[3px] backdrop-blur-sm">
          {catLabel}
        </span>
        <span className="absolute top-2.5 right-3 font-mono text-[9px] tracking-[0.1em] uppercase bg-background text-foreground px-2 py-[3px] rounded-[3px] font-semibold border border-white/40">
          {t("free")}
        </span>
        <span className="absolute right-3.5 -bottom-3.5 text-[72px] text-white/30 leading-none tracking-[-0.04em] font-normal select-none">
          {course.letter}
        </span>
      </div>
      <div className="px-[18px] pt-4 pb-[18px] flex flex-col gap-2.5 flex-1">
        <h3 className="text-[17px] tracking-[-0.015em] font-medium leading-[1.2] m-0 text-foreground">
          {course.title}
        </h3>
        <p className="text-[13px] text-muted-foreground leading-[1.5] flex-1 m-0">
          {course.description}
        </p>
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.04em] text-muted-foreground pt-2.5 border-t border-dashed border-border">
          {course.avgRating != null && (
            <span className="text-[#b8922a]">★ {course.avgRating.toFixed(1)}</span>
          )}
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
          {t("add")}
        </Link>
        <button className="flex-1 text-[12px] px-2.5 py-1.5 bg-card border border-transparent rounded cursor-pointer text-foreground text-center inline-flex items-center justify-center hover:bg-muted">
          {t("remix")}
        </button>
      </div>
    </article>
  );
}
