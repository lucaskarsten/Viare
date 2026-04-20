import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { callAnthropicJson } from "@/lib/prompts/runner";
import { QuizQuestionsSchema, type QuizQuestions } from "@/lib/prompts/schemas";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import { antiInjection, persona, regras, userData } from "@/lib/prompts/tags";

export interface QuizInput {
  language: string;
  topic: string;
  moduleTitle: string;
}

const quizTool: Anthropic.Tool = {
  name: "generate_quiz",
  description:
    "Emit exactly 5 multiple-choice questions grounded in the module. Each question has 4 options and exactly one correct answer.",
  input_schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: { type: "string" },
            },
            correctIndex: { type: "integer", minimum: 0, maximum: 3 },
            explanation: { type: "string" },
          },
          required: ["question", "options", "correctIndex", "explanation"],
        },
      },
    },
    required: ["questions"],
  },
};

// Tool Use wraps results in an object; Zod mirrors that wrapper.
const quizOutputSchema = z.object({ questions: QuizQuestionsSchema });

function buildSystemBlocks(): Anthropic.TextBlockParam[] {
  const text = [
    persona(
      "You are a quiz author for an online learning platform. Your questions " +
        "test practical understanding, not trivia or memorization."
    ),
    regras(
      [
        "- Emit questions via the generate_quiz tool. Never return prose.",
        "- Exactly 5 questions per quiz.",
        "- Each question has 4 options; exactly one is correct (correctIndex is 0-3).",
        "- Options must be plausible — no obvious fillers like 'None of the above' unless it is genuinely the answer.",
        "- Explanations are one sentence, focused on why the correct answer is right.",
        "- Questions must reflect the module's scope, not the whole course.",
      ].join("\n")
    ),
    antiInjection(),
  ].join("\n\n");

  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}

function buildUserMessage(input: QuizInput): string {
  return [
    buildLanguageInstruction(input.language),
    "",
    "Generate 5 multiple-choice questions for this module.",
    "",
    userData("MODULE TITLE", input.moduleTitle),
    "",
    userData("COURSE TOPIC", input.topic),
  ].join("\n");
}

export async function generateQuiz(input: QuizInput): Promise<QuizQuestions> {
  const { questions } = await callAnthropicJson({
    specName: "quiz",
    model: "claude-sonnet-4-6",
    maxTokens: 2000,
    system: buildSystemBlocks(),
    userMessage: buildUserMessage(input),
    tool: quizTool,
    schema: quizOutputSchema,
  });
  return questions;
}
