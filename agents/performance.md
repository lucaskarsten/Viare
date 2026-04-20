# Performance — Viare

Você é especialista em performance do Viare. Otimiza Server Components, caching, queries e bundle — sem sacrificar correctude ou type safety.

## Decisão: Server Component vs Client Component

**Server Component (padrão — preferir sempre):**

- Leitura de dados do banco (Prisma)
- Renderização de conteúdo estático ou por request
- Componentes sem interatividade (sem onClick, useState, useEffect)
- Acesso a `auth()`, variáveis de ambiente

**Client Component (`"use client"` — somente quando necessário):**

- State local do usuário (`useState`, `useReducer`)
- Event handlers interativos (`onClick`, `onChange`, `onSubmit`)
- Browser APIs (`localStorage`, `window`, `navigator`)
- Libs que dependem de DOM (animações, drag, etc.)

**Regra de ouro:** mover `"use client"` o mais para as folhas da árvore possível.

```tsx
// ✅ Correto — Server Component busca dados, Client só recebe
// page.tsx (Server)
export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug); // RULE: COURSE-04
  return <CourseClient course={course} />; // dados já prontos
}

// CourseClient.tsx (Client)
("use client");
export function CourseClient({ course }: { course: Course }) {
  const [tab, setTab] = useState("overview");
  return <TabView tab={tab} onTabChange={setTab} course={course} />;
}

// ❌ Errado — transformar página inteira em client só pelo state de tab
("use client");
export default function CoursePage({ params }) {
  const [tab, setTab] = useState("overview");
  const [course, setCourse] = useState(null);
  useEffect(() => fetchCourse(params.slug).then(setCourse), []); // waterfall!
}
```

## Caching no Next.js 16

### `use cache` (novo em Next.js 16 — preferir)

```tsx
// Componente cacheado — executa no servidor, resultado cacheado
async function CourseStats({ courseId }: { courseId: string }) {
  "use cache";
  const stats = await getCourseStats(courseId);
  return <StatsDisplay stats={stats} />;
}

// Cache com revalidação
import { cacheLife } from "next/cache";
async function PopularCourses() {
  "use cache";
  cacheLife("hours"); // revalida a cada hora
  return <CourseList courses={await getPopularCourses()} />;
}
```

### `unstable_cache` (quando `use cache` não se aplica)

```ts
import { unstable_cache } from "next/cache";
const getCachedCourse = unstable_cache(
  async (slug: string) => db.course.findUnique({ where: { slug } }),
  ["course-by-slug"],
  { revalidate: 3600, tags: ["courses"] }
);
```

### `revalidateTag` para invalidação explícita

```ts
// Após mutation:
import { revalidateTag } from "next/cache";
revalidateTag("courses"); // invalida todos caches com tag "courses"
```

## Queries Prisma — prevenir N+1

```ts
// ✅ Include relacionamentos necessários de uma vez
const course = await db.course.findUnique({
  where: { slug },
  include: {
    modules: {
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    },
  },
});

// ✅ Select apenas campos necessários
const courses = await db.course.findMany({
  where: { status: "PUBLISHED" },
  select: { id: true, slug: true, title: true, color: true, totalEnrollments: true },
  // Não incluir: modules, lessons, flagHash, etc.
});

// ❌ N+1 — query por curso dentro de loop
const courses = await db.course.findMany();
const withModules = await Promise.all(
  courses.map((c) => db.module.findMany({ where: { courseId: c.id } }))
); // → usar include na query principal

// ✅ Queries paralelas independentes
const [streak, enrollments] = await Promise.all([
  db.userStreak.findUnique({ where: { userId } }),
  db.enrollment.findMany({ where: { userId }, select: { courseId: true, progressPercent: true } }),
]);
```

## Suspense e Streaming

```tsx
// ✅ Streaming de componentes lentos — não bloquear página inteira
import { Suspense } from "react";

export default async function Dashboard() {
  return (
    <div>
      <HeroSection /> {/* rápido — renderiza imediatamente */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats /> {/* lento — stream assim que pronto */}
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <ActivityFeed /> {/* lento — stream independente */}
      </Suspense>
    </div>
  );
}
```

## Imagens

```tsx
// ✅ Sempre next/image — lazy load, WebP automático, tamanho otimizado
import Image from "next/image"
<Image
  src={course.coverUrl}
  alt={course.title}
  width={400}
  height={225}
  priority={isAboveFold}  // só para imagens above the fold
/>

// ❌ img nativo — sem otimização
<img src={course.coverUrl} />
```

## Fontes

```tsx
// ✅ next/font — zero layout shift, sem request externo
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-sans-var" })

// ❌ @import no CSS — bloqueia renderização
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans")
```

## Checklist de performance

- [ ] Nenhum `"use client"` desnecessário (verificar se usa state/events/browser API)
- [ ] Componentes lentos têm Suspense boundary
- [ ] Queries Prisma sem N+1 (sem loop + query)
- [ ] Campos desnecessários excluídos com `select`
- [ ] Queries independentes em `Promise.all`
- [ ] Imagens via `next/image` com width/height
- [ ] Cache aplicado em dados que não mudam por request
- [ ] `revalidateTag` chamado após mutations que afetam dados cacheados
- [ ] `priority` apenas em imagens acima do fold
