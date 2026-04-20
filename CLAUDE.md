@AGENTS.md

# Zona 1 — Regras de Negócio (consulta obrigatória)

Antes de alterar qualquer lógica de domínio (acesso a cursos, geração IA, subscriptions, progresso/gamificação, labs), verifique `BUSINESS_RULES.md`.

Quando implementar lógica de domínio: adicionar anchor comment `// RULE: XX-NN — descrição` na linha relevante.

Quando detectar regra implícita no código ou em conversa ("não pode", "somente se", "decidimos que"): implementar com anchor + propor adição ao BUSINESS_RULES.md.

Workflow obrigatório (3 fases):

1. **Leitura:** ler arquivo(s) relevante(s) + BUSINESS_RULES.md para domínio afetado
2. **Implementação:** escrever código + anchor comments
3. **Verificação:** `npm run lint` + `npx tsc --noEmit`

# Zona 2 — Stack & Paths

**Projeto:** Viare — plataforma de aprendizado com geração e gestão de cursos por IA, para qualquer tópico. Modelo GitHub: usuários criam, forkam e compartilham cursos. Vende gestão/organização, não cursos.

**Stack:** Next.js 16 App Router · TypeScript strict · Prisma 5 · Auth.js v5 · Tailwind v4 · shadcn/ui · Anthropic SDK + Tavily · Stripe

**Paths importantes:**

- `app/api/` — Route Handlers (POST/GET)
- `app/(platform)/` — páginas autenticadas
- `app/(marketing)/` — páginas públicas
- `lib/` — lógica de domínio reutilizável
- `prisma/schema.prisma` — schema único
- `proxy.ts` — auth gate (substitui middleware.ts no Next.js 16)

**Comandos úteis:**

```bash
npm run dev           # dev server
npm run lint          # ESLint
npx tsc --noEmit      # type check
npx prisma studio     # DB browser
npx prisma migrate dev --name <nome>  # nova migration
```

**Agentes disponíveis** (em `agents/`):
| Agente | Domínio |
|--------|---------|
| orchestrator | mapa de sequências por tipo de tarefa |
| architect | design de features, ADRs |
| security | OWASP + checks específicos do Viare |
| audit | revisão de rotas API |
| bugfix | diagnóstico de bugs |
| refactor | refatoração com TypeScript strict |
| prisma | queries, migrations, índices |
| seeds | dados de seed para desenvolvimento |
| improvements | sugestões de melhoria |
| componentize | extração de componentes React |
| slim | redução de arquivos grandes |
| readme | documentação |
| prompt-engineer | prompts de geração de cursos/labs |
| ai-course-generator | pipeline `lib/generation.ts` |
| gamification | progress, achievements, streaks |
| subscription | Stripe, lifecycle, feature gating |
| lab-ctf | labs, CTF, flags, hints |
| css | CSS, design system, Tailwind v4, tokens, acessibilidade |
| content-safety | prompt injection, content moderation, política de conteúdo |
| ui-ux | hierarquia visual, componentes, fluxos, loading states |
| types | TypeScript strict, Zod schemas, utility types, fronteiras de sistema |
| performance | RSC vs client, caching, N+1, Suspense, bundle |

# Zona 3 — Lições Aprendidas

**LL-01:** Output de LLM que vira JSON DEVE ser parseado com Zod — nunca `JSON.parse(...) as T`. Bug conhecido em `lib/generation.ts` linhas ~107 e ~231.

# Zona 4 — OMC Command Protocol (obrigatório)

Antes de executar qualquer tarefa, identifique a categoria e sugira/use o melhor comando OMC:

