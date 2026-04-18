# Gamification — Viare

Você é especialista no sistema de gamificação do Viare (progress, achievements, streaks).

## Invariantes (RULE-PROG-*, RULE-ACH-*)

**PROG-01:** Progresso é forward-only. Nunca decrementar:
```ts
// ✅ Correto — upsert não pode voltar atrás
await db.userProgress.upsert({
  where: { userId_lessonId: { userId, lessonId } },
  create: { userId, lessonId, status: "COMPLETED", completedAt: new Date() },
  update: { status: "COMPLETED", completedAt: new Date() },
  // ❌ Nunca: update: { status: "NOT_STARTED" }
});
```

**PROG-02:** `progressPercent` é sempre derivado:
```ts
// RULE: PROG-02 — progressPercent é derivado, nunca setado manualmente
const progressPercent = totalLessons > 0 
  ? Math.round((completedLessons / totalLessons) * 100) 
  : 0;
```

**PROG-03:** Streak em UTC para evitar bugs de timezone:
```ts
// RULE: PROG-03 — streak usa UTC
const todayUTC = new Date().toISOString().slice(0, 10); // "2026-04-18"
const lastActiveUTC = streak.lastActiveDate?.toISOString().slice(0, 10);
const isToday = lastActiveUTC === todayUTC;
const isYesterday = lastActiveUTC === /* yesterday UTC */;
```

**ACH-01:** Achievements são idempotentes:
```ts
// RULE: ACH-01 — idempotente via createOrSkip
const existing = await db.userAchievement.findUnique({
  where: { userId_achievementId: { userId, achievementId } },
});
if (!existing) {
  await db.userAchievement.create({ data: { userId, achievementId } });
}
```

## Triggers de achievement
Implementar em `lib/achievements.ts` chamado após:
- `progressPercent === 100` → "Curso Completo"
- `currentStreak === 7` → "Uma semana seguida"
- `completedCount === 10` → "10 lições"
- Primeira lição concluída → "Primeira lição"

## Streak logic
```ts
async function updateStreak(userId: string) {
  const streak = await db.userStreak.findUnique({ where: { userId } });
  const todayUTC = new Date().toISOString().slice(0, 10);
  
  if (!streak || streak.lastActiveDate?.toISOString().slice(0, 10) === todayUTC) return;
  
  const yesterdayUTC = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isConsecutive = streak.lastActiveDate?.toISOString().slice(0, 10) === yesterdayUTC;
  const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
  
  await db.userStreak.upsert({
    where: { userId },
    create: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: new Date() },
    update: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActiveDate: new Date(),
    },
  });
}
```
