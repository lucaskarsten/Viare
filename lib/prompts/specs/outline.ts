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
  suggestedEmphasis?: "practice" | "case_study" | "balanced";
}

// RULE: AI-06 — composição mista por scope com count-based constraints
type CompositionConstraints = {
  required: Partial<Record<string, { min: number; max?: number }>>;
  totalLessons: { min: number; max: number };
  startsWithOneOf?: string[];
  endsWithOneOf?: string[];
  middleMustHaveDiversity?: boolean;
};

type CompositionValidation = { valid: boolean; errors: string[] };

// RULE: AI-06 — composição mista por scope com count-based constraints
export function validateComposition(
  lessons: Array<{ type: string }>,
  constraints: CompositionConstraints
): CompositionValidation {
  const errors: string[] = [];

  if (lessons.length < constraints.totalLessons.min) {
    errors.push(`Total lessons ${lessons.length} below minimum ${constraints.totalLessons.min}.`);
  }
  if (lessons.length > constraints.totalLessons.max) {
    errors.push(`Total lessons ${lessons.length} exceeds maximum ${constraints.totalLessons.max}.`);
  }

  const counts = lessons.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] ?? 0) + 1;
    return acc;
  }, {});

  for (const [type, bound] of Object.entries(constraints.required)) {
    if (!bound) continue;
    const count = counts[type] ?? 0;
    if (count < bound.min) {
      errors.push(`Lesson type ${type}: count ${count} below minimum ${bound.min}.`);
    }
    if (bound.max !== undefined && count > bound.max) {
      errors.push(`Lesson type ${type}: count ${count} exceeds maximum ${bound.max}.`);
    }
  }

  if (constraints.startsWithOneOf && lessons.length > 0) {
    const first = lessons[0].type;
    if (!constraints.startsWithOneOf.includes(first)) {
      errors.push(
        `First lesson type ${first} not in allowed start list: ${constraints.startsWithOneOf.join(", ")}.`
      );
    }
  }

  if (constraints.endsWithOneOf && lessons.length > 0) {
    const last = lessons[lessons.length - 1].type;
    if (!constraints.endsWithOneOf.includes(last)) {
      errors.push(
        `Last lesson type ${last} not in allowed end list: ${constraints.endsWithOneOf.join(", ")}.`
      );
    }
  }

  if (constraints.middleMustHaveDiversity && lessons.length > 2) {
    const middle = lessons.slice(1, -1);
    const hasNonTheory = middle.some((l) => l.type !== "THEORY");
    if (!hasNonTheory) {
      errors.push("Middle lessons must include at least one non-THEORY lesson for diversity.");
    }
  }

  return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors };
}

const MIXED_CONSTRAINTS: Record<string, CompositionConstraints> = {
  overview: {
    required: {
      THEORY: { min: 2, max: 3 },
      QUIZ: { min: 1, max: 1 },
      LAB: { min: 0, max: 1 },
    },
    totalLessons: { min: 3, max: 4 },
    endsWithOneOf: ["QUIZ"],
  },
  complete: {
    required: {
      CASE_STUDY: { min: 1, max: 1 },
      THEORY: { min: 1, max: 3 },
      REFLECTION: { min: 1, max: 1 },
      QUIZ: { min: 1, max: 1 },
      LAB: { min: 0, max: 1 },
    },
    totalLessons: { min: 4, max: 6 },
    startsWithOneOf: ["CASE_STUDY", "THEORY"],
    endsWithOneOf: ["QUIZ"],
    middleMustHaveDiversity: true,
  },
  deep: {
    required: {
      CASE_STUDY: { min: 0, max: 3 },
      PRACTICE: { min: 1, max: 10 },
      THEORY: { min: 8, max: 28 },
      REFLECTION: { min: 1, max: 4 },
      QUIZ: { min: 3, max: 10 },
      LAB: { min: 0, max: 2 },
    },
    totalLessons: { min: 18, max: 45 },
    startsWithOneOf: ["CASE_STUDY", "THEORY"],
    endsWithOneOf: ["QUIZ"],
  },
};

function getCompositionConstraints(scopeKey: string): CompositionConstraints {
  return MIXED_CONSTRAINTS[scopeKey] ?? MIXED_CONSTRAINTS.complete;
}

// Legacy hint table — kept for backward-compat user-message hints when mixed flag is off.
// RULE: AI-05 — scope controls module/lesson density in the outline
// RULE: AI-03/AI-05 — scope → module density + expected course hours
const SCOPE_CONSTRAINTS: Record<string, { modules: string; lessons: string; hours: string }> = {
  overview: {
    modules: "1 to 2 modules",
    lessons: "2 THEORY lessons each",
    hours: "estimatedHours should be between 1 and 4",
  },
  complete: {
    modules: "3 to 5 modules",
    lessons: "2 to 3 THEORY lessons each",
    hours: "estimatedHours should be between 8 and 20",
  },
  deep: {
    modules: "6 to 10 modules",
    lessons:
      "2 to 4 mixed-type lessons per module (THEORY, PRACTICE, CASE_STUDY, REFLECTION, QUIZ, LAB)",
    hours: "estimatedHours should be between 20 and 60",
  },
};

