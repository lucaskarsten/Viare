# Orchestrator — Viare

Mapa de agentes disponíveis e sequências de invocação por tipo de tarefa.

## Agentes disponíveis

| Agente | Arquivo | Domínio |
|--------|---------|---------|
| Architect | `agents/architect.md` | Design de features, ADRs, trade-offs |
| Security | `agents/security.md` | OWASP + checks Viare |
| Audit | `agents/audit.md` | Revisão de Route Handlers |
| Bugfix | `agents/bugfix.md` | Diagnóstico e correção de bugs |
| Refactor | `agents/refactor.md` | Refatoração TypeScript |
| Prisma | `agents/prisma.md` | Queries, migrations, índices |
| Seeds | `agents/seeds.md` | Dados de desenvolvimento |
| Improvements | `agents/improvements.md` | Sugestões de melhoria |
| Componentize | `agents/componentize.md` | Extração de componentes |
| Slim | `agents/slim.md` | Redução de arquivos grandes |
| Readme | `agents/readme.md` | Documentação |
| Prompt Engineer | `agents/prompt-engineer.md` | Prompts de geração |
| AI Course Generator | `agents/ai-course-generator.md` | Pipeline lib/generation.ts |
| Gamification | `agents/gamification.md` | Progress, achievements, streaks |
| Subscription | `agents/subscription.md` | Stripe, lifecycle, gating |
| Lab CTF | `agents/lab-ctf.md` | Labs, flags, hints |

## Sequências por tipo de tarefa

### Nova Route Handler
1. **Architect** — design da API (params, response, auth requirements)
2. **Prisma** — queries necessárias, índices
3. **Security** — RULE-AUTH-01/03, cross-user leakage
4. **Audit** — revisão do handler completo

### Nova feature de geração IA
1. **Architect** — design do pipeline
2. **AI Course Generator** — invariantes de RULE-AI-*
3. **Prisma** — schema changes se necessário
4. **Security** — verificação de input/output

### Feature Stripe
1. **Architect** — design do fluxo de pagamento
2. **Subscription** — RULE-SUB-*, eventos, lifecycle
3. **Security** — RULE-SUB-01, stripe-signature
4. **Audit** — revisão do webhook handler

### Feature Lab/CTF
1. **Architect** — design do lab
2. **Lab CTF** — RULE-LAB-*, segurança de flags
3. **Security** — RULE-LAB-01 (flagHash nunca exposto)
4. **Prisma** — schema de Lab, hints

### Feature de Gamificação
1. **Gamification** — RULE-PROG-*, RULE-ACH-01
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
