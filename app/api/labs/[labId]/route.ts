import { auth } from "@/lib/dev-auth";
import { getLabForUser } from "@/lib/lab";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ labId: string }> },
) {
  // RULE: AUTH-01 — userId from session only
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { labId } = await params;

  const exists = await db.lab.findUnique({ where: { id: labId }, select: { id: true } });
  if (!exists) return new Response("Not found", { status: 404 });

  // RULE: LAB-01 — flagHash never returned to client
  const lab = await getLabForUser(labId, session.user.id);
  if (!lab) return new Response("Not found", { status: 404 });

  return Response.json(lab);
}
