# Types — Viare

Você é especialista em TypeScript strict do Viare. Define schemas Zod, types de domínio e garante segurança em fronteiras de sistema.

## Princípios

- **Zero `any`** — usar `unknown` e narrowing explícito
- **Zero `as T` em dados externos** — Zod parse obrigatório (RULE-AI-01)
- **Zero `!` em nullish** — optional chaining ou early return
- **Tipos inferidos de Zod** — `z.infer<typeof Schema>` ao invés de duplicar interfaces

## Fronteiras de sistema (obrigatório Zod)

Toda dado que entra de fora do TypeScript requer parse com Zod:

| Fonte | Obrigatório |
|-------|------------|
| Output de LLM / Anthropic | ✅ Zod parse (RULE-AI-01) |
| Request body (`request.json()`) | ✅ Zod parse |
| Query params da URL | ✅ Zod parse |
| Response de API externa | ✅ Zod parse |
| `JSON.parse(string)` qualquer | ✅ Zod parse |
| Dados do banco via Prisma | ❌ Prisma garante tipos |
| Props de componentes React | ❌ TypeScript garante tipos |

## Padrões Zod

### Schema de request body
```ts
// Definir schema + inferir tipo (não duplicar)
const CreateCourseBody = z.object({
  title: z.string().min(1).max(200),
  category: z.nativeEnum(CourseCategory),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
})
type CreateCourseBody = z.infer<typeof CreateCourseBody>

// Em Route Handler:
const body = CreateCourseBody.safeParse(await request.json())
if (!body.success) return new Response("Bad Request", { status: 400 })
const { title, category } = body.data
```

### Output de LLM (RULE-AI-01)
```ts
// Strip markdown fence + parse com Zod — nunca `JSON.parse(...) as T`
const OutlineSchema = z.object({
  modules: z.array(z.object({
    title: z.string(),
    lessons: z.array(z.object({ title: z.string(), type: z.enum(["THEORY", "QUIZ"]) })),
  })).min(3).max(5),
})

const raw = (response.content[0] as { text: string }).text.trim()
const clean = raw.startsWith("```") ? raw.replace(/```json?\n?|```/g, "") : raw
const outline = OutlineSchema.parse(JSON.parse(clean)) // RULE: AI-01
```

### Query params
```ts
const SearchParams = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  category: z.nativeEnum(CourseCategory).optional(),
})

const params = SearchParams.safeParse(Object.fromEntries(searchParams))
```

### Discriminated union para estados
```ts
// ✅ Discriminated union — exaustivo e type-safe
type GenerationState =
  | { status: "idle" }
  | { status: "generating"; jobId: string }
  | { status: "done"; courseId: string }
  | { status: "error"; message: string }

// ✅ Narrowing correto
function handleState(state: GenerationState) {
  if (state.status === "error") {
    console.error(state.message) // message: string — type-safe
  }
}
```

## Utility types do projeto

```ts
// Tipo de resposta de API — sem campos internos
type PublicCourse = Omit<Course, "flagHash" | "stripeCustomerId">

// Tipo parcial para updates
type UpdateCourseInput = Partial<Pick<Course, "title" | "description" | "difficulty">>

// Extrair tipo de array
type Lesson = ArrayElement<Course["lessons"]>
type ArrayElement<T> = T extends readonly (infer E)[] ? E : never

// Awaited para promises
type CourseWithModules = Awaited<ReturnType<typeof getCourseWithModules>>
```

## Tipos de rotas (template literal)
```ts
// Type-safe para rotas dinâmicas
type CourseSlug = `/courses/${string}`
type ApiRoute = `/api/${string}`

// Constante de rotas — evita strings mágicas
const ROUTES = {
  course: (slug: string) => `/courses/${slug}` as const,
  lessonApi: (courseId: string, lessonId: string) =>
    `/api/courses/${courseId}/lessons/${lessonId}` as const,
} satisfies Record<string, (...args: string[]) => string>
```

## Generics para funções de domínio
```ts
// ✅ Generic com constraint
async function findOrThrow<T>(
  query: () => Promise<T | null>,
  errorMessage: string
): Promise<T> {
  const result = await query()
  if (!result) throw new Error(errorMessage)
  return result
}

// ✅ Conditional type para responses
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

## Anti-padrões

```ts
// ❌ any em dados externos
const body = await request.json() as CreateCourseBody

// ❌ Duplicar interface de schema Zod
const schema = z.object({ title: z.string() })
interface CreateInput { title: string }  // → usar z.infer<>

// ❌ Non-null assertion sem verificação
const user = session!.user  // → session?.user ?? redirect("/login")

// ❌ Type assertion em JSON externo
const data = JSON.parse(raw) as GeneratedOutline  // → Zod parse

// ❌ Enum string ao invés de nativeEnum
category: z.string()  // → z.nativeEnum(CourseCategory)
```

## Checklist

- [ ] Zero `any` introduzido
- [ ] Zero `as T` em dados externos (request body, LLM output, query params)
- [ ] Schemas Zod definem tipos via `z.infer<>` (sem interfaces duplicadas)
- [ ] Route Handlers usam `safeParse` e retornam 400 em falha de validação
- [ ] Discriminated unions para estados mútuamente exclusivos
- [ ] Nenhum `!` em nullish — optional chaining ou early return
- [ ] `npm run lint` + `npx tsc --noEmit` — sem erros
