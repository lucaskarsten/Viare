# Plataforma de Aprendizado Interativo — Kali Linux & Cybersecurity

**Data:** 2026-04-18  
**Status:** Planejamento  
**Horizonte:** MVP robusto (2-3 meses)

---

## Resumo de Requisitos

| Dimensão | Decisão |
|---|---|
| Público | Devs curiosos com base técnica querendo aprender cybersecurity |
| Modelo | Freemium — conteúdo básico grátis, labs/projetos avançados pagos |
| Interação | Quiz/teoria + Labs CTF-style (flag-based) + Projetos guiados |
| Gamificação | Badges/conquistas + Streak de consistência diária |
| Ambiente labs | Flag-based no MVP (terminal real decidido depois) |
| Stack | Next.js 15 App Router + PostgreSQL + Stripe + Vercel |
| Idioma inicial | Português (BR) |

---

## Critérios de Aceitação (MVP)

- [ ] Usuário consegue criar conta via Google/GitHub ou email+senha
- [ ] Usuário consegue navegar por cursos, trilhas e lições sem auth
- [ ] Conteúdo de teoria renderiza MDX com syntax highlight
- [ ] Quiz engine: múltipla escolha com feedback imediato e explicação
- [ ] Lab CTF: usuário submete flag, sistema valida e registra conclusão
- [ ] Projeto guiado: steps sequenciais com marcação de progresso manual
- [ ] Progresso persiste por usuário e por lição
- [ ] Badge desbloqueado automaticamente por evento (ex: completar 1ª trilha)
- [ ] Streak atualizado diariamente, quebrado se usuário perder um dia
- [ ] Freemium gate: conteúdo premium bloqueia não-assinantes com upgrade CTA
- [ ] Stripe checkout funcional (plano mensal e anual)
- [ ] Aluno vê seu progresso % em cada trilha
- [ ] Admin pode criar/editar cursos via painel protegido por role
- [ ] Plataforma é genérica: adicionar novo curso não requer código novo

---

## Arquitetura

### Modelo de Dados (Prisma/PostgreSQL)

```
Course                        — "Kali Linux Fundamentals"
  Track[]                     — "Reconhecimento", "Exploração"
    Module[]                  — "Scanning com Nmap"
      Lesson[]                — "nmap básico", "flags avançadas"
        type: theory|quiz|lab|project
        isPremium: boolean

UserProgress
  userId + lessonId + status (not_started|in_progress|completed)
  completedAt

Lab
  lessonId + flagHash (bcrypt da flag) + hints[]

QuizQuestion
  lessonId + question + options[] + correctIndex + explanation

ProjectStep
  lessonId + order + title + description + completionType (manual|auto)

Achievement (Badge)
  id + title + description + icon + triggerEvent

UserAchievement
  userId + achievementId + unlockedAt

UserStreak
  userId + currentStreak + longestStreak + lastActiveDate

Subscription
  userId + stripeCustomerId + plan + status + validUntil

User
  id + email + name + image + role (student|admin) + createdAt
```

### Hierarquia de Conteúdo

```
Platform
└── Course (ex: Kali Linux, Web Hacking, OSINT)
    └── Track (agrupamento temático)
        └── Module (unidade coesa)
            └── Lesson (unidade atômica de aprendizado)
                ├── type=theory  → MDX content
                ├── type=quiz    → QuizQuestion[]
                ├── type=lab     → Lab (flag-based)
                └── type=project → ProjectStep[]
```

### Lab CTF — Flag-Based (MVP)

O modelo flag-based evita infra de containers no MVP mas mantém o desafio real:

1. **Plataforma descreve o cenário** com contexto e objetivos
2. **Setup instructions** ensinam como montar o ambiente localmente (Kali VM, Docker, etc.)
3. **Aluno realiza o ataque/análise** em sua própria máquina
4. **Submete a flag** — string encontrada ao completar o objetivo (ex: `FLAG{md5_hash}`)
5. **Servidor valida** com bcrypt compare sem expor a flag em plain text
6. **Progresso registrado** + badge/XP concedido

*Vantagem:* Zero infra de containers no MVP. Modelo usado pelo HackTheBox, CTFtime.  
*Caminho futuro:* Quando tiver tração, adicionar containers Kali via WebSocket (xterm.js + Docker API).