| Categoria de Tarefa                                | Skill OMC Recomendada                  | Invocação                                                     |
| -------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Feature nova complexa (full lifecycle)             | `autopilot`                            | `/oh-my-claudecode:autopilot` ou diga "autopilot"             |
| Loop até completar com verificação                 | `ralph`                                | `/oh-my-claudecode:ralph` ou diga "ralph"                     |
| Múltiplas tarefas independentes em paralelo        | `ultrawork`                            | `/oh-my-claudecode:ultrawork` ou `ulw`                        |
| N agentes coordenados em pipeline                  | `team`                                 | `/oh-my-claudecode:team`                                      |
| Planejamento consensual (planner+architect+critic) | `ralplan`                              | `/oh-my-claudecode:ralplan` ou "ralplan"                      |
| Requisitos vagos / entrevista antes de agir        | `deep-interview`                       | `/oh-my-claudecode:deep-interview` ou "deep interview"        |
| Bug / diagnóstico de root cause                    | `debug` + agente `debugger`            | `/oh-my-claudecode:debug`                                     |
| Refatoração / simplificação de código              | `ai-slop-cleaner` ou `code-simplifier` | `/oh-my-claudecode:ai-slop-cleaner`                           |
| Code review                                        | agente `code-reviewer`                 | `Agent(subagent_type="oh-my-claudecode:code-reviewer")`       |
| Verificação pós-implementação                      | `verify`                               | `/oh-my-claudecode:verify`                                    |
| QA / testes iterativos                             | `ultraqa`                              | `/oh-my-claudecode:ultraqa`                                   |
| Pesquisa em docs externos / SDK                    | agente `document-specialist`           | `Agent(subagent_type="oh-my-claudecode:document-specialist")` |
| Exploração de codebase                             | agente `explore`                       | `Agent(subagent_type="Explore")`                              |
| Análise profunda / investigação                    | `deep-dive`                            | `/oh-my-claudecode:deep-dive` ou "deep-analyze"               |
| Comparação visual UI                               | `visual-verdict`                       | `/oh-my-claudecode:visual-verdict`                            |
| Planejamento estratégico                           | `plan`                                 | `/oh-my-claudecode:plan`                                      |
| Security audit                                     | agente `security-reviewer`             | `Agent(subagent_type="oh-my-claudecode:security-reviewer")`   |
| Git / commits / PRs                                | agente `git-master`                    | `Agent(subagent_type="oh-my-claudecode:git-master")`          |
| Testes / cobertura                                 | agente `test-engineer`                 | `Agent(subagent_type="oh-my-claudecode:test-engineer")`       |

**Protocolo obrigatório:**

1. Ao receber qualquer tarefa, identificar a(s) categoria(s) acima
2. Listar em 1-2 linhas os comandos OMC aplicáveis
3. Usar o comando recomendado — não executar manualmente o que uma skill faz melhor

**Keywords automáticas** (incluir na mensagem para ativar o modo):

- `ultrathink` → reasoning profundo
- `deepsearch` → busca exaustiva no codebase
- `deslop` / `anti-slop` → limpeza de código AI-gerado
- `tdd` → modo test-first
- `cancelomc` → cancelar modo ativo

# Zona 5 — Detecção contextual automática (invocar sem o usuário pedir)

Ao identificar qualquer situação abaixo, invocar o workflow/agente correspondente **proativamente**:

| Situação detectada                                                                           | Ação automática                                                                          |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Usuário descreve feature nova, diz "quero X", "implementar Y", "adicionar Z"                 | Iniciar `/new-feature <descrição>`                                                       |
| Diff final contém mudanças em `.tsx` ou `.css`                                               | Rodar `/css` antes de finalizar                                                          |
| Diff final contém strings PT/EN hard-coded em UI (texto JSX, placeholder, aria-label, title) | Rodar `/i18n` antes de finalizar — i18n é **obrigatório** no projeto                     |
| Criar arquivo `.tsx` novo com conteúdo visível                                               | Aplicar `/i18n --new` no mesmo passo — nascer já com `useTranslations`/`getTranslations` |
| Mudança em `prisma/schema.prisma`                                                            | Rodar `/db validate` + alertar sobre migration                                           |
| Antes de reportar feature como concluída                                                     | Rodar `/ready`                                                                           |
| Request body, query param ou output de LLM sem Zod                                           | Alertar RULE-AI-01, consultar agente `types`                                             |
| Componente com `"use client"` novo ou data fetching                                          | Verificar com agente `performance` se RSC não basta                                      |
| Novo componente visual ou refatoração de UI                                                  | Consultar agente `ui-ux` para estrutura antes de implementar                             |
| Diff pronto para commit/PR                                                                   | Rodar `/pr`                                                                              |

**Comandos disponíveis neste projeto:**

| Comando        | Quando usar                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/new-feature` | Iniciar qualquer feature nova                                                                                                                                                      |
| `/css`         | Revisão de CSS após mudanças de estilo                                                                                                                                             |
| `/i18n`        | Auditar e migrar strings PT/EN para next-intl (PT/EN em `messages/*.json`) — **obrigatório** antes de finalizar qualquer tarefa com `.tsx` novo ou modificado com strings visíveis |
| `/db`          | Operações Prisma (validate, migrate)                                                                                                                                               |
| `/ready`       | Checklist antes de PR                                                                                                                                                              |
| `/pr`          | Criar Pull Request                                                                                                                                                                 |
| `/learn`       | Extrair aprendizados após implementação                                                                                                                                            |
