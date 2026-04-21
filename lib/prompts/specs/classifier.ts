import type Anthropic from "@anthropic-ai/sdk";
import { callAnthropicJson } from "@/lib/prompts/runner";
import { DomainClassifierSchema, type DomainContext } from "@/lib/prompts/schemas";
import { userData } from "@/lib/prompts/tags";

export interface ClassifierInput {
  topic: string;
}

const classifierTool: Anthropic.Tool = {
  name: "classify_domain",
  description:
    "Classify the course topic so the lesson generator knows whether to inject code sandboxes and algorithm demos.",
  input_schema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        enum: [
          "programming",
          "science",
          "math",
          "business",
          "history",
          "language",
          "health",
          "other",
        ],
      },
      sandboxTemplate: {
        type: ["string", "null"],
        enum: [
          "react",
          "react-ts",
          "vanilla",
          "vanilla-ts",
          "vue",
          "node",
          "static",
          "python",
          null,
        ],
        description: "Must be null unless domain is 'programming'.",
      },
      relevantDemos: {
        type: "array",
        items: {
          type: "string",
          enum: ["bubble-sort", "binary-search", "css-flexbox"],
        },
        description:
          "Subset of the allowed demo ids. Include only when directly relevant; empty array otherwise.",
      },
      tone: {
        type: "string",
        enum: ["technical", "practical", "conceptual"],
      },
      suggestedEmphasis: {
        type: "string",
        enum: ["practice", "case_study", "balanced"],
        description:
          "Hint for lesson composition emphasis. Use 'practice' for procedural/technical topics with clear execution steps (e.g. programming, cooking, instrumental music). Use 'case_study' for historical, social, philosophical, or narrative topics. Use 'balanced' for everything else.",
      },
    },
    required: ["domain", "sandboxTemplate", "relevantDemos", "tone", "suggestedEmphasis"],
  },
};

// Short prompt — not cacheable (below Haiku's 4096-token minimum).
// Kept stateless and cheap. No system message.
function buildUserMessage(input: ClassifierInput): string {
  return [
    "Classify this course topic by calling the classify_domain tool.",
    "",
    userData("TOPIC", input.topic || "general education"),
    "",
    "Rules:",
    "- sandboxTemplate must be null unless domain is 'programming'.",
    "- When domain is 'programming', sandboxTemplate must be one of: react, react-ts, vanilla, vanilla-ts, vue, node, static, python.",
    "  Use 'python' for Python courses.",
    "  Use 'node' for Go, Rust, shell, databases, data science, general server-side scripting (non-Python).",
    "  Use 'react' or 'react-ts' for frontend/UI topics.",
    "  Use 'vanilla' for plain HTML/CSS/JS.",
    "  Use null if no interactive sandbox would add value.",
    "- NEVER use a language name like 'go', 'java', 'ruby' as sandboxTemplate — 'python' is the only allowed language name.",
    "- relevantDemos must be a subset of the allowed enum values; empty array if none apply.",
    "- suggestedEmphasis: set to 'practice' if the topic is procedural/technical (programming, cooking, instrument playing, sports technique); 'case_study' if historical, social, philosophical, or narrative; 'balanced' otherwise.",
  ].join("\n");
}

export async function classifyDomain(input: ClassifierInput): Promise<DomainContext> {
  return callAnthropicJson({
    specName: "classifier",
    model: "claude-haiku-4-5-20251001",
    maxTokens: 300,
    userMessage: buildUserMessage(input),
    tool: classifierTool,
    schema: DomainClassifierSchema,
  });
}
