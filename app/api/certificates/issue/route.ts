import { revalidatePath } from "next/cache";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { issueCertificate } from "@/lib/certificates";
import { z } from "zod";

const Body = z.object({ enrollmentId: z.string() });

export async function POST(request: Request) {
  // RULE: AUTH-01
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) return new Response("Invalid body", { status: 400 });

  // RULE: AUTH-03 — verificar ownership antes de emitir
  const enrollment = await db.enrollment.findUnique({
    where: { id: parsed.data.enrollmentId },
    select: { userId: true, status: true },
  });
  if (!enrollment) return new Response("Not found", { status: 404 });
  if (enrollment.userId !== session.user.id) return new Response("Forbidden", { status: 403 });
  if (enrollment.status !== "COMPLETED") return new Response("Not completed", { status: 422 });

  const cert = await issueCertificate(parsed.data.enrollmentId);
  revalidatePath("/certificates");
  return Response.json(cert);
}
