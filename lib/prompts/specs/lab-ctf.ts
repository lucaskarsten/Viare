import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { callAnthropicJson } from "@/lib/prompts/runner";
import { CtfFlagSchema } from "@/lib/labs/templates/registry";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import { antiInjection, persona, regras, userData } from "@/lib/prompts/tags";

// RULE: AI-01 — output validated via Zod before persist
export const CtfLabOutputSchema = z
  .object({
    title: z.string().min(3).max(100),
    description: z.string().min(10),
    scenario: z.string().min(50),
    objectives: z.array(z.string().min(5)).min(2).max(5),
    hints: z
      .array(
        z.object({
          text: z.string().min(10),
          cost: z.number().int().min(0).max(50),
        })
      )
      .min(1)
      .max(4),
    // RULE: LAB-01 — flag plaintext here is transient; caller bcrypt.hash before storing
    flag: CtfFlagSchema,
  })
  .strict();

export type CtfLabOutput = z.infer<typeof CtfLabOutputSchema>;

const ctfLabTool: Anthropic.Tool = {
  name: "generate_ctf_lab",
  description:
    "Generate a hands-on CTF lab exercise the student runs on their own machine. " +
    "Output a structured lab with scenario, objectives, hints, and a capture flag.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 3, maxLength: 100 },
      description: { type: "string", minLength: 10 },
      scenario: {
        type: "string",
        minLength: 50,
        description: "Markdown step-by-step instructions for the student",
      },
      objectives: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        items: { type: "string", minLength: 5 },
        description: "Observable outcomes the student achieves",
      },
      hints: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            text: { type: "string", minLength: 10 },
            cost: { type: "integer", minimum: 0, maximum: 50 },
          },
          required: ["text", "cost"],
        },
        description: "Progressive hints — first gentle, last nearly reveals flag",
      },
      flag: {
        type: "string",
        pattern: "^FLAG\\{[a-z0-9_-]+\\}$",
        description:
          "The capture flag — must match FLAG{lowercase_alphanumeric_with_hyphens_underscores}",
      },
    },
    required: ["title", "description", "scenario", "objectives", "hints", "flag"],
  },
};

function buildSystemBlocks(): Anthropic.TextBlockParam[] {
  const text = [
    persona(
      "You are a senior CTF challenge designer for an online learning platform. " +
        "You craft hands-on exercises that students execute on their own machines " +
        "(Linux terminal, Google Colab, Python REPL, or equivalent). " +
        "Challenges reinforce lesson concepts through direct experimentation."
    ),

    regras(
      [
        "- Emit the lab via the generate_ctf_lab tool. Never return prose.",
        "- Scenario must be markdown with clear step-by-step instructions.",
        "- Flag MUST follow exactly the format FLAG{lowercase_alphanumeric_with_hyphens_underscores}.",
        "  Examples: FLAG{hello_world}, FLAG{base64-decode-win}, FLAG{python-list-sum-42}.",
        "  Never use uppercase, spaces, or special characters inside the braces.",
        "- Objectives are observable outcomes written from the student's perspective,",
        "  e.g. 'You ran the script and observed the output' — not vague goals.",
        "- Hints are progressive: hint 1 is a gentle nudge, the last hint almost reveals the flag.",
        "  Each hint has a cost (XP penalty 0-50). Harder hints have lower cost.",
        "- The lab must be completable with standard free tools (terminal, Python, etc.).",
        "- Do not require paid services, proprietary software, or admin privileges.",
        "- Educational and informational tone only. No malware, no real exploit targets.",
      ].join("\n")
    ),

    antiInjection(),
  ].join("\n\n");

  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}

function buildUserMessage(ctx: {
  language: "pt" | "en";
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  domainHint: string;
  tone?: string;
}): string {
  return [
    buildLanguageInstruction(ctx.language),
    "",
    "Generate a CTF lab for this lesson. The student will run commands/code on their own machine and capture the flag.",
    "",
    userData("LESSON TITLE", ctx.lessonTitle),
    "",
    userData("MODULE TITLE", ctx.moduleTitle),
    "",
    userData("COURSE TOPIC", ctx.topic),
    "",
    userData("DOMAIN", ctx.domainHint),
    ...(ctx.tone ? ["", userData("TONE", ctx.tone)] : []),
  ].join("\n");
}

export async function generateCtfLab(ctx: {
  language: "pt" | "en";
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  domainHint: string;
  tone?: string;
}): Promise<CtfLabOutput> {
  return callAnthropicJson({
    specName: "lab-ctf",
    model: "claude-sonnet-4-6",
    maxTokens: 6000,
    system: buildSystemBlocks(),
    userMessage: buildUserMessage(ctx),
    tool: ctfLabTool,
    schema: CtfLabOutputSchema,
  });
}
