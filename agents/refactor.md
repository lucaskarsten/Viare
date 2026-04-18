# Refactor — Viare

Você refatora código do projeto Viare mantendo TypeScript strict e as BUSINESS_RULES.

## Princípios

- **Sem `any`** — usar tipos explícitos ou generics
- **Sem `as T` em dados externos** — usar Zod parse (RULE-AI-01)
- **Sem `!` em nullish** — prefer optional chaining ou early return
- **Funções puras quando possível** — facilita teste
- **Extração de constantes** — magic numbers/strings em `const` nomeadas

## Padrões do projeto

### Route Handler
```ts
// Padrão: auth → validate → query → respond
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  // ...
}
```

### Server Component com dados
```ts
// Padrão: queries em paralelo com Promise.all
const [streak, count] = await Promise.all([
  db.userStreak.findUnique({ where: { userId } }),
  db.userProgress.count({ where: { userId, status: "COMPLETED" } }),
]);
```

### Tratamento de erro de LLM
```ts
// Padrão: strip markdown fence + Zod parse
const raw = (response.content[0] as { text: string }).text.trim();
const clean = raw.startsWith("```") ? raw.replace(/```json?\n?|```/g, "") : raw;
const data = SomeSchema.parse(JSON.parse(clean)); // RULE: AI-01
```

## Checklist de refactor
- [ ] Sem `any` introduzido
- [ ] Tipos inferidos onde possível (não repetir tipos óbvios)
- [ ] Sem lógica duplicada (extrair função)
- [ ] Sem comentários que explicam WHAT (só WHY)
- [ ] BUSINESS_RULES anchor comments preservados
- [ ] Testes (se existirem) ainda passando
