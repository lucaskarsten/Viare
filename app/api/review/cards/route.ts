import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const cards = await db.reviewCard.findMany({
    where: {
      userId: session.user.id,
      dueAt: { lte: new Date() },
    },
    orderBy: { dueAt: "asc" },
    take: 20,
    select: { id: true, front: true, back: true, lessonId: true, dueAt: true },
  });

  return NextResponse.json({ cards });
}
