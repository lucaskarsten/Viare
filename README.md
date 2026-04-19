# Viare

Plataforma de aprendizado com geração e gestão de cursos personalizados por IA. Você não compra cursos — você organiza e gerencia seu próprio catálogo de conhecimento sobre qualquer assunto.

Funciona como um GitHub para cursos: crie os seus, faça fork de cursos da comunidade, customize e compartilhe de volta.

## Como funciona

1. **Crie** — informe um tópico qualquer, a IA pesquisa (Tavily) e monta módulos + lições + quizzes
2. **Gerencie** — organize seu catálogo, acompanhe progresso, gamificação com streaks e conquistas
3. **Fork** — pegue um curso existente, customize para o seu contexto e compartilhe com a comunidade

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Banco | PostgreSQL + Prisma 5 |
| Auth | Auth.js v5 (Google, GitHub) |
| UI | Tailwind CSS v4 + shadcn/ui |
| IA | Anthropic Claude + Tavily |
| Pagamentos | Stripe |
| Testes | Vitest + @testing-library/react |
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

- **Geração de cursos com IA** — qualquer tópico: programação, idiomas, história, medicina, negócios...
- **Fork & customize** — fork de cursos da comunidade, edite módulos e lições, publique sua versão
- **Catálogo** — busca por tópico, filtro por dificuldade, avaliações da comunidade
- **Player de aulas** — lições em markdown, quizzes interativos, navegação prev/next
- **Progresso e gamificação** — streak diário, % de conclusão, badges
- **Subscriptions** — planos via Stripe (gestão e criação ilimitada de cursos)

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
  commands/             — /ready, /pr, /learn, /css, /db, /new-feature
  hooks/                — Lint e gate de commit automáticos
lib/
  generation.ts         — Pipeline de geração: Tavily → Claude → DB
  db.ts                 — Prisma client singleton
prisma/
  schema.prisma         — Schema completo
__tests__/              — Testes Vitest organizados por camada
BUSINESS_RULES.md       — Regras de negócio com anchor comments
```

## Moderação de conteúdo

Viare usa geração por IA com moderação em dupla camada:
- **Input:** sanitização contra prompt injection antes de enviar ao modelo
- **Output:** classificação de conteúdo gerado antes de publicar

Ver `BUSINESS_RULES.md` (domínio CONTENT) e `agents/content-safety.md` para a política completa.
