import Link from "next/link";
import { db } from "@/lib/db";
import SidebarUserMenu from "./SidebarUserMenu";

const DOT_COLORS = ["#4a6fa5", "#5a7a4a", "#8a6f3a", "#7a5a8f", "#5a7a7a"];

type SidebarUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default async function Sidebar({ user }: { user: SidebarUser }) {
  const userId = user?.id ?? undefined;

  const [streakData, enrollments] = await Promise.all([
    userId
      ? db.userStreak.findUnique({ where: { userId }, select: { currentStreak: true } })
      : null,
    userId
      ? db.enrollment.findMany({
          where: { userId, status: { not: "ABANDONED" } },
          orderBy: { lastAccessedAt: "desc" },
          take: 5,
          include: { course: { select: { slug: true, title: true } } },
        })
      : [],
  ]);

  const currentStreak = streakData?.currentStreak ?? 0;

  return (
    <aside className="sidebar-aside sticky top-0 h-screen overflow-y-auto flex flex-col bg-sidebar border-r border-sidebar-border px-3 py-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 mb-5">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="8" fill="currentColor" className="text-foreground" />
          <circle cx="14" cy="14" r="12.5" stroke="currentColor" strokeWidth="1.5" className="text-foreground opacity-25" />
        </svg>
        <div>
          <div className="text-base font-semibold tracking-tight text-sidebar-primary">Viare</div>
          <div className="text-[11px] text-muted-foreground leading-none">aprenda o que quiser</div>
        </div>
      </div>

      {/* Generate CTA */}
      <Link
        href="/courses/generate"
        className="flex items-center gap-2 bg-foreground text-background rounded-md px-3 py-2.5 text-[13px] font-medium mb-5 hover:opacity-90 transition-opacity"
      >
        <span className="text-base leading-none">+</span>
        <span className="flex-1">Novo curso</span>
        <kbd className="text-[10px] opacity-50 font-mono">⌘K</kbd>
      </Link>

      {/* Nav: APRENDER */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium px-2 py-1.5">
          Aprender
        </div>
        <NavItem href="/dashboard" label="Biblioteca" />
        <NavItem href="/courses" label="Cursos" />
        <NavItem href="/review" label="Revisão" />
      </div>

      {/* Nav: EM ANDAMENTO */}
      {enrollments.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium px-2 py-1.5">
            Em andamento
          </div>
          {enrollments.map((enrollment, i) => (
            <Link
              key={enrollment.id}
              href={`/courses/${enrollment.course.slug}`}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] text-sidebar-foreground hover:bg-muted/50 transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
              />
              <span className="truncate">{enrollment.course.title}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom: streak + user */}
      <div className="mt-auto">
        <div className="flex items-center gap-1.5 px-2 py-2 text-[13px] text-muted-foreground mb-2">
          <span className="text-orange-500">🔥</span>
          <span><strong className="text-foreground font-medium">{currentStreak}</strong> dias</span>
        </div>
        <div className="border-t border-sidebar-border pt-2">
          <SidebarUserMenu user={user} />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center px-2 py-1.5 rounded text-[13px] text-sidebar-foreground hover:bg-muted/50 transition-colors"
    >
      {label}
    </Link>
  );
}
