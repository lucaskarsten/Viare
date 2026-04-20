# Orchestrator — Viare

Mapa de agentes disponíveis e sequências de invocação por tipo de tarefa.

## Agentes disponíveis

| Agente              | Arquivo                         | Domínio                                                |
| ------------------- | ------------------------------- | ------------------------------------------------------ |
| Architect           | `agents/architect.md`           | Design de features, ADRs, trade-offs                   |
| Security            | `agents/security.md`            | OWASP + checks Viare                                   |
| Audit               | `agents/audit.md`               | Revisão de Route Handlers                              |
| Bugfix              | `agents/bugfix.md`              | Diagnóstico e correção de bugs                         |
| Refactor            | `agents/refactor.md`            | Refatoração TypeScript                                 |
| Prisma              | `agents/prisma.md`              | Queries, migrations, índices                           |
| Seeds               | `agents/seeds.md`               | Dados de desenvolvimento                               |
| Improvements        | `agents/improvements.md`        | Sugestões de melhoria                                  |
| Componentize        | `agents/componentize.md`        | Extração de componentes                                |
| Slim                | `agents/slim.md`                | Redução de arquivos grandes                            |
| Readme              | `agents/readme.md`              | Documentação                                           |
| Prompt Engineer     | `agents/prompt-engineer.md`     | Prompts de geração                                     |
| AI Course Generator | `agents/ai-course-generator.md` | Pipeline lib/generation.ts                             |
| Gamification        | `agents/gamification.md`        | Progress, achievements, streaks                        |
| Subscription        | `agents/subscription.md`        | Stripe, lifecycle, gating                              |
| Lab CTF             | `agents/lab-ctf.md`             | Labs, flags, hints                                     |
| CSS                 | `agents/css.md`                 | Design system, Tailwind v4, tokens, acessibilidade     |
| Content Safety      | `agents/content-safety.md`      | Prompt injection, content moderation, CONTENT-\* rules |
| UI/UX               | `agents/ui-ux.md`               | Hierarquia visual, componentes, fluxos, acessibilidade |
| Types               | `agents/types.md`               | TypeScript strict, Zod schemas, utility types          |
| Performance         | `agents/performance.md`         | RSC, caching, queries N+1, bundle, Suspense            |

## Sequências por tipo de tarefa

### Nova Route Handler

1. **Architect** — design da API (params, response, auth requirements)
2. **Types** — Zod schema de request body e response
3. **Prisma** — queries necessárias, índices (`/db validate` antes de migrar)
4. **Security** — RULE-AUTH-01/03, cross-user leakage
5. **Audit** — revisão do handler completo

### Nova feature de geração IA

1. **Architect** — design do pipeline
2. **Content Safety** — sanitização de input, política de conteúdo (CONTENT-01/02/03)
3. **AI Course Generator** — invariantes de RULE-AI-\*
4. **Types** — Zod schemas para output do LLM (RULE-AI-01 obrigatório)
5. **Prisma** — schema changes se necessário (`/db migrate` se precisar)
6. **Security** — verificação de input/output

### Feature de fork/compartilhamento de curso

1. **Architect** — design do fluxo de fork (herança de conteúdo, diff de módulos)
2. **Content Safety** — CONTENT-04 (fork herda classificação), re-classificação de conteúdo novo
3. **Prisma** — schema de fork (relação parent → child)
4. **Security** — verificar que fork não expõe dados do autor original

### Feature Stripe

1. **Architect** — design do fluxo de pagamento
2. **Subscription** — RULE-SUB-\*, eventos, lifecycle
3. **Security** — RULE-SUB-01, stripe-signature
4. **Audit** — revisão do webhook handler

### Feature Lab/CTF

1. **Architect** — design do lab
2. **Lab CTF** — RULE-LAB-\*, segurança de flags
3. **Security** — RULE-LAB-01 (flagHash nunca exposto)
4. **Prisma** — schema de Lab, hints

### Feature de Gamificação

1. **Gamification** — RULE-PROG-\*, RULE-ACH-01
2. **Prisma** — queries atômicas, streak UTC
3. **Security** — cross-user leakage em progress

### Bug

1. **Bugfix** — diagnóstico + hipóteses
2. **Security** (se bug de segurança)
3. **Test Writer** — teste de regressão

### Refatoração

1. **Slim** (se arquivo > 500 linhas)
2. **Refactor** — TypeScript strict
3. **Componentize** (se UI)
4. **Security** — verificar que refactor não quebrou guards

### Nova feature UI (componente ou página)

1. **Architect** — design da UI (layout, estados, responsividade)
2. **UI/UX** — hierarquia visual, fluxo, loading states, empty states
3. **CSS** — tokens, decisão utility vs custom, dark mode, paletas
4. **Types** — tipos de props e dados do componente
5. **Componentize** (se extração de componente necessária)
6. **Performance** — RSC vs client, Suspense, caching se necessário
7. **Security** — verificar que não há PII exposto na UI

### Refatoração de CSS

1. **Slim** (se `globals.css` ou componente > 500 linhas)
2. **CSS** — auditoria + consolidação de tokens + anti-padrões
3. **Componentize** (se identificar componentes a extrair)

### Novo componente visual

1. **CSS** — decisão: utility vs custom, tokens corretos, acessibilidade
2. **Componentize** — estrutura do componente, CVA se houver variantes
