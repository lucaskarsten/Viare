import type Anthropic from "@anthropic-ai/sdk";
import { callAnthropicText } from "@/lib/prompts/runner";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import {
  antiInjection,
  exemplos,
  formato,
  pedagogia,
  persona,
  regras,
  userData,
} from "@/lib/prompts/tags";

export interface PracticeLessonInput {
  language: string;
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  tone: "technical" | "practical" | "conceptual";
}

// Static system prompt — cached across every PRACTICE lesson.
function buildSystemBlocks(): Anthropic.TextBlockParam[] {
  const text = [
    persona(
      "You are a senior educator designing practical exercises. You first " +
        "demonstrate one solved example, then ask the learner to apply the " +
        "same reasoning on their own. You never reveal the answer to the " +
        "second exercise — only progressive hints."
    ),

    regras(
      [
        "- Output clean markdown only. No meta-text, no preamble.",
        "- Two top-level sections in this order: 'Exemplo Resolvido' and 'Sua Vez'.",
        "- The first section must use a `:::steps` block to walk through the worked example step by step.",
        "- The second section must contain 1 or 2 short exercises analogous to the worked example.",
        '- Each exercise has at least one progressive hint inside `:::callout{type="tip"}`. Hints nudge — they do not give the answer.',
        "- For non-technical topics, replace 'code' with 'scenario + decision' (the worked example walks through a concrete scenario and the decision made).",
        "- Educational tone only. Never fabricate real PII (CPF, card numbers, real names).",
        "- 350 to 700 words total.",
      ].join("\n")
    ),

    // RULE: AI-08 — Bloom Apply anchor for PRACTICE lessons.
    pedagogia(
      "Bloom target: Apply. The learner produces output using a procedure — not just recognizes it.",
      "Lesson MUST contain a section titled exactly 'Sua Vez' with at least one ':::callout{type=\"tip\"}' block.",
      "Faded hints — provide exactly 2 hint levels inside the 'Sua Vez' section: Hint 1 = orientation (reference the worked example); Hint 2 = strategy (next sub-goal without the answer). Never give the solution.",
      "Near-transfer only: exercises use the same procedure as the worked example with surface variation (different inputs, different domain framing) — do not introduce a harder procedure.",
      "Never name pedagogical frameworks in output (no 'Bloom', 'scaffolding', 'worked example')."
    ),

    antiInjection(),

    formato(
      [
        "Required block syntax:",
        "",
        "1) Step-by-step worked example — `:::steps` with an ordered list.",
        "   :::steps",
        "   1. **Step title** — What we do and why.",
        "   2. **Next step** — Continue the reasoning.",
        "   :::",
        "",
        '2) Hints — `:::callout{type="tip"}`.',
        '   :::callout{type="tip"}',
        "   A nudge — points toward the next move without revealing the answer.",
        "   :::",
      ].join("\n")
    ),

    exemplos(
      [
        "Example — technical topic (small algorithm):",
        "",
        "## Exemplo Resolvido",
        "",
        "Inverter uma string sem usar funções nativas.",
        "",
        ":::steps",
        '1. **Definir o objetivo** — Receber `"hello"` e devolver `"olleh"`.',
        "2. **Percorrer de trás para frente** — Iteramos do último índice ao primeiro.",
        "3. **Acumular em uma nova string** — Concatenamos cada caractere visitado.",
        "4. **Retornar o resultado** — A nova string já está invertida.",
        ":::",
        "",
        "## Sua Vez",
        "",
        "**Exercício 1.** Implemente uma função que recebe uma palavra e devolve `true` se for um palíndromo.",
        "",
        ':::callout{type="tip"}',
        "Reuse a ideia do exemplo: comparar a palavra original com a versão invertida.",
        ":::",
        "",
        "-----",
        "",
        "Example — non-technical topic (decision exercise):",
        "",
        "## Exemplo Resolvido",
        "",
        "Negociar um aumento com base em valor entregue, não em tempo de casa.",
        "",
        ":::steps",
        "1. **Levantar evidências** — Listar 3 entregas concretas com impacto mensurável.",
        "2. **Definir a faixa** — Pesquisar a banda salarial do cargo no mercado.",
        "3. **Abrir alto, justificar com valor** — Pedir o teto da banda, ancorar no impacto, não no histórico.",
        "4. **Manter alternativa** — Ter clareza sobre o que aceitar e o que recusar.",
        ":::",
        "",
        "## Sua Vez",
        "",
        "**Exercício 1.** Você quer migrar de área dentro da empresa. Estruture sua conversa com o gestor em 4 passos.",
        "",
        ':::callout{type="tip"}',
        "Pense primeiro no problema do gestor que sua mudança resolve, depois no seu desejo.",
        ":::",
      ].join("\n")
    ),
  ].join("\n\n");

  return [
    {
      type: "text",
      text,
      cache_control: { type: "ephemeral" },
    },
  ];
}

function buildUserMessage(input: PracticeLessonInput): string {
  return [
    buildLanguageInstruction(input.language),
    "",
    `Write the markdown body for a PRACTICE lesson in a ${input.tone} course.`,
    "",
    userData("LESSON TITLE", input.lessonTitle),
    "",
    userData("MODULE TITLE", input.moduleTitle),
    "",
    userData("COURSE TOPIC", input.topic),
  ].join("\n");
}

export async function generatePracticeLesson(
  input: PracticeLessonInput
): Promise<{ text: string; stopReason: string | null }> {
  return callAnthropicText({
    specName: "practice-lesson",
    model: "claude-sonnet-4-6",
    maxTokens: 4000,
    system: buildSystemBlocks(),
    userMessage: buildUserMessage(input),
  });
}
