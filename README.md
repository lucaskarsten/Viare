# HackLearn — Plataforma de Aprendizado em Cybersecurity

Plataforma interativa para aprender Kali Linux e Cybersecurity com labs CTF, projetos guiados e gamificação.

## Setup local

### 1. Clone e instale dependências

```bash
git clone <repo>
cd Kali
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

Variáveis necessárias para rodar localmente:
- `DATABASE_URL` — PostgreSQL (use [Neon](https://neon.tech) gratuitamente)
- `AUTH_SECRET` — gere com `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` — [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` — [GitHub Developer Settings](https://github.com/settings/developers)

### 3. Configure o banco de dados

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Rode o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Banco | PostgreSQL via Neon + Prisma |
| Auth | Auth.js v5 (Google, GitHub) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Pagamentos | Stripe |
| Deploy | Vercel |

## Estrutura

```
app/
  (marketing)/     — Landing page pública
  (platform)/      — Área logada (dashboard, cursos, learn)
  login/           — Página de autenticação
  api/             — Route handlers
components/
  layout/          — Sidebar, Header
  ui/              — shadcn/ui components
lib/
  db.ts            — Prisma client singleton
prisma/
  schema.prisma    — Schema completo do banco
content/           — Arquivos MDX das lições
```
