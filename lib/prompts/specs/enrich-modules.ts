import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { callAnthropicJson } from "@/lib/prompts/runner";
import { EnrichModulesSchema, type EnrichModules } from "@/lib/prompts/schemas";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import { antiInjection, persona, regras, userData } from "@/lib/prompts/tags";

export interface EnrichModulesInput {
  language: string;
  courseTitle: string;
  existingModuleCount: number;
  researchContext: string;
}

const enrichModulesTool: Anthropic.Tool = {
  name: "enrich_course",
  description:
    "Emit 1-2 new advanced modules that extend an existing course. Each module ends with a QUIZ lesson after 2-3 THEORY lessons.",
  input_schema: {
    type: "object",
    properties: {
      modules: {
        type: "array",
        minItems: 1,
        maxItems: 2,
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            lessons: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  type: {
                    type: "string",
                    enum: ["THEORY", "QUIZ", "CASE_STUDY", "REFLECTION", "PRACTICE", "LAB"],
                  },
                  labVariant: {
                    type: "string",
                    enum: ["CTF", "INTERACTIVE"],
                    description:
                      "Required when type is LAB. CTF for programming/devops/security; INTERACTIVE for conceptual/visual topics.",
                  },
                },
                required: ["title", "type"],
              },
            },
          },
          required: ["title", "description", "lessons"],
        },
      },
    },
    required: ["modules"],
  },
};

const enrichOutputSchema = z.object({ modules: EnrichModulesSchema });

function buildSystemBlocks(): Anthropic.TextBlockParam[] {
  const text = [
    persona(
      "You are extending an existing online course with advanced material. " +
        "Your new modules complement — never repeat — the basics."
    ),
    regras(
      [
        "- Emit modules via the enrich_course tool. Never return prose.",
        "- 1 to 2 new modules.",
        "- Each module has 2-3 THEORY lessons followed by a single QUIZ lesson.",
        "- Stay on topic, do not pivot the course into a different subject.",
        "- You MAY use type LAB for a hands-on exercise (gated by ENABLE_LAB_GENERATION at runtime).",
        "  If type is LAB, you MUST also set labVariant:",
        "  - CTF for programming/devops/security topics (student runs commands and submits a flag).",
        "  - INTERACTIVE for conceptual/visual topics (student manipulates an inline component).",
      ].join("\n")
    ),
    antiInjection(),
  ].join("\n\n");

  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}

function buildUserMessage(input: EnrichModulesInput): string {
  return [
    buildLanguageInstruction(input.language),
    "",
    `The course already has ${input.existingModuleCount} modules. Generate 1-2 NEW advanced modules that complement what exists.`,
    "",
    userData("COURSE TITLE", input.courseTitle),
    "",
    userData("RESEARCH MATERIAL", input.researchContext),
  ].join("\n");
}

export async function generateEnrichModules(input: EnrichModulesInput): Promise<EnrichModules> {
  const { modules } = await callAnthropicJson({
    specName: "enrich-modules",
    model: "claude-sonnet-4-6",
    maxTokens: 1500,
    system: buildSystemBlocks(),
    userMessage: buildUserMessage(input),
    tool: enrichModulesTool,
    schema: enrichOutputSchema,
  });
  return modules;
}
