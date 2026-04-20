import type Anthropic from "@anthropic-ai/sdk";
import type { IngestSource } from "@/lib/ingest";
import { callAnthropicJson } from "@/lib/prompts/runner";
import { CourseOutlineSchema, type CourseOutline } from "@/lib/prompts/schemas";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import { antiInjection, persona, regras, userData } from "@/lib/prompts/tags";

export interface OutlineInput {
  language: string;
  topic: string;
  scope?: string;
  customContext?: string;
  sourcesContext?: string;
  researchContext?: string;
}

// RULE: AI-05 — scope controls module/lesson density in the outline
const SCOPE_CONSTRAINTS: Record<string, { modules: string; lessons: string }> = {
  overview: { modules: "1 to 2 modules", lessons: "2 THEORY lessons each" },
  complete: { modules: "3 to 4 modules", lessons: "2 to 3 THEORY lessons each" },
  deep: {
    modules: "4 to 5 modules",
    lessons: "3 to 4 THEORY lessons each — use elaborate examples and cover edge cases",
  },
};

const outlineTool: Anthropic.Tool = {
  name: "create_course_outline",
  description:
    "Emit the course outline: top-level metadata plus 1-5 modules, each with 2-4 THEORY lessons followed by 1 QUIZ lesson.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Course title" },
      description: { type: "string", description: "2-3 sentence course description" },
      estimatedHours: { type: "integer", minimum: 2, maximum: 12 },
      difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
      tags: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 6,
      },
      modules: {
        type: "array",
        minItems: 1,
        maxItems: 5,
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
                  type: { type: "string", enum: ["THEORY", "QUIZ"] },
                },
                required: ["title", "type"],
              },
            },
          },
          required: ["title", "description", "lessons"],
        },
      },
    },
    required: ["title", "description", "estimatedHours", "difficulty", "tags", "modules"],
  },
};

// Static system prompt — identical across every outline call.
// cache_control marks the end of the cacheable prefix; if the block is
// below the model's minimum (2048 tokens for Sonnet), caching is silently
// skipped and the call still works.
function buildSystemBlocks(): Anthropic.TextBlockParam[] {
  const text = [
    persona(
      "You are a senior instructional designer creating structured online " +
        "courses. Your outlines are focused, pedagogically sound, and " +
        "proportional to the available source material."
    ),
    regras(
      [
        "- Return metadata via the create_course_outline tool. Never return prose.",
        "- Each module ends with a single QUIZ lesson after 2-4 THEORY lessons.",
        "- Difficulty is one of EASY, MEDIUM, HARD.",
        "- estimatedHours is realistic for the total lesson count (2-12).",
        "- Tags describe the topic, not the format (avoid tags like 'course' or 'online').",
        "- Module and lesson titles must be concrete, not generic ('Intro to X' is fine, 'Chapter 1' is not).",
      ].join("\n")
    ),
    antiInjection(),
  ].join("\n\n");

  return [
    {
      type: "text",
      text,
      cache_control: { type: "ephemeral" },
    },
  ];
}

function buildUserMessage(input: OutlineInput): string {
  const hasSources = Boolean(input.sourcesContext);
  const scalingRule = hasSources
    ? "IMPORTANT: Base the course ONLY on the provided source material. Scale modules and lessons to content volume — a short video or article warrants 1-2 modules with 2-3 lessons each. Do not add topics absent from the sources."
    : "";
  const scopeKey = (input.scope ?? "COMPLETE").toLowerCase();
  const scopeConstraints = SCOPE_CONSTRAINTS[scopeKey] ?? SCOPE_CONSTRAINTS.complete;
  const moduleCountRule = hasSources
    ? "- 1 to 3 modules (scale to content volume)"
    : `- ${scopeConstraints.modules}`;
  const theoryLessonsRule = hasSources
    ? "- 2 to 4 THEORY lessons per module, followed by 1 QUIZ lesson"
    : `- ${scopeConstraints.lessons}, followed by 1 QUIZ lesson`;

  const parts: string[] = [
    buildLanguageInstruction(input.language),
    "",
    "Generate a course outline by calling the create_course_outline tool.",
    "",
    userData(
      "TOPIC",
      input.topic || "Derive a suitable topic and title from the provided source material."
    ),
  ];

  if (input.customContext) {
    parts.push("", userData("USER CONTEXT", input.customContext));
  }
  if (input.sourcesContext) {
    parts.push("", userData("SOURCE MATERIAL", input.sourcesContext.slice(0, 40000)));
  }
  if (input.researchContext) {
    parts.push("", userData("RESEARCH MATERIAL", input.researchContext));
  }

  parts.push("", "Rules:");
  if (scalingRule) parts.push(scalingRule);
  parts.push(moduleCountRule, theoryLessonsRule, "- 3 to 6 tags");

  return parts.join("\n");
}

export async function generateOutline(input: OutlineInput): Promise<CourseOutline> {
  return callAnthropicJson({
    specName: "outline",
    model: "claude-sonnet-4-6",
    maxTokens: 2000,
    system: buildSystemBlocks(),
    userMessage: buildUserMessage(input),
    tool: outlineTool,
    schema: CourseOutlineSchema,
  });
}

// Re-export for callers that need the raw source type.
export type { IngestSource };
