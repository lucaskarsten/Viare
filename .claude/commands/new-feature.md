# /new-feature — Feature Workflow

Orquestra o ciclo completo de uma nova feature: design → implementação → qualidade → entrega.

**Uso:** `/new-feature <descrição breve da feature>`

## Passo 1 — Classificar a feature

Identificar a categoria principal para definir a sequência correta:

| Categoria             | Indicadores                                  | Sequência                                                   |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| **API/Route Handler** | "endpoint", "rota", "API"                    | Architect → Types → Prisma → Security → Audit               |
| **Feature UI**        | "tela", "componente", "página"               | Architect → UI/UX → CSS → Types → Componentize              |
| **Feature IA**        | "geração", "AI", "curso", "prompt"           | Architect → AI Course Generator → Types → Prisma → Security |
| **Gamificação**       | "achievement", "streak", "progresso", "XP"   | Gamification → Types → Prisma → Security                    |
| **Pagamento**         | "subscription", "Stripe", "plano", "billing" | Architect → Subscription → Types → Security → Audit         |
| **Lab/CTF**           | "lab", "flag", "hint", "CTF"                 | Architect → Lab CTF → Types → Security → Prisma             |
| **Full-stack**        | feature com UI + API + DB                    | Todos os anteriores na ordem correta                        |

## Passo 2 — Design (Architect)

Usar agente `architect` para:

- Definir interface pública da feature (parâmetros, response, estados)
- Identificar mudanças de schema necessárias
- Definir componentes de UI necessários
- Levantar edge cases e business rules afetados

Consultar `BUSINESS_RULES.md` para domínio afetado.

## Passo 3 — Implementação

Executar na ordem da sequência identificada no Passo 1:

**Se tem banco de dados (`/db` automático):**

- Validar schema antes de implementar
- Se nova migration necessária: rodar `/db migrate <nome>`

**Se tem UI:**

- Agente `ui-ux` para estrutura e fluxo
- Agente `css` para implementação de estilos

**Se tem TypeScript/Zod:**

- Agente `types` para schemas de input/output

## Passo 4 — Qualidade

```bash
npm run lint
npx tsc --noEmit
```

Se falhar: corrigir antes de continuar.

## Passo 5 — Security check

Para qualquer feature com:

- Route Handler → verificar RULE-AUTH-01/03
- Dados de usuário → verificar cross-user leakage
- Stripe → verificar RULE-SUB-01
- Labs → verificar RULE-LAB-01

## Passo 6 — Ready check

Rodar `/ready` para checklist final completo antes de considerar a feature done.

## Output esperado ao final

```
=== New Feature: <nome> ===
✅ Categoria: Feature UI + Route Handler
✅ Design: definido (Architect)
✅ UI/UX: componentes estruturados
✅ CSS: tokens corretos, dark mode OK
✅ Types: Zod schemas definidos
✅ DB: schema válido, migration aplicada
✅ Security: RULE-AUTH-01/03 verificados
✅ /ready: TypeScript OK · ESLint OK · Prisma OK
```
