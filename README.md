# Viare

Plataforma de educação em cibersegurança com geração de cursos por IA. Cursos estruturados são criados sob demanda combinando pesquisa web (Tavily) e geração de conteúdo (Claude), com lições teóricas, quizzes, labs CTF e gamificação.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Banco | PostgreSQL + Prisma 5 |
| Auth | Auth.js v5 (Google, GitHub) |
| UI | Tailwind CSS v4 + shadcn/ui |
| IA | Anthropic Claude + Tavily |
| Pagamentos | Stripe |
| Testes | Vitest 2 + @testing-library/react |
| Deploy | Vercel |

## Setup local

### 1. Clone e instale dependências

```bash
git clone <repo>
cd Viare
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável | Descrição | Onde obter |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | [Neon](https://neon.tech) (gratuito) |
| `AUTH_SECRET` | Segredo do Auth.js | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` | OAuth Google | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` | OAuth GitHub | [GitHub Developer Settings](https://github.com/settings/developers) |
| `ANTHROPIC_API_KEY` | API do Claude | [console.anthropic.com](https://console.anthropic.com) |
| `TAVILY_API_KEY` | Pesquisa web para geração de cursos | [tavily.com](https://tavily.com) |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Pagamentos | [Stripe Dashboard](https://dashboard.stripe.com) |

### 3. Configure o banco

```bash
npx prisma migrate dev --name init
```

### 4. Rode o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Funcionalidades

- **Geração de cursos com IA** — digite um tópico, a IA pesquisa e monta módulos + lições + quizzes
- **Catálogo de cursos** — busca por tópico, filtro por dificuldade, avaliações
- **Player de aulas** — lições teóricas (markdown), quizzes interativos, navegação prev/next
- **Progresso e gamificação** — streak diário, % de conclusão, badges
- **Subscriptions** — planos via Stripe

## Desenvolvimento

```bash
npm run dev          # servidor de desenvolvimento
npm test             # suite de testes (Vitest)
npm run test:watch   # testes em modo watch (TDD)
npm run lint         # ESLint
npx tsc --noEmit     # type check
npx prisma studio    # interface do banco
```

## Estrutura

```
app/
  (marketing)/          — Landing page pública
  (platform)/
    dashboard/          — Dashboard com progresso real
    courses/            — Catálogo, detalhe, geração e player de aulas
  api/courses/          — Route Handlers (generate, enroll, progress)
  login/                — Autenticação
agents/                 — Agentes de prompt Claude Code por domínio
.claude/
  agents/               — Agentes remotos (security, test-writer, etc.)
  commands/             — /ready, /pr, /learn
  hooks/                — Lint e gate de commit automáticos
lib/
  generation.ts         — Pipeline de geração: Tavily → Claude → DB
  db.ts                 — Prisma client singleton
prisma/
  schema.prisma         — Schema completo
__tests__/              — Testes Vitest organizados por camada
BUSINESS_RULES.md       — Regras de negócio com anchor comments
```
