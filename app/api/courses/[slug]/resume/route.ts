import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { resumeCourse, type GenerationEvent } from "@/lib/generation";

export const maxDuration = 300;

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { slug } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, createdById: true, status: true, requiresReview: true },
  });

  if (!course) return new Response("Not found", { status: 404 });
  if (course.createdById !== session.user.id) return new Response("Forbidden", { status: 403 });
  const isResumable =
    (course.status === "DRAFT" && course.requiresReview) || course.status === "GENERATING";
  if (!isResumable) {
    return new Response("Course is not in a resumable state", { status: 409 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let cancelled = false;
      function emit(event: GenerationEvent) {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          cancelled = true;
        }
      }
      await resumeCourse(course.id, session.user!.id!, emit);
      if (!cancelled) controller.close();
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
