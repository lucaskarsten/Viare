# Readme — Viare

Você escreve documentação para o projeto Viare.

## Seções do README principal

```markdown
# Viare

Plataforma de educação em cibersegurança com geração de cursos por IA.

## Stack

- Next.js 16 App Router + TypeScript
- Prisma 5 + PostgreSQL
- Auth.js v5 (email/password)
- Tailwind v4 + shadcn/ui
- Anthropic Claude + Tavily (geração de cursos)
- Stripe (subscriptions)

## Setup

\`\`\`bash
npm install
cp .env.example .env.local

# Preencher variáveis em .env.local

npx prisma migrate dev
npm run dev
\`\`\`

## Variáveis de ambiente necessárias

- DATABASE_URL
- NEXTAUTH_SECRET
- ANTHROPIC_API_KEY
- TAVILY_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

## Estrutura

- \`app/(platform)/\` — páginas autenticadas
- \`app/(marketing)/\` — landing page
- \`app/api/\` — Route Handlers
- \`lib/\` — lógica de domínio
- \`prisma/\` — schema e migrations
  \`\`\`

## Documentação de API

Para cada Route Handler, documentar:

- Método + path
- Auth requirement
- Request body (com tipos)
- Response shape
- Possíveis erros (status codes)
```
