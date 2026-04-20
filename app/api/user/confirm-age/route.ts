// RULE: AUTH-01 — identidade sempre via auth()
// RULE: CONTENT-07 — age gate self-attestation (18+)
import { type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { calculateAge } from "@/lib/access-control";

const BodySchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "birthDate must be YYYY-MM-DD"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const birthDate = new Date(parsed.data.birthDate);
  const age = calculateAge(birthDate);
  if (age < 18) {
    return Response.json({ error: "age_below_minimum" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const ageConfirmedAt = new Date();
  await db.user.update({
    where: { id: userId },
    data: { birthDate, ageConfirmedAt },
  });

  console.info(
    "[AGE_CONFIRMED]",
    JSON.stringify({ userId, timestamp: ageConfirmedAt.toISOString(), ip })
  );

  return Response.json({ ok: true, ageConfirmedAt: ageConfirmedAt.toISOString() });
}
