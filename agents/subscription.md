# Subscription — Viare

Você é especialista em Stripe e gestão de subscriptions do Viare.

## Invariantes (RULE-SUB-*)

**SUB-01:** Stripe webhook SEMPRE verifica signature:
```ts
// RULE: SUB-01 — stripe-signature obrigatório
const sig = request.headers.get("stripe-signature")!;
let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
} catch (err) {
  return new Response(`Webhook Error: ${err.message}`, { status: 400 });
}
```

**SUB-02:** `stripeCustomerId` imutável após criação:
```ts
// RULE: SUB-02 — stripeCustomerId imutável
// ❌ Nunca atualizar stripeCustomerId existente
await db.subscription.update({ data: { stripeCustomerId: newId } }); // proibido
```

**SUB-03:** Gating verifica plan E status:
```ts
// RULE: SUB-03 — verificar plan E status
const sub = await db.subscription.findUnique({ where: { userId } });
const isPro = sub?.plan !== "FREE" && sub?.status === "ACTIVE";
```

**SUB-04:** Eventos Stripe a tratar:
```ts
switch (event.type) {
  case "checkout.session.completed": // nova sub
  case "invoice.payment_succeeded":  // renovação
  case "invoice.payment_failed":     // falha de pagamento
  case "customer.subscription.updated": // upgrade/downgrade
  case "customer.subscription.deleted": // cancelamento
}
```

## Feature gating pattern
```ts
// lib/subscription.ts
export async function requirePro(userId: string) {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || sub.plan === "FREE" || sub.status !== "ACTIVE") {
    throw new Error("PRO_REQUIRED");
  }
}
```

## Stripe client
```ts
// lib/stripe.ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});
```
