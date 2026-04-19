"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

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
}: {
  enrollments: Enrollment[];
  currentStreak: number;
  user: NavUser;
  enrollmentCount: number;
  catalogCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const firstName = user?.name?.split(" ")[0] ?? "Você";

  function openSearch() {
    document.dispatchEvent(new CustomEvent("open-search"));
    // Also trigger via synthetic keydown for GlobalSearch listener on window
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  }

  return (
    <>
      <button className="sidebar-search" onClick={openSearch}>
        <span className="ss-icon">⌕</span>
        <span className="ss-label">Buscar qualquer coisa</span>
        <span className="ss-kbd">⌘K</span>
      </button>

      <button className="generate-cta" onClick={() => router.push("/courses/generate")}>
        <span className="plus">+</span>
        Novo curso
      </button>

      <nav className="nav">
        <div className="nav-section">Espaço</div>
        <NavItem
          href="/dashboard"
          active={pathname === "/dashboard"}
          label="Biblioteca"
          count={enrollmentCount || undefined}
        />
        <NavItem
          href="/review"
          active={pathname.startsWith("/review")}
          label="Revisar"
        />
        <NavItem
          href="/goals"
          active={pathname.startsWith("/goals")}
          label="Metas"
        />
        <NavItem
          href="/discover"
          active={pathname.startsWith("/discover")}
          label="Descobrir"
        />
        <NavItem
          href="/courses"
          active={pathname === "/courses"}
          label="Catálogo"
          count={catalogCount || undefined}
        />

        {enrollments.length > 0 && (
          <>
            <div className="nav-section" style={{ marginTop: 24 }}>Em andamento</div>
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

      <div className="sidebar-foot">
        <div className="lang-toggle">
          <button className="on">PT</button>
          <button>EN</button>
        </div>

        <div className="user">
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{firstName}</div>
            <div className="user-plan">Pro · {currentStreak} dias seguidos</div>
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
    <Link href={href} className={`nav-item${active ? " active" : ""}`}>
      {dot && <span className="nav-dot" style={{ background: dot }} />}
      <span className="nav-label">{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </Link>
  );
}
