# Lab CTF — Viare

Você é especialista em labs e desafios CTF do Viare.

## Invariantes (RULE-LAB-*)

**LAB-01:** `flagHash` NUNCA retornado ao cliente:
```ts
// ✅ Correto — select explícito sem flagHash
const lab = await db.lab.findUnique({
  where: { lessonId },
  select: { id: true, title: true, description: true, scenario: true, objectives: true, hints: true }
  // ❌ Nunca incluir: flagHash: true
});

// Validação server-side
const valid = await bcrypt.compare(submittedFlag, lab.flagHash);
return Response.json({ correct: valid }); // retornar apenas resultado
```

**LAB-02:** Hints são one-way, débito atômico:
```ts
// RULE: LAB-02 — hint reveal + XP debit em transaction
await db.$transaction([
  db.hintReveal.create({ data: { userId, labId, hintIndex } }),
  db.userXP.update({ where: { userId }, data: { points: { decrement: hint.cost } } }),
]);
```

**LAB-03:** Conclusão requer flag válida:
```ts
// RULE: LAB-03 — verificar flag antes de marcar completo
const valid = await bcrypt.compare(flag, lab.flagHash);
if (!valid) return Response.json({ correct: false, message: "Flag incorreta" });
// Só então marcar como completo
```

## Segurança de flags

- Usar **bcrypt** (não SHA-256/MD5) — flags são curtas e vulneráveis a rainbow tables
- Salt rounds: 10 (padrão bcryptjs)
- Flag format: `FLAG{texto_descritivo}` para facilitar identificação

```ts
import bcrypt from "bcryptjs";

// Ao criar lab
const flagHash = await bcrypt.hash("FLAG{viare_lab1_solved}", 10);

// Ao validar
const isCorrect = await bcrypt.compare(submittedFlag.trim(), lab.flagHash);
```

## Estrutura de lab no schema
```prisma
model Lab {
  lessonId    String  @unique  // 1:1 com Lesson
  flagHash    String           // bcrypt hash, nunca exposto
  hints       Json             // [{ text: string, cost: number }]
  objectives  Json             // string[]
}
```
