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

**Projeto:** Viare — plataforma de educação em cibersegurança com geração de cursos por IA

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

# Zona 3 — Lições Aprendidas

**LL-01:** Output de LLM que vira JSON DEVE ser parseado com Zod — nunca `JSON.parse(...) as T`. Bug conhecido em `lib/generation.ts` linhas ~107 e ~231.
