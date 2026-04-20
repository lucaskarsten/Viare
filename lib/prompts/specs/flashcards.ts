import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { callAnthropicJson } from "@/lib/prompts/runner";
import { FlashcardsSchema, type Flashcards } from "@/lib/prompts/schemas";
import { userData } from "@/lib/prompts/tags";

export interface FlashcardsInput {
  lessonContent: string;
  language: string;
}

const flashcardsTool: Anthropic.Tool = {
  name: "generate_flashcards",
  description:
    "Emit 3-5 flashcards that capture the key concepts of a lesson. Each card has a front prompt and a concise back answer.",
  input_schema: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            front: { type: "string" },
            back: { type: "string" },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["cards"],
  },
};

const flashcardsOutputSchema = z.object({ cards: FlashcardsSchema });

function buildUserMessage(input: FlashcardsInput): string {
  const truncated = input.lessonContent.slice(0, 6000);
  return [
    `Generate 3-5 flashcards in the lesson's original language from the content below. Keep fronts short (a concept, term, or question), and backs concise (one or two sentences).`,
    "",
    userData("LESSON CONTENT", truncated),
  ].join("\n");
}

export async function generateFlashcards(input: FlashcardsInput): Promise<Flashcards> {
  const { cards } = await callAnthropicJson({
    specName: "flashcards",
    model: "claude-haiku-4-5-20251001",
    maxTokens: 1000,
    userMessage: buildUserMessage(input),
    tool: flashcardsTool,
    schema: flashcardsOutputSchema,
  });
  return cards;
}
