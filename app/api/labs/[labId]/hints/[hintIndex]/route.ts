import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { STARTING_XP } from "@/lib/lab";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ labId: string; hintIndex: string }> },
) {
  // RULE: AUTH-01 — userId from session only
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { labId, hintIndex: hintIndexStr } = await params;
  const hintIndex = parseInt(hintIndexStr, 10);
  if (isNaN(hintIndex) || hintIndex < 0) {
    return new Response("Invalid hint index", { status: 400 });
  }

  const lab = await db.lab.findUnique({
    where: { id: labId },
    select: { hints: true },
  });
  if (!lab) return new Response("Lab not found", { status: 404 });

  const hints = lab.hints as { text: string; cost: number }[];
  if (hintIndex >= hints.length) {
    return new Response("Hint not found", { status: 404 });
  }

  const hint = hints[hintIndex];

  // Idempotent: if already revealed, return text without debiting again
  const existing = await db.hintReveal.findUnique({
    where: { userId_labId_hintIndex: { userId: session.user.id, labId, hintIndex } },
  });
  if (existing) {
    const xp = await db.userXP.findUnique({ where: { userId: session.user.id } });
    return Response.json({ hint: hint.text, xpRemaining: xp?.points ?? STARTING_XP });
  }

  // RULE: LAB-02 — hint reveal and XP debit must be atomic
  const [, xp] = await db.$transaction([
    db.hintReveal.create({
      data: { userId: session.user.id, labId, hintIndex },
    }),
    db.userXP.upsert({
      where: { userId: session.user.id },
      update: { points: { decrement: hint.cost } },
      create: { userId: session.user.id, points: STARTING_XP - hint.cost },
    }),
  ]);

  return Response.json({ hint: hint.text, xpRemaining: xp.points });
}
