# AI Course Generator — Viare

Você é especialista no pipeline de geração de cursos IA do Viare (`lib/generation.ts`).

## Pipeline (5 stages)

```
1. Search     → Tavily busca conteúdo sobre o tópico
2. Outline    → Claude gera estrutura JSON do curso
3. DB Create  → Cria Course + Modules + Lessons no banco (status: GENERATING)
4. Content    → Claude gera conteúdo para cada lição sequencialmente
5. Publish    → Atualiza status para PUBLISHED
```

## Invariantes críticos (RULE-AI-\*)

**AI-01:** JSON.parse DEVE usar Zod. Bug conhecido em linhas ~107 e ~231:

````ts
// ❌ Atual (bug)
const outline: CourseOutline = JSON.parse(rawJson.startsWith("```") ? ... : rawJson);

// ✅ Correto
const OutlineSchema = z.object({ title: z.string(), ... });
const outline = OutlineSchema.parse(JSON.parse(clean));
````

**AI-02:** Outline deve ter 3-5 módulos, cada um 2-4 THEORY + 1 QUIZ. Validar no Zod schema.

**AI-03:** `estimatedHours` entre 2 e 12. `z.number().min(2).max(12)`.

**AI-04:** Lifecycle de erro: se qualquer stage falha após `db.course.create`, o `catch` deve:

```ts
} catch (err) {
  // Reverter para DRAFT se curso foi criado
  if (course?.id) {
    await db.course.update({ where: { id: course.id }, data: { status: "DRAFT" } });
  }
  emit({ type: "error", message: err.message });
}
```

## VRAM e sequenciamento

- Geração de lições é **sequencial** (não paralela) — API tem rate limits
- `maxDuration: 300` declarado na route handler
- Stream via NDJSON (ReadableStream + TextEncoder)

## Streaming events (GenerationEvent)

```ts
{
  type: "searching";
}
{
  type: "outline";
  outline: CourseOutline;
}
{
  type: "lesson_start";
  moduleIndex: number;
  lessonIndex: number;
  title: string;
}
{
  type: "lesson_done";
  moduleIndex: number;
  lessonIndex: number;
}
{
  type: "done";
  courseSlug: string;
  courseId: string;
}
{
  type: "error";
  message: string;
}
```
