import { auth } from "@/auth";
import { generateCourse, type GenerationEvent } from "@/lib/generation";

export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const topic: string = body.topic?.trim();
  const customContext: string | undefined = body.customContext?.trim() || undefined;

  if (!topic || topic.length < 3) {
    return new Response("Invalid topic", { status: 400 });
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

      await generateCourse(topic, session.user!.id!, customContext, emit);
      if (!cancelled) controller.close();
    },
    cancel() {
      // client navigated away — generation continues in background via the awaited promise above
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
