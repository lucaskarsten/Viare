import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { callAnthropicJson } from "@/lib/prompts/runner";
import { getTemplate } from "@/lib/labs/templates/registry";
import { selectTemplate } from "@/lib/labs/template-selector";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import { antiInjection, persona, regras, userData } from "@/lib/prompts/tags";

// RULE: AI-01 — output validated via Zod (schema + template configSchema)
// RULE: LAB-04 — INTERACTIVE never has flagHash
export const InteractiveLabOutputSchema = z
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
    // RULE: P2 — templateId via deterministic selectTemplate, not LLM
    templateId: z.string().min(1),
    config: z.record(z.string(), z.unknown()),
  })
  .strict();

export type InteractiveLabOutput = z.infer<typeof InteractiveLabOutputSchema>;

function buildCtfLabTool(templateDescription: string, configSchemaShape: string): Anthropic.Tool {
  return {
    name: "generate_interactive_lab",
    description:
      "Generate an interactive lab exercise that the student completes inline via a UI component. " +
      "NO flag. Student completes via self-declaration. " +
      templateDescription,
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 3, maxLength: 100 },
        description: { type: "string", minLength: 10 },
        scenario: {
          type: "string",
          minLength: 50,
          description: "Markdown student-facing introduction to the exercise",
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
          description: "Progressive hints to help the student",
        },
        templateId: {
          type: "string",
          description: "The template identifier (already selected — use the exact value provided)",
        },
        config: {
          type: "object",
          description: `Template-specific configuration. Shape: ${configSchemaShape}`,
        },
      },
      required: ["title", "description", "scenario", "objectives", "hints", "templateId", "config"],
    },
  };
}

function buildSystemBlocks(templateDescription: string): Anthropic.TextBlockParam[] {
  const text = [
    persona(
      "You are a senior interactive exercise designer for an online learning platform. " +
        "You create in-browser exercises that students complete using a visual UI component — " +
        "no external tools required. Exercises reinforce lesson concepts through direct manipulation."
    ),

    regras(
      [
        "- Emit the lab via the generate_interactive_lab tool. Never return prose.",
        "- NO flag field. This is an interactive lab — the student completes via self-declaration.",
        "- Scenario must be markdown with a clear student-facing introduction.",
        "- Objectives are observable outcomes from the student's perspective.",
        "- Hints are progressive: hint 1 is a gentle nudge, last hint nearly gives away the answer.",
        "  Each hint has a cost (XP penalty 0-50). Harder hints cost less.",
        `- The template for this lab is: ${templateDescription}`,
        "- Generate a config object that conforms exactly to the template's expected shape.",
        "- The templateId field must be set to the exact value specified in the user message.",
        "- Instructions inside config must be in the same language as the rest of the content.",
      ].join("\n")
    ),

    antiInjection(),
  ].join("\n\n");

  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}

function buildUserMessage(
  ctx: {
    language: "pt" | "en";
    topic: string;
    moduleTitle: string;
    lessonTitle: string;
    domainHint: string;
  },
  templateId: string,
  templateDescription: string,
  configSchemaShape: string
): string {
  return [
    buildLanguageInstruction(ctx.language),
    "",
    "Generate an interactive lab for this lesson. The student completes it using an in-browser UI component.",
    "",
    userData("LESSON TITLE", ctx.lessonTitle),
    "",
    userData("MODULE TITLE", ctx.moduleTitle),
    "",
    userData("COURSE TOPIC", ctx.topic),
    "",
    userData("DOMAIN", ctx.domainHint),
    "",
    userData("TEMPLATE ID", templateId),
    "",
    userData("TEMPLATE DESCRIPTION", templateDescription),
    "",
    userData("CONFIG SCHEMA SHAPE", configSchemaShape),
  ].join("\n");
}

function describeConfigSchema(templateId: string): string {
  const shapes: Record<string, string> = {
    "code-lab": JSON.stringify({
      language: '"javascript" | "typescript" | "python"',
      files: '{ "filename.ext": "file content" }',
      testCode: "(optional) string — test code to validate student solution",
      instructions: "string — markdown instructions shown alongside the editor",
    }),
    "interactive-calculator": JSON.stringify({
      variables: "[{ name, label, min, max, step, default }] — 1-5 slider variables",
      formula: "string — formula using variable names, e.g. 'a * b + c'",
      resultLabel: "string — label for the computed result",
      instructions: "string — markdown instructions for the student",
    }),
    "interactive-chart": JSON.stringify({
      chartType: '"bar" | "line" | "pie"',
      datasets: "[{ label: string, data: [{ x: string|number, y: number }] }]",
      instructions: "string — markdown instructions for the student",
      interactiveAxes: "(optional) boolean — whether axes are draggable",
    }),
  };
  return shapes[templateId] ?? "{ instructions: string } — follow the template description";
}

export async function generateInteractiveLab(ctx: {
  language: "pt" | "en";
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  domainHint: string;
}): Promise<InteractiveLabOutput> {
  // RULE: P2 — templateId determined deterministically, never by LLM
  const templateId = selectTemplate({ labVariant: "INTERACTIVE", domain: ctx.domainHint });

  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(
      `[lab-interactive] template not found for id="${templateId}" (domain="${ctx.domainHint}")`
    );
  }

  const configSchemaShape = describeConfigSchema(templateId);
  const tool = buildCtfLabTool(template.description, configSchemaShape);

  const callArgs = {
    specName: "lab-interactive",
    model: "claude-sonnet-4-6" as const,
    maxTokens: 3000,
    system: buildSystemBlocks(template.description),
    userMessage: buildUserMessage(ctx, templateId, template.description, configSchemaShape),
    tool,
    schema: InteractiveLabOutputSchema,
  };

  let raw: InteractiveLabOutput;
  try {
    raw = await callAnthropicJson(callArgs);
  } catch (err) {
    // Model occasionally omits `config` from tool response despite being required — retry once.
    const isConfigMissing = err instanceof Error && err.message.includes('"config"');
    if (!isConfigMissing) throw err;
    raw = await callAnthropicJson(callArgs);
  }

  // RULE: AI-01 — additionally validate config against the template's own configSchema
  // Note: configSchema is already defined with .strict() in the registry (RULE LAB-05)
  const configParsed = template.configSchema.safeParse(raw.config);
  if (!configParsed.success) {
    throw new Error(
      `[lab-interactive] config failed template configSchema validation for templateId="${templateId}": ` +
        configParsed.error.message
    );
  }

  return { ...raw, templateId };
}
