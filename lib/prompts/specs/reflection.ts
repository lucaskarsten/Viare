import { callAnthropicText } from "@/lib/prompts/runner";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import { antiInjection, persona, regras, userData } from "@/lib/prompts/tags";

export interface ReflectionLessonInput {
  language: string;
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
}

// RULE: AI-08 — Reflection prompt is intentionally NOT cache-tagged: it sits below
// Anthropic's 2048-token minimum for ephemeral cache (adding pedagogia()/exemplos()
// would not cross that threshold and would only add maintenance surface).
// Metacognition rules are inlined in regras() to keep the spec lean and uncached.
function buildSystem(): string {
  return [
    persona(
      "You are a senior educator designing reflection prompts. You ask one " +
        "central, open-ended question that invites the learner to think " +
        "metacognitively about what they just studied — what they learned, " +
        "how they would apply it, what surprised them. You never grade and " +
        "you never give a 'right answer'."
    ),

    regras(
      [
        "- Output clean markdown only. No meta-text, no preamble, no headings on the question.",
        "- Two blocks separated by a blank line.",
        '- Block 1: ONE central reflection question (1-2 sentences). Open-ended, metacognitive — focus on "what did you learn", "how would you apply this", "what surprised you". Never has a single correct answer.',
        '- Block 2: a heading "## Pontos de apoio" (or the equivalent in the target language) followed by 2-3 bullet points. Each bullet is a hint or angle for learners who get stuck. These bullets are revealed by the UI AFTER the learner writes their reflection — never before.',
        "- 80 to 200 words total.",
        "- Metacognitive prompts only: ask what the learner now knows, what surprised them, or how they would act differently. Never introduce new content.",
        "- Choose exactly one metacognitive move per lesson: (a) connection — link new content to prior knowledge; (b) projection — apply to a future scenario; (c) surprise — surface what challenged a prior assumption.",
        "- Each support-point bullet must offer a different angle on the same question — not a paraphrase. Three bullets = three lenses.",
        "- Never name pedagogical frameworks in output (no 'metacognition', 'Bloom', 'scaffolding').",
      ].join("\n")
    ),

    antiInjection(),
  ].join("\n\n");
}

function buildUserMessage(input: ReflectionLessonInput): string {
  return [
    buildLanguageInstruction(input.language),
    "",
    "Write the markdown body for a REFLECTION lesson — one central question + a support-points list.",
    "",
    userData("LESSON TITLE", input.lessonTitle),
    "",
    userData("MODULE TITLE", input.moduleTitle),
    "",
    userData("COURSE TOPIC", input.topic),
  ].join("\n");
}

export async function generateReflectionLesson(
  input: ReflectionLessonInput
): Promise<{ text: string; stopReason: string | null }> {
  return callAnthropicText({
    specName: "reflection-lesson",
    model: "claude-haiku-4-5-20251001",
    maxTokens: 500,
    system: buildSystem(),
    userMessage: buildUserMessage(input),
  });
}
