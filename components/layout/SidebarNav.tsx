"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { setLocale } from "@/actions/locale";

const DOT_COLORS = ["#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e", "#7a5a8f"];

type Enrollment = {
  id: string;
  course: { slug: string; title: string };
};

type NavUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function SidebarNav({
  enrollments,
  currentStreak,
  user,
  enrollmentCount,
  catalogCount,
  reviewCount,
  weeklyProgressCount,
}: {
  enrollments: Enrollment[];
  currentStreak: number;
  user: NavUser;
  enrollmentCount: number;
  catalogCount: number;
  reviewCount: number;
  weeklyProgressCount: number;
}) {
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const displayName = (() => {
    const parts = user?.name?.split(" ").filter(Boolean) ?? [];
    if (parts.length === 0) return t("defaultName");
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
  })();

  function openSearch() {
    document.dispatchEvent(new CustomEvent("open-search"));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  }

  async function handleLocaleChange(newLocale: "pt" | "en") {
    await setLocale(newLocale);
    router.refresh();
  }

  return (
    <>
      <button
        className="flex items-center gap-2.5 w-full px-3 py-[9px] rounded bg-card border-0 cursor-pointer text-muted-foreground text-[13px] transition-colors mb-2 hover:bg-muted hover:text-foreground"
        onClick={openSearch}
      >
        <span className="text-[14px]">⌕</span>
        <span className="flex-1 text-left">{t("search")}</span>
        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-background rounded-[3px] tracking-[0.04em]">
          ⌘K
        </span>
      </button>

      <button
        className="flex items-center gap-2 bg-foreground text-background px-3 py-2.5 rounded text-[13px] font-medium text-left transition-opacity hover:opacity-85 w-full border-0 cursor-pointer"
        onClick={() => router.push("/courses/generate")}
      >
        <span className="text-base leading-none">+</span>
        {t("newCourse")}
      </button>

      <nav className="flex flex-col gap-px">
        <div className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground px-2 py-1.5 mt-1 font-mono">
          {t("space")}
        </div>
        <NavItem
          href="/dashboard"
          active={pathname === "/dashboard"}
          label={t("library")}
          count={enrollmentCount || undefined}
        />
        <NavItem
          href="/review"
          active={pathname.startsWith("/review")}
          label={t("review")}
          count={reviewCount || undefined}
        />
        <NavItem
          href="/goals"
          active={pathname.startsWith("/goals")}
          label={t("goals")}
          count={weeklyProgressCount || undefined}
        />
        <NavItem href="/discover" active={pathname.startsWith("/discover")} label={t("discover")} />
        <NavItem
          href="/courses"
          active={pathname === "/courses"}
          label={t("catalog")}
          count={catalogCount || undefined}
        />

        {enrollments.length > 0 && (
          <>
            <div className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground px-2 py-1.5 mt-6 font-mono">
              {t("inProgress")}
            </div>
            {enrollments.map((enrollment, i) => (
              <NavItem
                key={enrollment.id}
                href={`/courses/${enrollment.course.slug}`}
                active={pathname === `/courses/${enrollment.course.slug}`}
                label={enrollment.course.title}
                dot={DOT_COLORS[i % DOT_COLORS.length]}
              />
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <ThemeSelect lightLabel={t("lightMode")} darkLabel={t("darkMode")} />
        <div className="flex gap-0.5 bg-muted p-0.5 rounded w-fit">
          <button
            className={`text-[11px] px-2.5 py-1 rounded-[3px] font-medium tracking-[0.04em] border-0 cursor-pointer${locale === "en" ? " bg-background text-foreground" : " text-muted-foreground"}`}
            onClick={() => handleLocaleChange("en")}
          >
            EN
          </button>
          <button
            className={`text-[11px] px-2.5 py-1 rounded-[3px] font-medium tracking-[0.04em] border-0 cursor-pointer${locale === "pt" ? " bg-background text-foreground" : " text-muted-foreground"}`}
            onClick={() => handleLocaleChange("pt")}
          >
            PT
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-1.5 pt-3.5 border-t border-border">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground grid place-items-center text-[12px] font-semibold tracking-[0.02em] shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[13px] font-medium text-foreground">{displayName}</div>
            <div className="text-[11px] text-muted-foreground">
              {t("streakLabel", { streak: currentStreak })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NavItem({
  href,
  active,
  label,
  dot,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  dot?: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2 py-[7px] rounded text-[13px] no-underline transition-colors hover:bg-muted hover:text-foreground${
        active ? " bg-muted text-foreground font-medium" : ""
      }`}
      style={active ? undefined : { color: "var(--ink-2)" }}
    >
      {dot && <span className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: dot }} />}
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-4)" }}>
          {count}
        </span>
      )}
    </Link>
  );
}

const PALETTES = [
  { id: "warm", color: "#c97a4a" },
  { id: "cool", color: "#4a6fa5" },
  { id: "mono", color: "#1a1a1a" },
  { id: "forest", color: "#5a7a4a" },
] as const;

function ThemeSelect({ lightLabel, darkLabel }: { lightLabel: string; darkLabel: string }) {
  const [palette, setPalette] = useState<string>(() =>
    typeof window !== "undefined" ? (document.documentElement.dataset.palette ?? "cool") : "cool"
  );
  const [dark, setDark] = useState<boolean>(() =>
    typeof window !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );

  function applyPalette(p: string) {
    // eslint-disable-next-line react-hooks/immutability
    document.documentElement.dataset.palette = p;
    localStorage.setItem("vr:palette", p);
    setPalette(p);
  }

  function toggleDark() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("vr:dark", next ? "1" : "0");
    setDark(next);
  }

  return (
    <div className="flex items-center gap-2">
      {PALETTES.map((p) => (
        <button
          suppressHydrationWarning
          key={p.id}
          onClick={() => applyPalette(p.id)}
          title={p.id}
          className="w-3.5 h-3.5 rounded-full cursor-pointer border-0 p-0 transition-transform"
          style={{
            background: p.color,
            boxShadow:
              palette === p.id ? `0 0 0 1.5px var(--background), 0 0 0 3px ${p.color}` : "none",
            transform: palette === p.id ? "scale(1.15)" : "scale(1)",
          }}
        />
      ))}
      <button
        suppressHydrationWarning
        onClick={toggleDark}
        title={dark ? lightLabel : darkLabel}
        className="ml-auto text-[13px] leading-none cursor-pointer border-0 bg-transparent transition-colors hover:text-foreground"
        style={{ color: "var(--ink-4)" }}
      >
        {dark ? "○" : "●"}
      </button>
    </div>
  );
}
