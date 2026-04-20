import type Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { getAnthropic } from "@/lib/anthropic";

export type ViareModel = "claude-haiku-4-5-20251001" | "claude-sonnet-4-6";

interface CommonArgs {
  model: ViareModel;
  maxTokens: number;
  system?: string | Anthropic.TextBlockParam[];
  userMessage: string;
  specName: string;
}

interface JsonArgs<T> extends CommonArgs {
  tool: Anthropic.Tool;
  schema: z.ZodType<T>;
}

type TextArgs = CommonArgs;

interface CacheUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

function logUsage(specName: string, model: string, latencyMs: number, usage: CacheUsage): void {
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const uncached = usage.input_tokens;
  const total = cacheRead + cacheWrite + uncached;
  const hitRate = total > 0 ? Math.round((cacheRead / total) * 100) : 0;
  // Structured log — JSON parseable for downstream aggregation.
  console.log(
    JSON.stringify({
      msg: "prompt_execution",
      spec: specName,
      model,
      latency_ms: latencyMs,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_creation_tokens: cacheWrite,
      cache_read_tokens: cacheRead,
      cache_hit_rate: hitRate,
    })
  );
}

// Force Tool Use with a specific tool and Zod-validate the structured output.
// SDK retries transient failures (429/500/529) automatically.
export async function callAnthropicJson<T>(args: JsonArgs<T>): Promise<T> {
  const client = getAnthropic();
  const start = performance.now();
  const response = await client.messages.create({
    model: args.model,
    max_tokens: args.maxTokens,
    ...(args.system ? { system: args.system } : {}),
    tools: [args.tool],
    tool_choice: { type: "tool", name: args.tool.name },
    messages: [{ role: "user", content: args.userMessage }],
  });
  const latency = Math.round(performance.now() - start);
  logUsage(args.specName, args.model, latency, response.usage);

  const toolBlock = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === args.tool.name
  );
  if (!toolBlock) {
    throw new Error(
      `[${args.specName}] expected tool_use "${args.tool.name}", got: ` +
        response.content.map((b) => b.type).join(", ")
    );
  }
  // RULE: AI-01 — Zod validates every tool input.
  return args.schema.parse(toolBlock.input);
}

export interface TextResult {
  text: string;
  stopReason: string | null;
}

// Free-form text output (used for markdown lessons).
export async function callAnthropicText(args: TextArgs): Promise<TextResult> {
  const client = getAnthropic();
  const start = performance.now();
  const response = await client.messages.create({
    model: args.model,
    max_tokens: args.maxTokens,
    ...(args.system ? { system: args.system } : {}),
    messages: [{ role: "user", content: args.userMessage }],
  });
  const latency = Math.round(performance.now() - start);
  logUsage(args.specName, args.model, latency, response.usage);

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) {
    throw new Error(`[${args.specName}] expected text block in response`);
  }
  return { text: textBlock.text, stopReason: response.stop_reason };
}
