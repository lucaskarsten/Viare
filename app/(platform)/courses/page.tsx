import Link from "next/link";
import { db } from "@/lib/db";
import { Sparkles, Star, Users, Clock, BookOpen } from "lucide-react";
import CourseSearch from "./CourseSearch";

type SearchParams = Promise<{ q?: string; difficulty?: string }>;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, difficulty } = await searchParams;

  const courses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { topic: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
        ],
      }),
      ...(difficulty && { difficulty: difficulty as "EASY" | "MEDIUM" | "HARD" }),
    },
    orderBy: [{ avgRating: "desc" }, { totalEnrollments: "desc" }],
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      topic: true,
      tags: true,
      difficulty: true,
      estimatedHours: true,
      avgRating: true,
      totalRatings: true,
      totalEnrollments: true,
      sourceType: true,
    },
  });

  const difficultyLabel = {
    EASY: "Iniciante",
    MEDIUM: "Intermediário",
    HARD: "Avançado",
  };

  const difficultyColor = {
    EASY: "text-green-600 bg-green-50",
    MEDIUM: "text-yellow-600 bg-yellow-50",
    HARD: "text-red-600 bg-red-50",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Cursos</h1>
          <p className="text-muted-foreground mt-1">
            Cursos gerados por IA, revisados pela comunidade
          </p>
        </div>
        <Link
          href="/courses/generate"
          className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Criar curso com IA
        </Link>
      </div>

      <CourseSearch initialQ={q} initialDifficulty={difficulty} />

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="font-medium">Nenhum curso encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            {q ? `Sem resultados para "${q}".` : "Seja o primeiro a criar um!"}
          </p>
          <Link
            href="/courses/generate"
            className="mt-4 flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Gerar curso
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group rounded-xl border bg-card p-5 hover:shadow-md transition-all hover:border-primary/30 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h2>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor[course.difficulty]}`}
                >
                  {difficultyLabel[course.difficulty]}
                </span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {course.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
                {course.totalRatings > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {course.avgRating.toFixed(1)}
                    <span>({course.totalRatings})</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {course.totalEnrollments}
                </span>
                {course.estimatedHours && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.estimatedHours}h
                  </span>
                )}
                {course.sourceType === "AI_GENERATED" && (
                  <span className="ml-auto flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    IA
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
