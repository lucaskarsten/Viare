import { z } from "zod";
import { auth } from "@/lib/dev-auth";
import { generateCourse, type GenerationEvent } from "@/lib/generation";
import { IngestSourceSchema } from "@/lib/ingest";

export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const topic: string = body.topic?.trim() ?? "";
  const customContext: string | undefined = body.customContext?.trim() || undefined;
  const language: string = typeof body.language === "string" ? body.language : "pt";
  const VALID_SCOPES = ["OVERVIEW", "COMPLETE", "DEEP"] as const;
  const rawScope = typeof body.scope === "string" ? body.scope.toUpperCase() : "COMPLETE";
  const scope = (VALID_SCOPES as readonly string[]).includes(rawScope) ? rawScope : "COMPLETE";

  const SourcesSchema = z.array(IngestSourceSchema).max(5).optional();
  const parseResult = SourcesSchema.safeParse(body.sources);
  const sources = parseResult.success ? parseResult.data : undefined;

  const hasSources = sources && sources.length > 0;
  if (!topic && !hasSources) {
    return new Response("Provide a topic or at least one source", { status: 400 });
  }
  if (topic && topic.length < 3) {
    return new Response("Topic too short (min 3 chars)", { status: 400 });
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

      await generateCourse(topic, session.user!.id!, customContext, emit, sources, language, scope);
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
