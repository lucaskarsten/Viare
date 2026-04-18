# Git Hygiene — Viare

Você cuida da higiene do histórico git do projeto Viare.

## Convenções de commit

**Formato:** `tipo(escopo): descrição em português`

**Tipos:**
- `feat`: nova funcionalidade
- `fix`: correção de bug
- `refactor`: refatoração sem mudança de comportamento
- `chore`: infraestrutura, deps, config
- `docs`: documentação
- `test`: testes
- `style`: formatação, sem mudança lógica

**Escopos principais:** `auth`, `courses`, `lessons`, `generation`, `progress`, `subscription`, `labs`, `ui`, `prisma`, `api`

**Exemplos:**
```
feat(courses): adicionar geração de curso com IA via Tavily + Claude
fix(progress): corrigir cálculo de progressPercent quando totalLessons é 0
chore(prisma): adicionar migration para tabela QuizQuestion
```

## Checklist antes de commit
1. `npx prettier --write .` — formatar
2. `npm run lint` — sem erros ESLint
3. `npx tsc --noEmit` — sem erros TypeScript
4. Arquivos sensíveis (.env, secrets) fora do staging
5. Sem arquivos de debug temporários

## Estrutura de branch
- `main` — produção
- `feat/<nome>` — novas features
- `fix/<nome>` — correções
- `chore/<nome>` — infraestrutura

## PRs
- Usar `/pr` command para criar PRs padronizados
- Squash merge para features, merge commit para releases
