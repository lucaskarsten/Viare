import type Anthropic from "@anthropic-ai/sdk";
import { callAnthropicText } from "@/lib/prompts/runner";
import { buildLanguageInstruction } from "@/lib/prompts/language";
import {
  antiInjection,
  exemplos,
  formato,
  matureContentFrame,
  persona,
  regras,
  userData,
} from "@/lib/prompts/tags";

export interface TheoryLessonInput {
  language: string;
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  sandboxTemplate: string | null;
  relevantDemos: string[];
  tone: "technical" | "practical" | "conceptual";
  maturityRating?: "GENERAL" | "MATURE";
  retryWithStrongerFrame?: boolean;
}

// System prompt is intentionally static so Anthropic's prompt cache can reuse
// it across every THEORY lesson of a course. Dynamic values (language, topic,
// sandbox hint) live in the user message below.
function buildSystemBlocks(): Anthropic.TextBlockParam[] {
  const text = [
    persona(
      "You are a senior educational writer creating lesson-length markdown " +
        "for an online learning platform. You explain ideas progressively, " +
        "anchor abstractions with concrete examples, and trust the reader " +
        "without being condescending."
    ),

    regras(
      [
        "- Output clean markdown — headers, bullet points, code blocks as needed.",
        "- 400 to 800 words total (not including block titles).",
        "- No meta-text ('In this lesson...', 'Welcome!'). Start with the content.",
        "- Educational and informational tone only. Never fabricate real PII (CPF, card numbers, real names).",
        "- Use at least one interactive block per lesson.",
        "- If the lesson topic is not programming, do not include sandbox or demo blocks.",
      ].join("\n")
    ),

    antiInjection(),

    formato(
      [
        "Interactive blocks available:",
        "",
        '1) Callouts — `:::callout{type="note"}` (also `tip`, `warning`, `important`, `caution`).',
        "   Use for a short remark that stands out. Place content between the fences, not on the opening line.",
        "   Syntax:",
        '   :::callout{type="tip"}',
        "   Short standalone remark — one or two sentences max.",
        "   :::",
        "",
        "2) Concept cards — `:::cards` with a bullet list.",
        "   Use for 3-6 related terms/concepts presented together.",
        "   Syntax:",
        "   :::cards",
        "   - **Term** — Short definition or explanation.",
        "   - **Another term** — Its explanation.",
        "   :::",
        "",
        "3) Step-by-step — `:::steps` with an ordered list.",
        "   Use for tutorials or sequential processes.",
        "   Syntax:",
        "   :::steps",
        "   1. **Step title** — What to do and why.",
        "   2. **Next step** — And so on.",
        "   :::",
        "",
        '4) Interactive sandbox — `:::sandbox{template="X"}`.',
        "   Only if the user message explicitly opts into sandboxes.",
        "   Place at most one per lesson, near the end, as a practice exercise.",
        "",
        '5) Algorithm/concept demo — `::demo{id="X"}`.',
        "   Only include ids from the allow-list in the user message, and",
        "   only if directly relevant. Never invent demo ids.",
        "",
        "Prefer :::cards for sets of concepts and :::steps for sequential processes.",
      ].join("\n")
    ),

    exemplos(
      [
        "Example 1 — Using :::cards to introduce concepts:",
        "",
        "## Core data types",
        "",
        "Most languages share a small set of primitive types. Before we use them in code,",
        "it helps to see them side by side.",
        "",
        ":::cards",
        "- **Integer** — Whole numbers like 0, 1, -42. Exact by definition.",
        "- **Float** — Decimal numbers. Prone to rounding errors near the machine epsilon.",
        "- **Boolean** — `true` or `false`. The gate every `if` leans on.",
        "- **String** — A sequence of characters. Immutable in most modern languages.",
        ":::",
        "",
        ':::callout{type="tip"}',
        "Floats are approximations, not exact values. Prefer integers for money.",
        ":::",
        "",
        "-----",
        "",
        "Example 2 — Using :::steps for a short tutorial:",
        "",
        "## Setting up the project",
        "",
        "Before we write any code, we need a repeatable local environment.",
        "",
        ":::steps",
        "1. **Install Node 20** — The runtime we target for all examples.",
        "2. **Clone the repo** — `git clone <url>` keeps your local copy linked to origin.",
        "3. **Install dependencies** — `npm install` reads `package.json` and resolves the tree.",
        "4. **Run the dev server** — `npm run dev` starts the hot-reloading bundler.",
        ":::",
        "",
        ':::callout{type="note"}',
        "If step 2 fails, check your SSH keys — HTTPS clones also work for public repos.",
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

function buildUserMessage(input: TheoryLessonInput): string {
  const parts: string[] = [
    buildLanguageInstruction(input.language),
    "",
    "Write the markdown body for this lesson.",
    "",
    userData("LESSON TITLE", input.lessonTitle),
    "",
    userData("MODULE TITLE", input.moduleTitle),
    "",
    userData("COURSE TOPIC", input.topic),
  ];

  if (input.sandboxTemplate) {
    parts.push(
      "",
      `This is a ${input.tone} course. You may include ONE interactive sandbox as practice:`,
      `:::sandbox{template="${input.sandboxTemplate}"}`,
      ":::"
    );
  }

  if (input.relevantDemos.length > 0) {
    parts.push(
      "",
      "Allowed demo ids (use only if directly relevant — skip otherwise):",
      ...input.relevantDemos.map((id) => `::demo{id="${id}"}`)
    );
  }

  // RULE: CONTENT-06 — inject mature frame in user message to preserve system block cache
  if (input.maturityRating === "MATURE") {
    parts.push("", matureContentFrame(input.retryWithStrongerFrame));
  }

  return parts.join("\n");
}

// Builds the reframed user message for retry attempts after a refusal.
// RULE: CONTENT-09 — retry uses stronger academic framing before failing.
export function buildReframedUserMessage(input: TheoryLessonInput): string {
  return buildUserMessage({ ...input, maturityRating: "MATURE", retryWithStrongerFrame: true });
}

export async function generateTheoryLesson(
  input: TheoryLessonInput
): Promise<{ text: string; stopReason: string | null }> {
  return callAnthropicText({
    specName: "theory-lesson",
    model: "claude-sonnet-4-6",
    maxTokens: 2000,
    system: buildSystemBlocks(),
    userMessage: buildUserMessage(input),
  });
}