// RULE: CA-C5 — LAB added to outline enum; with ENABLE_LAB_GENERATION=false,
// buildLegacyFallback strips LAB → THEORY so existing pipeline is unaffected.
const LESSON_TYPE_ENUM = ["THEORY", "QUIZ", "CASE_STUDY", "REFLECTION", "PRACTICE", "LAB"] as const;

const outlineTool: Anthropic.Tool = {
  name: "create_course_outline",
  description:
    "Emit the course outline: top-level metadata plus 1-10 modules, each with lessons of mixed types. Lesson type drives downstream pedagogy.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Course title" },
      description: { type: "string", description: "2-3 sentence course description" },
      estimatedHours: { type: "integer", minimum: 1, maximum: 60 },
      difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
      maturityRating: {
        type: "string",
        enum: ["GENERAL", "MATURE"],
        description:
          "Set to MATURE if the topic inherently involves sexuality, adult spiritual/ritual practices, recreational drugs, graphic violence, or other content appropriate only for adults. Otherwise GENERAL.",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 6,
      },
      modules: {
        type: "array",
        minItems: 1,
        maxItems: 10,
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
                  type: { type: "string", enum: [...LESSON_TYPE_ENUM] },
                  labVariant: {
                    type: "string",
                    enum: ["CTF", "INTERACTIVE"],
                    description:
                      "Required when type is LAB. CTF = flag-based challenge; INTERACTIVE = self-declared completion.",
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
    required: [
      "title",
      "description",
      "estimatedHours",
      "difficulty",
      "maturityRating",
      "tags",
      "modules",
    ],
  },
};

