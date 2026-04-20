# /ready — Pre-flight checklist

Execute estes 5 passos em ordem. BLOQUEANTE = interromper se falhar.

## Passo 1 — TypeScript + Lint (BLOQUEANTE)

```bash
npx tsc --noEmit
npm run lint
```

Reportar todos os erros. Não prosseguir se houver erros.

## Passo 2 — Prisma schema (BLOQUEANTE)

```bash
npx prisma validate
```

Se inválido: identificar o erro e corrigir antes de continuar.

## Passo 3 — Auditoria de segurança

Verificar no diff atual:

- **RULE-AUTH-01:** toda nova Route Handler chama `auth()` e valida `session?.user?.id`?
- **RULE-AUTH-03:** queries Prisma com dados de usuário incluem `where: { userId }`?
- **RULE-SUB-01:** novo webhook Stripe verifica `stripe-signature`?
- **RULE-LAB-01:** nenhum endpoint retorna `flagHash`?
- **RULE-AI-01:** output de LLM parseado com Zod (não `JSON.parse(...) as T`)?

## Passo 4 — Business Rules no diff

- Buscar anchor comments `// RULE: XX-NN` no código alterado
- Identificar lógica de domínio sem anchor e propor adição
- Verificar se alguma regra do BUSINESS_RULES.md foi violada

## Passo 5 — Checklist manual

- [ ] Sem `console.log` com dados de usuário ou PII
- [ ] Sem secrets ou tokens hardcoded
- [ ] Toda nova rota tem auth guard (`auth()` + verificação de sessão)
- [ ] Migration criada se `schema.prisma` foi alterado (`npx prisma migrate dev --name <desc>`)
- [ ] Sem `as T` em dados vindos de APIs externas ou LLM

## Output esperado

```
✅ TypeScript: sem erros
✅ ESLint: sem erros
✅ Prisma: schema válido
⚠️ RULE-AUTH-01: rota /api/courses/enroll verificada ✓
✅ Business Rules: 2 anchors encontrados
✅ Checklist manual: OK
```
