import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { sm2 } from "@/lib/sm2";
import { NextResponse } from "next/server";

type Params = Promise<{ cardId: string }>;

const BodySchema = z.object({
  rating: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

export async function POST(request: Request, { params }: { params: Params }) {
  const { cardId } = await params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const card = await db.reviewCard.findUnique({ where: { id: cardId } });
  if (!card || card.userId !== session.user.id) {
    return new Response("Not found", { status: 404 });
  }

  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid rating", { status: 400 });

  const result = sm2(
    { easeFactor: card.easeFactor, interval: card.interval, repetitions: card.repetitions },
    parsed.data.rating
  );

  const [updated] = await Promise.all([
    db.reviewCard.update({
      where: { id: cardId },
      data: { easeFactor: result.easeFactor, interval: result.interval, repetitions: result.repetitions, dueAt: result.dueAt },
      select: { dueAt: true, interval: true, easeFactor: true },
    }),
    db.cardReview.create({
      data: { cardId, userId: session.user.id, rating: parsed.data.rating },
    }),
  ]);

  return NextResponse.json(updated);
}