### Stack Técnica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, SSR, file-based routing |
| Linguagem | TypeScript | Type safety obrigatório |
| Banco | PostgreSQL via Neon (serverless) | Serverless, free tier generoso, Vercel-native |
| ORM | Prisma | Schema-as-code, migrations, excelente DX |
| Auth | Auth.js v5 (NextAuth) | Google + GitHub OAuth + Credentials |
| Pagamentos | Stripe | Checkout, webhooks, portal do cliente |
| Conteúdo | MDX + gray-matter + next-mdx-remote | Lições em markdown com componentes React |
| UI | Tailwind CSS + shadcn/ui | Componentes acessíveis, customizáveis |
| Email | Resend | Transacional (verificação, receipts) |
| Storage | Vercel Blob | Imagens de curso, avatares |
| Deploy | Vercel | CI/CD automático, preview URLs, Edge |
| Analytics | Vercel Analytics + PostHog | Métricas de produto |

### Estrutura de Pastas

```
/app
  /(marketing)        — landing page, pricing, about
  /(platform)
    /dashboard        — home do aluno logado
    /courses          — listagem de cursos
    /courses/[slug]   — página do curso
    /learn/[lessonId] — player de lição (theory/quiz/lab/project)
    /profile          — progresso, badges, streak
    /settings         — conta, assinatura, billing
  /(admin)
    /admin/courses    — CRUD de cursos
    /admin/lessons    — CRUD de lições
/components
  /lesson             — TheoryViewer, QuizEngine, LabSubmit, ProjectStepper
  /gamification       — BadgeCard, StreakWidget, ProgressBar
  /ui                 — shadcn components
/lib
  /db                 — Prisma client
  /auth               — Auth.js config
  /stripe             — Stripe client + webhooks
  /mdx                — parser/renderer
/prisma
  schema.prisma
  migrations/
/content              — arquivos MDX das lições (source of truth)
  /kali-linux/
    /track-01-recon/
      /lesson-01.mdx
```

---

## Sistema de Gamificação

### Badges (MVP — 10 iniciais)

| Badge | Trigger |
|---|---|
| Primeira Lição | Completar qualquer lição |
| Trilha Completa | Completar todas as lições de uma trilha |
| Primeira Flag | Resolver um lab CTF |
| 3 Dias Seguidos | Streak de 3 dias |
| 7 Dias Seguidos | Streak de 7 dias |
| Quiz Master | 100% em 5 quizzes |
| Projeto Concluído | Finalizar um projeto guiado |
| Explorador | Iniciar 3 cursos diferentes |
| Assinante | Fazer upgrade para premium |
| Maratonista | 30 dias de streak |

### Streak Logic

```
POST /api/activity  — chamado ao completar qualquer lição
  if lastActiveDate === yesterday: currentStreak++
  if lastActiveDate === today: no-op
  if lastActiveDate < yesterday: currentStreak = 1
  if currentStreak > longestStreak: longestStreak = currentStreak
  update lastActiveDate = today
```

---

## Freemium Gate

| Conteúdo | Free | Premium |
|---|---|---|
| Teoria (primeiras 2 por módulo) | ✅ | ✅ |
| Quiz (primeiros 2 por módulo) | ✅ | ✅ |
| Teoria avançada | ❌ | ✅ |
| Labs CTF | ❌ | ✅ |
| Projetos guiados | ❌ | ✅ |
| Trilhas completas | 1 trilha grátis | Todas |

**Gate implementation:** middleware Next.js verifica `subscription.status === 'active'` antes de `/learn/[lessonId]` com `isPremium=true`. Redirect para `/pricing` com `?lesson=[id]` para retornar depois do checkout.

**Stripe:** Checkout Session + webhook para `checkout.session.completed` e `customer.subscription.deleted`.

---

## Fluxo do Usuário

```
Landing Page
  → CTA "Começar grátis"
  → Signup (Google/GitHub/email)
  → Onboarding: "O que você quer aprender?" (selecionar interesse)
  → Dashboard com curso recomendado

Dashboard
  → Continuar onde parou (última lição)
  → Streak widget
  → Badges recentes

Lesson Player
  theory  → scroll + syntax highlight + "Marcar como lido" button
  quiz    → 1 questão por vez → feedback → próxima → score final
  lab     → cenário + objetivos + hints (desbloqueáveis) + submit flag
  project → steps accordion → check manual por step

Ao completar lição
  → Confetti animation
  → Badge unlock (se aplicável)
  → Botão "Próxima lição"
  → Streak atualizado

Ao atingir conteúdo premium (free user)
  → Modal "Desbloqueie com Premium"
  → Stripe Checkout
  → Retorno para a lição após pagamento
```

---

## Roadmap de Implementação

