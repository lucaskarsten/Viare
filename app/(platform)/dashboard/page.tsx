import Link from "next/link";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { getTranslations, getLocale } from "next-intl/server";

const COURSE_COLORS = ["#c97a4a", "#8a9a5b", "#6b7a8f", "#b8a06e", "#7a5a8f", "#5a8a8a"];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const dateLocale = locale === "pt" ? "pt-BR" : "en-US";

  function relativeDate(date: Date | null, now: Date): string {
    if (!date) return "—";
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
    if (diffDays === 0) return t("relativeDate.today");
    if (diffDays === 1) return t("relativeDate.yesterday");
    if (diffDays < 7) return t("relativeDate.daysAgo", { count: diffDays });
    if (diffDays < 14) return t("relativeDate.lastWeek");
    return date.toLocaleDateString(dateLocale, { day: "numeric", month: "short" });
  }

  const [streakData, completedCount, enrollments, archivedEnrollments] = await Promise.all([
    db.userStreak.findUnique({ where: { userId } }),
    db.userProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.enrollment.findMany({
      where: { userId, status: { not: "ABANDONED" } },
      orderBy: { lastAccessedAt: "desc" },
      take: 6,
      include: {
        course: {
          select: {
            slug: true,
            title: true,
            description: true,
            difficulty: true,
            estimatedHours: true,
            category: true,
            tags: true,
            _count: { select: { modules: true } },
            modules: {
              orderBy: { order: "asc" },
              take: 1,
              select: {
                order: true,
                lessons: {
                  orderBy: { order: "asc" },
                  take: 1,
                  select: { id: true, title: true, type: true },
                },
              },
            },
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: { userId, status: "ABANDONED" },
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: { course: { select: { slug: true, title: true } } },
    }),
  ]);

  const now = new Date();
  const formattedDate = now.toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting =
    hour < 12 ? t("greetingMorning") : hour < 18 ? t("greetingAfternoon") : t("greetingEvening");
  const firstName = session?.user?.name?.split(" ")[0] ?? "você";
  const currentStreak = streakData?.currentStreak ?? 0;
  const weeklyGoalDone = Math.min(completedCount % 7, 6);
  const weeklyGoal = `${weeklyGoalDone}/6`;

  const resumeEnrollment =
    enrollments.find((e) => e.status === "IN_PROGRESS") ?? enrollments[0] ?? null;
  const resumeColor = COURSE_COLORS[0];

  const resumeNextLesson = resumeEnrollment?.course.modules[0]?.lessons[0] ?? null;
  const resumeModuleNum =
    resumeEnrollment?.course.modules[0]?.order != null
      ? String(resumeEnrollment.course.modules[0].order + 1).padStart(2, "0")
      : "01";

  const remaining = 6 - weeklyGoalDone;
  const motivationalMessage =
    remaining > 0 ? t("motivationLeft", { count: remaining }) : t("motivationDone");

  return (
    <div className="flex flex-col gap-14">
      <header className="flex items-end justify-between gap-12 pb-8 border-b border-border">
        <div>
          <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted-foreground mb-3">
            {formattedDate}
          </div>
          <h1 className="text-[36px] font-medium leading-[1.15] tracking-[-0.02em] m-0 text-balance text-foreground">
            <em className="not-italic text-muted-foreground font-normal">{greeting},</em>{" "}
            {firstName}.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground mt-3.5 max-w-[62ch] text-pretty m-0">
            {motivationalMessage}
          </p>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <div className="text-[28px] leading-none tracking-[-0.03em] font-medium tabular-nums text-foreground">
              {currentStreak}
            </div>
            <div className="text-[11px] text-muted-foreground tracking-[0.05em] uppercase mt-1 font-mono">
              {t("streak")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[28px] leading-none tracking-[-0.03em] font-medium tabular-nums text-foreground">
              {weeklyGoal}
            </div>
            <div className="text-[11px] text-muted-foreground tracking-[0.05em] uppercase mt-1 font-mono">
              {t("weeklyGoal")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[28px] leading-none tracking-[-0.03em] font-medium tabular-nums text-foreground">
              {completedCount}
            </div>
            <div className="text-[11px] text-muted-foreground tracking-[0.05em] uppercase mt-1 font-mono">
              {t("totalLessons")}
            </div>
          </div>
        </div>
      </header>

      {resumeEnrollment && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-medium text-[20px] m-0 tracking-[-0.02em] text-foreground">
              {t("resume")}
            </h2>
            <Link
              href={`/courses/${resumeEnrollment.course.slug}`}
              className="text-muted-foreground text-[13px] px-2.5 py-1.5 rounded no-underline inline-flex items-center transition-colors hover:text-foreground hover:bg-card"
            >
              {t("openCourse")}
            </Link>
          </div>
          <Link
            className="grid grid-cols-[280px_1fr_auto] items-center gap-8 p-6 bg-card rounded-[10px] no-underline text-inherit cursor-pointer transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
            href={
              resumeNextLesson
                ? `/courses/${resumeEnrollment.course.slug}/lessons/${resumeNextLesson.id}`
                : `/courses/${resumeEnrollment.course.slug}`
            }
          >
            <div
              className="aspect-[16/10] rounded relative overflow-hidden text-white"
              style={{ background: resumeColor }}
            >
              <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_8px)]" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="font-mono text-[10px] tracking-[0.08em] opacity-70 relative">
                  Ch. {resumeModuleNum}
                </div>
                <div className="text-[20px] leading-[1.1] relative font-medium tracking-tight">
                  {resumeEnrollment.course.title}
                </div>
              </div>
            </div>
            <div>
              <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted-foreground mb-3">
                {t("upNext", {
                  time: resumeEnrollment.course.estimatedHours
                    ? `${Math.round((resumeEnrollment.course.estimatedHours * 60) / Math.max(resumeEnrollment.course._count.modules, 1))} min`
                    : "14 min",
                })}
              </div>
              <h3 className="font-medium text-[22px] tracking-[-0.025em] mt-1.5 mb-2.5 text-foreground">
                {resumeNextLesson?.title ?? resumeEnrollment.course.title}
              </h3>
              <p className="text-muted-foreground max-w-[58ch] m-0 mb-3.5">
                {resumeEnrollment.course.description}
              </p>
              <div className="text-[12px] text-muted-foreground flex gap-2 items-center">
                <span>
                  {t("lessonOf", { num: 1, total: resumeEnrollment.course._count.modules })}
                </span>
                <span className="opacity-50">·</span>
                <span>
                  {resumeNextLesson
                    ? (t(`lessonKind.${resumeNextLesson.type}` as Parameters<typeof t>[0]) ??
                      resumeNextLesson.type)
                    : t("lessonKind.THEORY")}
                </span>
              </div>
              <div className="h-[3px] bg-border rounded-[2px] overflow-hidden mt-3">
                <div
                  className="h-full bg-accent rounded-[2px] transition-[width_.4s]"
                  style={{ width: `${resumeEnrollment.progressPercent ?? 0}%` }}
                />
              </div>
            </div>
            <div className="text-[28px] text-muted-foreground px-2">→</div>
          </Link>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-medium text-[20px] m-0 tracking-[-0.02em] text-foreground">
            {t("yourCourses")}
          </h2>
          <div className="flex gap-1">
            <button className="text-[12px] px-2.5 py-[5px] rounded-full border-0 cursor-pointer bg-foreground text-background">
              {t("filterAll")}
            </button>
            <button className="text-[12px] px-2.5 py-[5px] rounded-full text-muted-foreground border-0 cursor-pointer hover:text-foreground">
              {t("filterInProgress")}
            </button>
            <button className="text-[12px] px-2.5 py-[5px] rounded-full text-muted-foreground border-0 cursor-pointer hover:text-foreground">
              {t("filterNotStarted")}
            </button>
            <button className="text-[12px] px-2.5 py-[5px] rounded-full text-muted-foreground border-0 cursor-pointer hover:text-foreground">
              {t("filterCompleted")}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {enrollments.map((enrollment, i) => {
            const color = COURSE_COLORS[i % COURSE_COLORS.length];
            const categoryKey = `categoryLabels.${enrollment.course.category}` as Parameters<
              typeof t
            >[0];
            const tag = t(categoryKey) ?? enrollment.course.tags[0] ?? "Curso";
            const lastAccess = relativeDate(enrollment.lastAccessedAt, now);
            const done = Math.round(
              ((enrollment.progressPercent ?? 0) / 100) * enrollment.course._count.modules
            );
            const total = enrollment.course._count.modules;

            return (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.course.slug}`}
                className="bg-card rounded-[10px] overflow-hidden cursor-pointer flex flex-col no-underline text-inherit transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                <div className="aspect-[16/8] relative p-4" style={{ background: color }}>
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_10px)]" />
                  <span className="relative bg-black/20 text-white font-mono text-[10px] tracking-[0.08em] uppercase py-[3px] px-[7px] rounded-[2px] backdrop-blur-sm inline-block">
                    {tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-medium text-[17px] tracking-[-0.015em] m-0 mb-1.5 text-foreground">
                    {enrollment.course.title}
                  </h3>
                  <p className="text-muted-foreground text-[13px] leading-[1.45] m-0 min-h-[38px]">
                    {enrollment.course.description}
                  </p>
                  <div className="text-[11px] text-muted-foreground mt-3.5 flex gap-1.5 items-center">
                    <span>{t("lessonsProgress", { done, total })}</span>
                    <span className="opacity-50">·</span>
                    <span>{lastAccess}</span>
                  </div>
                  <div className="h-[3px] bg-border rounded-[2px] overflow-hidden mt-3">
                    <div
                      className="h-full rounded-[2px] transition-[width_.4s]"
                      style={{ width: `${enrollment.progressPercent ?? 0}%`, background: color }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {archivedEnrollments.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-medium text-[20px] m-0 tracking-[-0.02em] text-foreground">
              {t("archive")}
            </h2>
          </div>
          <ul className="list-none p-0 m-0 border-t border-border">
            {archivedEnrollments.map((e) => (
              <li
                key={e.id}
                className="grid grid-cols-[1fr_auto_auto] gap-6 items-center py-4 px-1 border-b border-border cursor-pointer transition-[padding] hover:pl-3"
              >
                <span className="text-[14px] font-medium tracking-[-0.01em] text-foreground">
                  {e.course.title}
                </span>
                <span className="text-[12px] text-muted-foreground tabular-nums">
                  {t("paused")} ·{" "}
                  {e.updatedAt.toLocaleDateString(dateLocale, { month: "short", year: "numeric" })}
                </span>
                <span className="text-muted-foreground">→</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
