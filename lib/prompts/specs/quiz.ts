import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { callAnthropicJson } from "@/lib/prompts/runner";
import { QuizQuestionsSchema, type QuizQuestions } from "@/lib/prompts/schemas";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import { antiInjection, exemplos, pedagogia, persona, regras, userData } from "@/lib/prompts/tags";

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
            bloomLevel: {
              type: "string",
              enum: ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"],
            },
          },
          required: ["question", "options", "correctIndex", "explanation", "bloomLevel"],
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
        "- Stems must describe a situation or comparison — never ask 'What is X?' or 'Which of these is X?'. Require the learner to apply or analyze, not recall.",
        "- Each wrong option must encode a plausible learner misconception (over-generalization, near-synonym, false-cause, or scope confusion). No throwaway distractors.",
        "- Explanations name the misconception each wrong distractor encodes, not just why the correct answer is right.",
        "- Spread Bloom levels: 1 question at Understand, 3 at Apply, 1 at Analyze. Tag each question with bloomLevel in the JSON output.",
        "- Questions must reflect the module's scope, not the whole course.",
        "- Never name pedagogical frameworks in stems, options, or explanations.",
      ].join("\n")
    ),

    // RULE: AI-08 — Bloom spread enforced by validator; bloomLevel is stripped before DB write.
    pedagogia(
      "Bloom spread across 5 questions: 1 Understand + 3 Apply + 1 Analyze (minimum ≥3 distinct levels).",
      "Each question must require transfer or discrimination — no vocabulary recall.",
      "Every distractor encodes a specific misconception a real learner could hold after studying the module.",
      "Tag each question with bloomLevel field in JSON (validator-enforced; discarded before storage)."
    ),

    exemplos(
      [
        "Bloom-Apply question example (stem = situation, misconception-tagged distractors):",
        "",
        "{",
        '  "question": "Dado um array [3,1,4,1,5], quantas trocas ocorrem na PRIMEIRA passada do bubble sort?",',
        '  "options": ["1", "2", "3", "4"],',
        '  "correctIndex": 1,',
        "  \"explanation\": \"Compara pares: (3,1)→troca, (3,4)→não, (4,1)→troca, (4,5)→não. Total: 2. Opção 1 (1 troca): confunde 'passada' com 'comparação'. Opção 3 (3 trocas): conta comparações, não trocas. Opção 4 (4 trocas): confunde n-1 comparações com n-1 trocas.\",",
        '  "bloomLevel": "Apply"',
        "}",
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
