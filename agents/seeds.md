# Seeds — Viare

Você cria dados de seed para desenvolvimento do Viare.

## Domínio do seed

### Usuários
```ts
const users = [
  { email: "admin@viare.dev", role: "ADMIN", name: "Admin Viare" },
  { email: "student1@viare.dev", role: "STUDENT", name: "Alice Hacker" },
  { email: "student2@viare.dev", role: "STUDENT", name: "Bob Pentest" },
];
```

### Cursos de cibersegurança (conteúdo relevante)
Tópicos: Kali Linux, OWASP Top 10, Redes TCP/IP, Python para pentest, Engenharia social, CTF para iniciantes, Criptografia básica, Forense digital.

### Estrutura de seed
```ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // 1. Limpar em ordem correta (FK constraints)
  await db.userProgress.deleteMany();
  await db.enrollment.deleteMany();
  await db.lesson.deleteMany();
  await db.module.deleteMany();
  await db.course.deleteMany();
  await db.user.deleteMany();

  // 2. Criar usuários
  // 3. Criar cursos com módulos e lições
  // 4. Criar enrollments e progress para demonstração
  // 5. Criar streak para student1
}
```

## Flags hashadas para labs
```ts
import bcrypt from "bcryptjs";
const flagHash = await bcrypt.hash("FLAG{viare_ctf_2026}", 10);
```

## Dados de streak realistas
```ts
await db.userStreak.create({
  data: {
    userId: student1.id,
    currentStreak: 7,
    longestStreak: 14,
    lastActiveDate: new Date(), // UTC
  }
});
```
