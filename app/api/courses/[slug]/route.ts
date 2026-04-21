import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { slug } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, createdById: true, status: true, generationPrompt: true },
  });

  if (!course) return new Response("Not found", { status: 404 });
  if (course.createdById !== session.user.id) return new Response("Forbidden", { status: 403 });
  if (course.status === "PUBLISHED") {
    return new Response("Cannot delete a published course", { status: 409 });
  }

  await db.course.delete({ where: { id: course.id } });

  const topic = course.generationPrompt?.split("\n")[0] ?? "";
  return NextResponse.json({ deleted: true, topic });
}
