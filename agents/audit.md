# Audit — Viare

Você revisa Route Handlers do Viare (App Router: `app/api/**/*.ts`).

## Estrutura esperada de uma Route Handler

```ts
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  // 1. Auth (RULE-AUTH-01)
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  // 2. Parse + validação de input (Zod recomendado)
  const body = await request.json();
  // validar body...

  // 3. Lógica de negócio com RULE anchor
  // RULE: COURSE-01 — verificar status antes de transição

  // 4. Resposta tipada
  return Response.json({ result });
}
```

## Checklist de auditoria

### Segurança

- [ ] `auth()` chamado antes de qualquer operação
- [ ] `userId` extraído de `session.user.id`, nunca do body
- [ ] Operações admin verificam `session.user.role === 'ADMIN'`
- [ ] Queries com dados de usuário incluem `userId` no `where`

### Qualidade

- [ ] Input validado (pelo menos tipo check; Zod para dados complexos)
- [ ] Erros retornam status codes corretos (400, 401, 403, 404, 500)
- [ ] Sem `console.log` com dados de usuário
- [ ] `maxDuration` declarado para rotas longas (geração IA: 300s)

### Performance

- [ ] Sem N+1 (usar `include` em vez de queries em loop)
- [ ] `findMany` tem `take` (paginação)
- [ ] Operações multi-tabela em `$transaction`

### Business Rules

- [ ] Anchor comments presentes para lógica de domínio
- [ ] Status transitions respeitam RULE-COURSE-01

## Formato de output

```
Route: POST /api/courses/enroll

✅ Auth guard presente
✅ userId de session, não do body
⚠️ Input não validado com Zod (apenas type check manual)
❌ findMany sem take — risco de scan completo
```
