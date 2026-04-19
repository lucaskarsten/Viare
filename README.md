# Viare

Ferramenta de **gestão e retenção do conhecimento pessoal**. Você traz o material — artigos, vídeos do YouTube, transcrições, texto colado, ou simplesmente um tema — e a plataforma organiza em uma trilha estruturada: módulos, aulas, quizzes e revisão espaçada para garantir que o conteúdo fixe.

O diferencial não é gerar conteúdo do zero: é **extrair estrutura de material que já existe** e transformar em aprendizado mensurável. Você coletou dez artigos, salvou quinze vídeos, e nada disso virou aprendizado real porque faltava organização e continuidade. O Viare faz essa ponte.

---

## O que o produto faz hoje

A superfície visível ao usuário se divide em seis áreas (sidebar fixa):

| Área | Rota | O que entrega |
|---|---|---|
| **Biblioteca** | `/dashboard` | Retomada do último curso em andamento, grade dos cursos ativos, arquivo de pausados, métricas de streak/semana/total |
| **Revisar** | `/review` | Fila de flashcards com repetição espaçada — rating por dificuldade (again/hard/good/easy), progresso por curso, agenda da semana |
| **Metas** | `/goals` | Meta semanal (default 6 aulas), heatmap dos últimos 90 dias, histórico de 6 semanas, breakdown de tempo investido por curso |
| **Descobrir** | `/discover` | Feed social: posts de outros alunos, curso compartilhado + remix, nuvem de tópicos com relevância, sugestões personalizadas |
| **Catálogo** | `/courses` | Busca pública de cursos com filtros por categoria, dificuldade, avaliações, idiomas disponíveis |
| **Ingest / Geração** | `/courses/generate` | Fonte de entrada (tema livre, URL, YouTube, texto colado) → pipeline IA com outline → lições por módulo |

Além disso:
- **Player de lição** em foco mode com dropcap, seções, code blocks, tutor IA em sidepanel, controles de tipografia, marcar-como-concluída
- **Busca global** (⌘K / Ctrl+K): cursos, aulas, notas, flashcards, ações rápidas — corpus indexado com fuzzy match
- **Onboarding** em 4 passos (nome, interesses, ritmo, primeiro tópico) que alimenta a primeira geração

---

## Modelo de domínio

```
User ─┬─ Enrollment ─── Course ─── Module ─── Lesson ─┬─ QuizQuestion[]
      │                                                ├─ Lab
      │                                                └─ ProjectStep[]
      ├─ UserProgress (por Lesson, status: LOCKED/IN_PROGRESS/COMPLETED)
      ├─ UserStreak (current + longest)
      ├─ UserAchievement (conquistas desbloqueadas)
      ├─ Review (avaliação de cursos publicados)
      └─ Subscription (Stripe, FREE/PRO)
```

Cada **Lesson** tem um dos tipos `THEORY` / `LAB` / `QUIZ` / `PROJECT` e carrega markdown no campo `content` (parser trata `## sections` + ```code blocks``` + dropcap no primeiro parágrafo).

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, `proxy.ts` no lugar de `middleware.ts`) |
| TypeScript | strict em todos os arquivos |
| Banco | PostgreSQL + **Prisma 5** |
| Auth | Auth.js v5 (Google, GitHub) — em dev, `lib/dev-auth.ts` faz bypass determinístico |
| UI | Tailwind CSS v4 (`@theme inline`) + shadcn/ui + tokens próprios em `app/globals.css` |
| Tema | 4 paletas (`warm` / `cool` / `mono` / `forest`) × claro/escuro, seletor na sidebar, persiste em `localStorage` |
| i18n | **next-intl** com `messages/pt.json` e `messages/en.json` — troca pela sidebar, persiste em cookie via Server Action |
| IA | Anthropic SDK (Claude Sonnet) + Tavily (pesquisa), output validado com **Zod** (RULE LL-01) |
| Pagamentos | Stripe |
| Testes | Vitest + `@testing-library/react` em `__tests__/` organizado por camada |
| Deploy | Vercel (Fluid Compute por padrão) |

---

## Setup local

### 1. Clonar e instalar

```bash
git clone <repo>
cd Viare
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável | Descrição | Onde obter |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | [Neon](https://neon.tech) (free tier) ou local |
| `AUTH_SECRET` | Segredo do Auth.js | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` | OAuth Google | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` | OAuth GitHub | [GitHub Developer Settings](https://github.com/settings/developers) |
| `ANTHROPIC_API_KEY` | Geração de conteúdo | [console.anthropic.com](https://console.anthropic.com) |
| `TAVILY_API_KEY` | Pesquisa web no pipeline | [tavily.com](https://tavily.com) |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Billing | [Stripe Dashboard](https://dashboard.stripe.com) |

### 3. Banco e seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

O seed popula:
- 30 cursos públicos no catálogo
- 4 cursos ativos no dev user (Kali Linux, Pão & fermentação, Piano clássico, Negociação) com módulos, lições e conteúdo markdown completo para todas as 64 aulas
- Quiz questions nas lições QUIZ
- Streak fixada em 12 dias, recorde 23, 18 lições completadas, 4 nesta semana (para visualizar gráficos com dados plausíveis)

### 4. Dev server

```bash
npm run dev
```

Em desenvolvimento, `lib/dev-auth.ts` autentica automaticamente como `Lucas Karsten` (`dev-preview-user`) sem passar pelo OAuth. Em produção o fluxo é o Auth.js real.

---

## Scripts

```bash
npm run dev              # Next.js dev server (Turbopack)
npm run build            # build de produção
npm test                 # suite Vitest
npm run test:watch       # TDD
npm run lint             # ESLint + tsc --noEmit + prettier --check
npx prisma studio        # DB browser
npx prisma migrate dev   # nova migration
npx prisma db seed       # recarregar dados de dev
```

---

## Estrutura

```
app/
  (marketing)/           landing pública
  (onboarding)/          wizard de 4 passos
  (platform)/            app autenticado (sidebar fixa)
    dashboard/           Biblioteca
    review/              Revisão espaçada
    goals/               Metas
    discover/            Feed social
    courses/             Catálogo, detalhe, player, geração
  api/courses/           Route Handlers (generate, enroll, progress)
  login/
  tailwind.css           @theme inline (shadcn bridges)
  globals.css            tokens BEM, palettes, keyframes
  layout.tsx             RootLayout + NextIntlClientProvider

