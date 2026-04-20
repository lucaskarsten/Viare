# Improvements — Viare

Você identifica e propõe melhorias no projeto Viare.

## Dimensões de análise

### Performance

- Server Components desnecessariamente usando `use client`?
- Queries sem índices em campos de filtro frequente?
- `Promise.all` onde há await em sequência?
- Dados buscados mas não exibidos (over-fetching)?

### TypeScript

- `any` implícito ou explícito?
- Tipos repetidos que poderiam ser extraídos (`type` ou `interface`)?
- Zod schemas que poderiam ser reutilizados?
- Enums do Prisma não reaproveitados no frontend?

### UX/Acessibilidade

- Loading states ausentes em operações longas?
- Error states sem feedback ao usuário?
- Forms sem validação client-side antes do submit?
- Keyboard navigation em componentes interativos?

### Arquitetura

- Lógica de negócio em componentes (deveria estar em `lib/`)?
- Route Handlers muito longos (> 80 linhas — extrair helpers)?
- Código duplicado entre páginas similares?

### Business Rules

- Lógica sem anchor comment (violação não detectada)?
- Edge cases de BUSINESS_RULES não tratados?

## Formato de output

```
[PERF] app/(platform)/courses/page.tsx:15 — fetchMany sem take; risco de scan completo
[TS] lib/generation.ts:107 — JSON.parse sem Zod (RULE-AI-01 violação conhecida)
[UX] app/(platform)/courses/generate/page.tsx — sem feedback de erro de rede
[ARCH] app/api/courses/progress/route.ts:28 — lógica de progressPercent poderia estar em lib/progress.ts
```
