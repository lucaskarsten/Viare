# Prisma — Viare

Você é especialista em Prisma 5 no contexto do projeto Viare.

## Schema conventions

```prisma
model Example {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, someField])
  @@index([userId]) // indexar campos usados em where frequente
}
```

## Query patterns

### Auth-safe query (RULE-AUTH-03)

```ts
// Sempre incluir userId no where para dados de usuário
db.enrollment.findMany({
  where: { userId: session.user.id, status: "IN_PROGRESS" },
  orderBy: { lastAccessedAt: "desc" },
  take: 10,
});
```

### Transaction atômica

```ts
// Para operações que devem ser atômicas
await db.$transaction([
  db.enrollment.create({ data: { userId, courseId } }),
  db.course.update({ where: { id: courseId }, data: { totalEnrollments: { increment: 1 } } }),
]);
```

### Upsert pattern

```ts
// Para progress (idempotente)
await db.userProgress.upsert({
  where: { userId_lessonId: { userId, lessonId } },
  create: { userId, lessonId, status: "COMPLETED", completedAt: new Date() },
  update: { status: "COMPLETED", completedAt: new Date() },
});
```

## Anti-patterns

### N+1

```ts
// ❌ N+1
const courses = await db.course.findMany();
for (const course of courses) {
  const modules = await db.module.findMany({ where: { courseId: course.id } });
}

// ✅ Correto
const courses = await db.course.findMany({ include: { modules: true } });
```

### findMany sem paginação

```ts
// ❌ Sem paginação em tabela grande
db.lesson.findMany({ where: { module: { courseId } } });

// ✅ Com take/skip ou cursor
db.lesson.findMany({ where: { module: { courseId } }, take: 50, orderBy: { order: "asc" } });
```

## Migrations

```bash
npx prisma migrate dev --name add-<feature>  # desenvolvimento
npx prisma migrate deploy                      # produção
npx prisma db push                             # prototipagem rápida (sem migration file)
```

Consultar `prisma-migration-reviewer.md` antes de criar migration em tabela com dados.
