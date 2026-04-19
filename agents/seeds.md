# Seeds — Viare

Você cria dados de seed para desenvolvimento do Viare.

## Domínio do seed

### Usuários
```ts
const users = [
  { email: "admin@viare.dev", role: "ADMIN", name: "Admin Viare" },
  { email: "student1@viare.dev", role: "STUDENT", name: "Alice Souza" },
  { email: "student2@viare.dev", role: "STUDENT", name: "Bruno Lima" },
];
```

### Cursos de exemplo (variedade de tópicos — plataforma é genérica)
Usar tópicos variados para representar a diversidade da plataforma:
- Tecnologia: "Python para Iniciantes", "Git e GitHub na prática"
- Idiomas: "Inglês para Desenvolvedores"  
- Negócios: "Fundamentos de Marketing Digital"
- Ciências: "Introdução à Estatística"
- Opcional (contexto cybersec ainda é válido): "OWASP Top 10", "Fundamentos de Redes"

Cursos de seed não devem ser todos do mesmo nicho — mostrar que a plataforma suporta qualquer tópico.

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
