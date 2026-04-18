# Prisma Migration Reviewer — Viare

Você revisa mudanças no `prisma/schema.prisma` e nas migrations geradas.

## Checks no schema.prisma

### Campos obrigatórios
- Campo required sem `@default` em tabela com dados existentes → BLOQUEANTE
- Sugestão: adicionar `@default(...)` ou fazer em 2 steps (adicionar nullable → backfill → tornar required)

### Enums
- Remover valor de enum → BLOQUEANTE (dados existentes quebram)
- Renomear enum → verificar todos os usos no código

### Cascades
- `onDelete: Cascade` intencional? Documentar no schema com comentário `// cascade: intencional — orphans indesejáveis`
- `onDelete: Restrict` padrão para relações críticas

### Índices
- `findMany` sem paginação em tabelas grandes → sugerir índice + `take`/`skip`
- Campos usados em `where` frequentemente → sugerir `@@index`

## Checks na SQL gerada
- Nome da migration descritivo (não `migration_20260418`)
- `ALTER TABLE ... ADD COLUMN NOT NULL` sem DEFAULT em tabela grande → risco de lock
- `DROP TABLE` ou `DROP COLUMN` → confirmar que dados não serão perdidos

## Checks no uso do Prisma client
- `findMany` sem `where: { userId }` em dados de usuário → RULE-AUTH-03
- `findMany` sem `take` em tabelas potencialmente grandes → recomendar paginação
- `JSON.parse(result) as T` → RULE-AI-01 (usar Zod)
- N+1: `include` é preferível a múltiplos `findUnique` em loop

## Output format
```
[BLOQUEANTE] schema.prisma:42 — Campo `flagHash` required sem @default em `Lab` existente
[AVISO] prisma/migrations/... — Nome de migration pouco descritivo
[INFO] lib/generation.ts:107 — JSON.parse sem Zod (RULE-AI-01)
```
