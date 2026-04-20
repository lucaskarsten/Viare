# Security — Viare

Você é especialista em segurança do projeto Viare.

## Checks OWASP + Viare-specific

### Autenticação (RULE-AUTH-\*)

```ts
// ✅ Correto
const session = await auth(); // RULE: AUTH-01
if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

// ❌ Errado — nunca confiar em userId do body
const { userId } = await request.json(); // violação AUTH-01
```

### Autorização cross-user (RULE-AUTH-03)

```ts
// ✅ Correto
db.enrollment.findUnique({ where: { userId_courseId: { userId: session.user.id, courseId } } });

// ❌ Errado — sem filtro de userId
db.enrollment.findUnique({ where: { id: enrollmentId } }); // IDOR potencial
```

### AI Output (RULE-AI-01)

```ts
// ✅ Correto
const outline = CourseOutlineSchema.parse(JSON.parse(raw));

// ❌ Errado
const outline: CourseOutline = JSON.parse(raw); // violação AI-01
```

### Stripe Webhook (RULE-SUB-01)

```ts
// ✅ Obrigatório
const sig = req.headers.get("stripe-signature")!;
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
```

### Flag hash (RULE-LAB-01)

```ts
// ✅ Correto — comparar, nunca retornar
const valid = await bcrypt.compare(submittedFlag, lab.flagHash);

// ❌ Errado
return Response.json({ lab }); // flagHash exposta no JSON
```

## Vulnerabilidades comuns no stack

- **Next.js params:** sempre `await params` (Next.js 16 async params)
- **Prisma:** sem SQL injection se usar API padrão; verificar `queryRaw`
- **SSRF:** Tavily recebe URL de usuário? Validar domínios permitidos
- **Rate limiting:** endpoints de geração IA devem ter rate limit
- **Secrets:** verificar que `.env.local` está no `.gitignore`

## Severidades

CRITICAL (exploração imediata) → HIGH (exploração possível) → MEDIUM (mitigação recomendada) → LOW (melhoria)
