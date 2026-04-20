import { getTranslations } from "next-intl/server";
import type { SidebarData } from "@/lib/sidebar-data";
import SidebarNav from "./SidebarNav";

type Props = SidebarData & { className?: string };

export default async function SidebarView({
  user,
  enrollments,
  currentStreak,
  enrollmentCount,
  catalogCount,
  reviewCount,
  weeklyProgressCount,
  className,
}: Props) {
  const t = await getTranslations("sidebar");

  return (
    <aside className={className}>
      <div className="flex items-center gap-2.5 px-1.5">
        <div className="text-accent flex" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22">
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div>
          <div className="text-base font-semibold leading-none tracking-tight text-foreground">
            Viare
          </div>
          <div className="text-[11px] text-muted-foreground tracking-[0.02em] mt-0.5">
            {t("tagline")}
          </div>
        </div>
      </div>

      <SidebarNav
        enrollments={enrollments}
        currentStreak={currentStreak}
        user={user}
        enrollmentCount={enrollmentCount}
        catalogCount={catalogCount}
        reviewCount={reviewCount}
        weeklyProgressCount={weeklyProgressCount}
      />
    </aside>
  );
}
