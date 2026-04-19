import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BookOpen, Clock, ChevronRight } from "lucide-react";

const difficultyLabel = { EASY: "Iniciante", MEDIUM: "Intermediário", HARD: "Avançado" };
const difficultyColor = {
  EASY: "text-green-700 bg-green-500/10",
  MEDIUM: "text-yellow-700 bg-yellow-500/10",
  HARD: "text-red-700 bg-red-500/10",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [streakData, completedCount, badgeCount, enrollments] = await Promise.all([
    db.userStreak.findUnique({ where: { userId } }),
    db.userProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.userAchievement.count({ where: { userId } }),
    db.enrollment.findMany({
      where: { userId, status: { not: "ABANDONED" } },
      orderBy: { lastAccessedAt: "desc" },
      take: 6,
      include: {
        course: {
          select: { slug: true, title: true, difficulty: true, estimatedHours: true },
        },
      },
    }),
  ]);

  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).toUpperCase();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = session?.user?.name?.split(" ")[0] ?? "você";
  const currentStreak = streakData?.currentStreak ?? 0;

  return (
    <div className="px-16 py-12 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-mono mb-2">{formattedDate}</p>
        <h1 className="text-3xl font-medium tracking-tight">{greeting}, {firstName}.</h1>
        <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
          <span><strong className="text-foreground font-medium tabular-nums">{currentStreak}</strong> dias de streak</span>
          <span className="text-border">·</span>
          <span><strong className="text-foreground font-medium tabular-nums">{completedCount}</strong> aulas concluídas</span>
          <span className="text-border">·</span>
          <span><strong className="text-foreground font-medium tabular-nums">{badgeCount}</strong> badges</span>
        </div>
      </div>

      {/* Resume card */}
      {enrollments[0] && (
        <Link
          href={`/courses/${enrollments[0].course.slug}`}
          className="block mt-8 rounded-lg border bg-card p-5 flex items-center gap-6 hover:-translate-y-px hover:shadow-sm transition-all"
        >
          <div className="rounded aspect-[16/10] w-44 shrink-0 bg-accent/20" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wide mb-1">A seguir</p>
            <h3 className="font-medium text-[17px] tracking-tight">{enrollments[0].course.title}</h3>
            <p className="text-[13px] text-muted-foreground mt-1">{enrollments[0].progressPercent ?? 0}% concluído</p>
            <div className="h-[3px] rounded-full bg-border mt-3 overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${enrollments[0].progressPercent ?? 0}%` }} />
            </div>
          </div>
          <span className="text-2xl text-muted-foreground px-2">→</span>
        </Link>
      )}

      {/* Course grid */}
      <div className="space-y-3 mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Meus cursos</h2>
          <Link href="/courses" className="text-sm text-primary hover:underline underline-offset-4">
            Ver catálogo →
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Nenhum curso iniciado ainda.{" "}
              <Link href="/courses" className="text-primary underline-offset-4 hover:underline">
                Explorar cursos →
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {enrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.course.slug}`}
                className="group rounded-lg border bg-card p-5 hover:shadow-sm hover:border-primary/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {enrollment.course.title}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={`font-medium px-2 py-0.5 rounded-full text-[11px] ${difficultyColor[enrollment.course.difficulty]}`}>
                    {difficultyLabel[enrollment.course.difficulty]}
                  </span>
                  {enrollment.course.estimatedHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {enrollment.course.estimatedHours}h
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <BookOpen className="h-3 w-3" />
                    {enrollment.progressPercent}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${enrollment.progressPercent}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