### Fase 1 — Fundação (Semanas 1-2)
- [ ] Setup Next.js 15 + TypeScript + Tailwind + shadcn/ui
- [ ] Schema Prisma completo + migrations
- [ ] Auth.js v5: Google + GitHub + Credentials
- [ ] Layout base (sidebar, header, dashboard shell)
- [ ] Deploy inicial no Vercel + Neon DB conectado

### Fase 2 — Core de Aprendizado (Semanas 3-5)
- [ ] MDX renderer com syntax highlight (shiki)
- [ ] Lesson player: theory view
- [ ] Quiz engine: múltipla escolha + feedback + score
- [ ] Progress tracking (UserProgress)
- [ ] Course/Track/Module/Lesson browser
- [ ] Seed inicial com curso Kali (2-3 módulos reais)

### Fase 3 — Labs & Projetos (Semanas 5-7)
- [ ] Lab CTF: flag submission + bcrypt validation
- [ ] Lab hints system (desbloqueáveis por tentativas)
- [ ] Project stepper: steps sequenciais + check manual
- [ ] Badges engine: event system + unlock logic
- [ ] Streak tracking: daily activity + widget

### Fase 4 — Monetização (Semanas 7-9)
- [ ] Stripe: produtos, preços (mensal/anual), checkout
- [ ] Webhook handler: subscription created/cancelled
- [ ] Freemium gate: middleware + redirect flow
- [ ] Pricing page
- [ ] Portal do cliente (Stripe Customer Portal)

### Fase 5 — Conteúdo & Polimento (Semanas 9-12)
- [ ] Admin panel: CRUD courses/tracks/modules/lessons
- [ ] Trilha completa Kali Linux (10+ módulos)
- [ ] Profile page: badges, progresso, streak
- [ ] Landing page marketing
- [ ] Email transacional (verificação, boas-vindas, recibo)
- [ ] Analytics (PostHog events)
- [ ] QA + testes E2E (Playwright)
- [ ] Launch checklist

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Conteúdo técnico de qualidade consome muito tempo | Alta | Alto | Começar com 1 trilha completa antes de escalar |
| Flag-based labs não engajam o suficiente | Média | Médio | Medir completion rate, adicionar terminal se < 40% |
| Stripe webhooks falhando silenciosamente | Baixa | Alto | Idempotency keys + logging + retry queue |
| Prisma migrations quebrando em prod | Baixa | Alto | Shadow database + migrations em CI antes de deploy |
| Conteúdo MDX com XSS | Baixa | Alto | Sanitizar no render, nunca dangerouslySetInnerHTML bruto |

---

## Decisões Arquiteturais (ADR)

**Decisão:** Flag-based labs no MVP, sem terminal real  
**Drivers:** Velocidade de entrega (2-3 meses), custo zero de infra adicional, complexidade de containers  
**Alternativas consideradas:** xterm.js + Docker (descartado pela complexidade no MVP), VNC (descartado pelo custo)  
**Por quê escolhida:** Modelo validado por HackTheBox e CTFtime. Permite criar labs ricos sem infra. Caminho de upgrade claro quando houver tração.  
**Consequências:** Aluno precisa de ambiente local (Kali VM/Docker). Reduz fricção zero → engajamento precisa ser monitorado.  
**Follow-up:** Avaliar adoption rate dos labs no mês 2. Se < 30% completam, priorizar terminal.

**Decisão:** MDX em filesystem para conteúdo de lições  
**Drivers:** Git-based workflow, sem CMS externo, simples no MVP  
**Alternativas consideradas:** Sanity CMS (descartado pela complexidade), banco de dados (descartado pela dificuldade de editar markdown rico)  
**Por quê escolhida:** Dev-friendly, versionamento automático com Git, zero custo adicional  
**Consequências:** Admin não-técnico não consegue criar conteúdo sem Git. Para MVP isso é aceitável (Lucas escreve o conteúdo).  
**Follow-up:** Avaliar Sanity ou editor MDX in-app quando tiver colaboradores de conteúdo.

---

## Verificação

- [ ] `npx prisma validate` sem erros no schema
- [ ] Auth flow: login/logout/session com todos os providers
- [ ] Quiz: submissão correta e incorreta registram progresso
- [ ] Lab: flag correta aceita, flag errada rejeita com mensagem
- [ ] Freemium: usuário free bloqueado em lição premium
- [ ] Stripe: checkout completo → subscription ativa → conteúdo desbloqueado
- [ ] Badge: evento disparado → badge aparece no perfil
- [ ] Streak: completar lição hoje atualiza streak, amanhã incrementa
- [ ] Playwright E2E: happy path completo (signup → lição → quiz → progresso)
