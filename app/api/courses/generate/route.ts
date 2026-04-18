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
      function emit(event: GenerationEvent) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }

      await generateCourse(topic, session.user!.id!, customContext, emit);
      controller.close();
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