// Static system prompt — identical across every outline call.
// cache_control marks the end of the cacheable prefix; if the block is
// below the model's minimum (2048 tokens for Sonnet), caching is silently
// skipped and the call still works.
function buildSystemBlocks(): Anthropic.TextBlockParam[] {
  const mixedRule =
    "- Lessons may be of types THEORY, QUIZ, CASE_STUDY, REFLECTION, PRACTICE, LAB — pick the type that best serves the learning goal of each lesson. LAB is available in all scopes (0-1 per course) — use it when a hands-on challenge or CTF exercise would reinforce the learning goals; LAB lessons require a labVariant of CTF or INTERACTIVE.";

  const text = [
    persona(
      "You are a senior instructional designer creating structured online " +
        "courses. Your outlines are focused, pedagogically sound, and " +
        "proportional to the available source material."
    ),
    regras(
      [
        "- Return metadata via the create_course_outline tool. Never return prose.",
        mixedRule,
        "- Difficulty is one of EASY, MEDIUM, HARD.",
        "- estimatedHours is realistic for the total lesson count and scope.",
        "- Tags describe the topic, not the format (avoid tags like 'course' or 'online').",
        "- Module and lesson titles must be concrete, not generic ('Intro to X' is fine, 'Chapter 1' is not).",
        "- Set maturityRating to MATURE if the topic inherently involves sexuality, adult practices, recreational drugs, graphic violence, or other adult-only content; otherwise GENERAL. Treat MATURE topics with academic/anthropological rigor — do not refuse.",
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

function describeConstraints(constraints: CompositionConstraints): string[] {
  const lines: string[] = [];
  lines.push(
    `- Total lessons across all modules combined: between ${constraints.totalLessons.min} and ${constraints.totalLessons.max}.`
  );
  for (const [type, bound] of Object.entries(constraints.required)) {
    if (!bound) continue;
    if (bound.max !== undefined) {
      lines.push(
        `- Lesson type ${type}: between ${bound.min} and ${bound.max} occurrences across the course.`
      );
    } else {
      lines.push(`- Lesson type ${type}: at least ${bound.min} occurrences across the course.`);
    }
  }
  if (constraints.startsWithOneOf) {
    lines.push(`- The first lesson must be one of: ${constraints.startsWithOneOf.join(", ")}.`);
  }
  if (constraints.endsWithOneOf) {
    lines.push(`- The last lesson must be one of: ${constraints.endsWithOneOf.join(", ")}.`);
  }
  if (constraints.middleMustHaveDiversity) {
    lines.push("- Lessons between the first and last must include at least one non-THEORY lesson.");
  }
  return lines;
}

function buildUserMessage(
  input: OutlineInput,
  composition: CompositionConstraints,
  retryHint?: string
): string {
  const hasSources = Boolean(input.sourcesContext);
  const scalingRule = hasSources
    ? "IMPORTANT: Base the course ONLY on the provided source material. Scale modules and lessons to content volume — a short video or article warrants 1-2 modules with 2-3 lessons each. Do not add topics absent from the sources."
    : "";
  const scopeKey = (input.scope ?? "COMPLETE").toLowerCase();
  const scopeConstraints = SCOPE_CONSTRAINTS[scopeKey] ?? SCOPE_CONSTRAINTS.complete;
  const moduleCountRule = hasSources
    ? "- 1 to 3 modules (scale to content volume)"
    : `- ${scopeConstraints.modules}`;
  const hoursRule = hasSources ? "" : `- ${scopeConstraints.hours}`;

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
  parts.push(moduleCountRule);
  if (hoursRule) parts.push(hoursRule);
  parts.push("- 3 to 6 tags");

  parts.push("", "Composition constraints (counts apply to the course total, not per module):");
  parts.push(...describeConstraints(composition));

  if (input.suggestedEmphasis && input.suggestedEmphasis !== "balanced") {
    if (input.suggestedEmphasis === "practice") {
      parts.push(
        "",
        "Emphasis hint: This topic is procedural — prefer PRACTICE over CASE_STUDY in the middle lessons when possible within the constraints."
      );
    } else if (input.suggestedEmphasis === "case_study") {
      parts.push(
        "",
        "Emphasis hint: This topic is narrative/historical — CASE_STUDY works well as the opening lesson."
      );
    }
  }

  if (retryHint) {
    parts.push(
      "",
      "PREVIOUS ATTEMPT FAILED VALIDATION. Fix the following before re-emitting:",
      retryHint
    );
  }

  return parts.join("\n");
}

const OUTLINE_MAX_TOKENS: Record<string, number> = {
  overview: 1500,
  complete: 2500,
  deep: 6000,
};

function flattenLessons(outline: CourseOutline): Array<{ type: string }> {
  return outline.modules.flatMap((m) => m.lessons.map((l) => ({ type: l.type })));
}

function buildLegacyFallback(outline: CourseOutline): CourseOutline {
  // Fallback: collapse to a safe THEORY+QUIZ composition while preserving titles/metadata.
  // LAB lessons are stripped to THEORY here — the LAB generator gate (ENABLE_LAB_GENERATION)
  // is checked downstream; fallback is also used when composition retries exhaust.
  const modules = outline.modules.map((mod) => {
    const theoryLessons = mod.lessons
      .filter((l) => l.type !== "QUIZ")
      .slice(0, 3)
      .map((l) => ({ title: l.title, type: "THEORY" as const }));
    const ensureTheory =
      theoryLessons.length > 0
        ? theoryLessons
        : [{ title: mod.lessons[0]?.title ?? mod.title, type: "THEORY" as const }];
    return {
      title: mod.title,
      description: mod.description,
      lessons: [...ensureTheory, { title: `Quiz: ${mod.title}`, type: "QUIZ" as const }],
    };
  });
  return { ...outline, modules };
}

const MAX_OUTLINE_RETRIES = 2;

export async function generateOutline(input: OutlineInput): Promise<CourseOutline> {
  const scopeKey = (input.scope ?? "COMPLETE").toLowerCase();
  const maxTokens = OUTLINE_MAX_TOKENS[scopeKey] ?? 2500;
  const composition = getCompositionConstraints(scopeKey);

  let lastOutline: CourseOutline | null = null;
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt <= MAX_OUTLINE_RETRIES; attempt++) {
    const retryHint = attempt > 0 ? lastErrors.map((e) => `  • ${e}`).join("\n") : undefined;
    const outline = await callAnthropicJson({
      specName: attempt === 0 ? "outline" : `outline-retry-${attempt}`,
      model: "claude-sonnet-4-6",
      maxTokens,
      system: buildSystemBlocks(),
      userMessage: buildUserMessage(input, composition, retryHint),
      tool: outlineTool,
      schema: CourseOutlineSchema,
    });

    const validation = validateComposition(flattenLessons(outline), composition);
    if (validation.valid) return outline;

    lastOutline = outline;
    lastErrors = validation.errors;
    console.warn(
      JSON.stringify({
        msg: "outline_composition_invalid",
        attempt,
        scope: scopeKey,
        errors: validation.errors,
      })
    );
  }

  // After max retries: log + fallback to a legacy THEORY+QUIZ composition (non-fatal).
  console.warn(
    JSON.stringify({
      msg: "outline_composition_fallback",
      scope: scopeKey,
      errors: lastErrors,
    })
  );
  if (lastOutline) return buildLegacyFallback(lastOutline);
  throw new Error("Outline generation failed: no outline produced after retries.");
}

// Re-export for callers that need the raw source type.
export type { IngestSource };
