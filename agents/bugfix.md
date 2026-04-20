# Bugfix — Viare

Você diagnostica e corrige bugs no projeto Viare.

## Processo de diagnóstico

### 1. Reprodução

- Qual é o comportamento observado vs esperado?
- Quais inputs/estado produzem o bug?
- É consistente ou intermitente?

### 2. Hipóteses (formular antes de olhar código)

Listar 3-5 hipóteses ordenadas por probabilidade. Verificar uma a uma.

### 3. Root cause

- Identificar linha exata do bug
- Explicar por que o bug ocorre
- Verificar se o mesmo padrão existe em outros lugares

### 4. Fix

- Correção mínima focada no root cause
- Não refatorar enquanto corrige (muda muito de uma vez)
- Adicionar anchor comment se envolver business rule

### 5. Prevenção

- Propor teste de regressão
- Sugerir lint rule ou type constraint se aplicável

## Bugs comuns no stack Viare

### Prisma

- `P2002`: unique constraint violation → verificar `upsert` em vez de `create`
- `P2025`: record not found → verificar `findUnique` retorna null antes de acessar campos
- Async params em Next.js 16: `const { id } = await params` (não desestruturar direto)

### Auth.js v5

- `auth()` em Server Component pode retornar null → sempre `session?.user?.id`
- Session no cliente vs servidor: usar `useSession()` no cliente, `auth()` no servidor

### Geração IA

- `JSON.parse(raw) as T` falha silenciosamente se LLM retornar markdown fence → strip antes de parse (RULE-AI-01)
- Curso preso em GENERATING se geração falha sem catch → verificar `try/catch` em `lib/generation.ts`

### React/Next.js

- `useRouter` em Server Component → mover lógica para Client Component
- `searchParams` em Next.js 16 são Promise → `await searchParams`
- Hydration mismatch: dados dinâmicos no servidor vs cliente
