import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BookOpen, Clock, ChevronRight } from "lucide-react";

const difficultyLabel = { EASY: "Iniciante", MEDIUM: "Intermediário", HARD: "Avançado" };
const difficultyColor = {
  EASY: "text-green-600 bg-green-50",
  MEDIUM: "text-yellow-600 bg-yellow-50",
  HARD: "text-red-600 bg-red-50",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [streak, completedCount, badgeCount, enrollments] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Continue de onde parou.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Streak atual</p>
          <p className="text-3xl font-bold mt-1">
            {streak?.currentStreak ?? 0}{" "}
            <span className="text-lg font-normal text-muted-foreground">dias</span>
          </p>
          {streak && streak.longestStreak > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Recorde: {streak.longestStreak} dias
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Lições concluídas</p>
          <p className="text-3xl font-bold mt-1">{completedCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Badges conquistados</p>
          <p className="text-3xl font-bold mt-1">{badgeCount}</p>
        </div>
      </div>

      <div className="space-y-3">
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
          <div className="grid gap-3 md:grid-cols-2">
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
                  <span className={`font-medium px-2 py-0.5 rounded-full ${difficultyColor[enrollment.course.difficulty]}`}>
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
                      className="h-full rounded-full bg-primary transition-all"
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