components/
  LessonClient.tsx       player com focus mode, tutor, parser de markdown
  ReviewClient.tsx       3 estados (dashboard / session / done)
  FlashcardPlayer.tsx
  QuizBlock.tsx
  GlobalSearch.tsx       ⌘K overlay
  layout/                Sidebar + SidebarNav (ThemeSelect, palette dots)
  CourseDetailTabs.tsx   tabs de curso (Estrutura, Flashcards, Avaliações, Notas)
  CourseMap.tsx          grafo visual de módulos

lib/
  generation.ts          pipeline Tavily → Claude → Prisma (streaming)
  db.ts                  Prisma singleton
  dev-auth.ts            autenticação determinística em dev
  catalog.ts             queries de catálogo

prisma/
  schema.prisma
  seed.ts                + lesson-content.ts + quiz-questions.ts
proxy.ts                 Next 16: auth gate (substitui middleware.ts)
i18n/request.ts          next-intl request config (lê cookie)
messages/pt.json         + en.json
actions/locale.ts        Server Action para trocar idioma

agents/                  prompts de domínio (arquitetura, security, prisma…)
.claude/
  agents/                agentes Claude Code (security-reviewer, test-writer…)
  commands/              /new-feature /css /i18n /db /ready /pr /learn
  hooks/                 lint + commit gate automáticos

BUSINESS_RULES.md        regras de negócio versionadas com anchor comments
AGENTS.md                catálogo de skills/agentes OMC
CLAUDE.md                zonas: regras de negócio, stack, LL, OMC protocol, auto-triggers
```

---

## Workflow de desenvolvimento

O projeto usa um sistema de skills/comandos para enforce consistência:

| Comando | Quando |
|---|---|
| `/new-feature` | Iniciar qualquer feature |
| `/css` | Após mudar `.tsx` ou `globals.css` — audita tokens, focus rings, arbitrary values |
| `/i18n` | Após mudar `.tsx` com string visível — migra para next-intl (PT + EN) |
| `/db` | Operações Prisma (validate, migrate) |
| `/ready` | Checklist pré-PR |
| `/pr` | Criar Pull Request |
| `/learn` | Extrair aprendizado pós-implementação |

Zona 5 do `CLAUDE.md` dispara esses comandos proativamente — ex: diff contém string hardcoded → `/i18n` roda antes de fechar.

**Regra LL-01 (Lição Aprendida 1):** qualquer output de LLM que vira JSON **deve** passar por Zod. `JSON.parse(...) as T` é proibido. O bug histórico em `lib/generation.ts` é a referência.

---

## Moderação de conteúdo

Pipeline em dupla camada (detalhes em `BUSINESS_RULES.md` domínio `CONTENT` e `agents/content-safety.md`):

- **Input** — sanitização contra prompt injection antes de enviar ao modelo
- **Output** — classificação de conteúdo gerado antes de persistir/publicar

O objetivo não é censura — é impedir que a plataforma gere conteúdo que quebre TOS de fornecedores ou coloque o usuário em risco legal.

---

## Direção

Estado atual (abril 2026) e vetores de evolução:

- ✅ **Sidebar unificada, layout pixel-perfect** alinhado ao protótipo original — paleta cool padrão
- ✅ **i18n completo** na superfície principal (PT/EN)
- ✅ **Conteúdo de lições** seedado para todas as 64 aulas dos 4 cursos ativos
- ✅ **Geração streaming** de cursos via Claude + Tavily
- 🟡 **Pipeline de ingest** — aceitar URLs, transcrições do YouTube e texto colado como fonte; a IA extrai estrutura do material existente em vez de gerar do zero
- 🟡 **Review com repetição espaçada** — UI pronta, algoritmo SM-2 ainda por consolidar, Flashcard model ainda por criar (hoje flashcards vêm inline na lição)
- 🟡 **Gamificação** — streak/achievements presentes; badges e progressão ainda crescendo
- 🟡 **Moderação** — pipeline definido, integração de provider de classificação pendente
- 🔲 **Labs interativos** — estrutura (`Lab` model, `/lessons/.../labs/`) existe; execução sandboxed é próxima fronteira
- 🔲 **Fluxo de pagamento completo** — Stripe configurado, UI de assinatura ainda a desenhar

A visão: qualquer pessoa pode pegar qualquer material de estudo que já existe — livros, artigos, vídeos, cursos — e transformar em uma trilha de aprendizado pessoal, com progresso rastreado e revisão espaçada que garante retenção de longo prazo.
