# /pr — Workflow completo de Pull Request

## Passo 1 — Estado atual

```bash
git status
git diff main...HEAD --stat
git log main...HEAD --oneline
```

## Passo 2 — Quality gate (BLOQUEANTE)

```bash
npm run lint
npx tsc --noEmit
npx prisma validate
```

Se qualquer falhar: corrigir antes de continuar.

## Passo 3 — Revisão de segurança

Rodar `/security` mentalmente sobre o diff:

- AUTH-01/03: auth guards presentes?
- AI-01: Zod em todos os JSON.parse de LLM?
- LAB-01: flagHash nunca exposto?
- SUB-01: stripe-signature verificado em webhooks?

## Passo 4 — Diff por camada

Analisar mudanças em cada camada:

- `prisma/` — schema e migrations
- `app/api/` — Route Handlers
- `lib/` — lógica de domínio
- `app/(platform)/` — páginas autenticadas
- `app/(marketing)/` — páginas públicas
- `components/` — componentes UI

## Passo 5 — Título do PR

Formato: `tipo(escopo): descrição concisa`
Tipos: feat, fix, refactor, chore, docs

## Passo 6 — Corpo do PR

```markdown
## Resumo

<!-- 2-3 bullets sobre o que muda e por quê -->

## Mudanças por camada

<!-- tabela ou lista por layer -->

## Checklist

- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] ESLint sem erros (`npm run lint`)
- [ ] Prisma schema válido (`npx prisma validate`)
- [ ] BUSINESS_RULES respeitadas (anchors no código)
- [ ] Auth guards em todas as novas rotas
- [ ] Sem secrets hardcoded
- [ ] Migration criada se schema mudou
```

## Passo 7 — Criar PR

```bash
gh pr create --title "<título>" --body "<corpo>"
```

## Passo 8 — Verificação pós-criação

```bash
gh pr view --web
```

## Passo 9 — Cleanup

```bash
git branch --show-current  # confirmar que não está em main
```
