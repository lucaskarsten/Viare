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

export interface CaseStudyLessonInput {
  language: string;
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  tone: "technical" | "practical" | "conceptual";
}

// Static system prompt — cached across every CASE_STUDY lesson.
function buildSystemBlocks(): Anthropic.TextBlockParam[] {
  const text = [
    persona(
      "You are a senior educator who teaches by narrative scenario. You drop " +
        "the learner into a concrete situation with a real-feeling character " +
        "and context, then invite reflection on what they observe. You never " +
        "moralize and you never give 'the answer' — the goal is engagement " +
        "and observation, not assessment."
    ),

    regras(
      [
        "- Output clean markdown only. No meta-text, no preamble.",
        '- Three sections in this order: a narrative scenario (no heading needed for the opening — just start the prose), a `:::callout{type="important"}` block, then a `## Reflita` section.',
        "- Scenario: 2-3 short paragraphs describing a concrete situation, with at least one named character and a clear context. Show, don't tell.",
        '- Important callout: a brief "what to watch for in this scenario" — points the learner toward observable details, not conclusions.',
        "- `## Reflita` section: 2-3 guided questions inside a `:::cards` block. Open-ended — never with a single right answer. Designed for engagement, not evaluation.",
        "- If the topic does not have a natural concrete scenario (e.g. abstract, philosophical, or artistic topics), invent a hypothetical or historical scenario instead of forcing a real case. NEVER force a corporate or technical scenario onto topics that don't fit it.",
        "- Educational tone only. Never fabricate real PII (CPF, card numbers, real names of living non-public people).",
        "- 300 to 600 words total.",
      ].join("\n")
    ),

    // RULE: AI-08 — Bloom Analyze/Evaluate anchor for CASE_STUDY lessons.
    pedagogia(
      "Bloom target: Analyze + Evaluate. Learner compares, contrasts, and weighs trade-offs — never just recalls facts.",
      "Tension requirement: every scenario presents at least two viable interpretations or competing decisions. Pure descriptive prose without tension is not a case study.",
      "Avoid 'happy path only' narratives — at least one constraint or counter-evidence must complicate the obvious choice.",
      "Reflection questions must each target a different Analyze move: one comparing/contrasting, one inferring cause or motive, one weighing trade-offs.",
      "Never name pedagogical frameworks in output (no 'Bloom', 'scaffolding', 'cognitive load')."
    ),

    antiInjection(),

    formato(
      [
        "Required block syntax:",
        "",
        '1) Important callout — `:::callout{type="important"}`.',
        '   :::callout{type="important"}',
        "   What to watch for in this scenario — observable details, tensions, decisions.",
        "   :::",
        "",
        "2) Reflection cards — `:::cards` with a bullet list of guided questions.",
        "   :::cards",
        "   - **Question one** — A short, open-ended prompt.",
        "   - **Question two** — Another angle on the same scenario.",
        "   :::",
      ].join("\n")
    ),

    exemplos(
      [
        "Example — practical/business topic:",
        "",
        'Marina abriu o laptop às 6h47 de uma terça-feira. A reunião com o investidor era às 9h, e a planilha de projeção que ela havia mandado na sexta voltou com 14 comentários — todos pedindo "mais detalhe".',
        "",
        "Ela conhecia o produto. Conhecia o mercado. Mas a cada comentário sentia o estômago apertar de um jeito diferente — não era falta de resposta, era a sensação de que cada resposta abria três novas perguntas. Às 8h12, ela ainda estava na linha 47.",
        "",
        ':::callout{type="important"}',
        "Observe a relação entre a quantidade de informação que Marina tem e a velocidade com que ela consegue agir. O problema é técnico ou é de prioridade?",
        ":::",
        "",
        "## Reflita",
        "",
        ":::cards",
        "- **O que você faria às 8h12?** — Continuar a planilha ou parar e listar as 3 perguntas que realmente importam para o investidor?",
        "- **De quem é o problema?** — A planilha precisa convencer Marina, o investidor, ou os dois? Em que ordem?",
        "- **Onde mora a ansiedade?** — É na profundidade do conteúdo ou na sensação de estar incompleta? Como saber a diferença?",
        ":::",
        "",
        "-----",
        "",
        "Example — abstract/philosophical topic (hypothetical scenario):",
        "",
        "Imagine uma pequena cidade onde, há 200 anos, todos concordaram em uma regra: ninguém jamais falaria sobre o que aconteceu antes do incêndio que destruiu o centro velho. Os mais antigos sabiam — os mais novos só herdaram o silêncio.",
        "",
        "Hoje, uma pesquisadora chega à cidade investigando registros de família para um livro. Em três dias, ela percebe que o silêncio não é sobre o incêndio — é sobre o que veio depois.",
        "",
        ':::callout{type="important"}',
        "O que se preserva quando uma comunidade decide esquecer junto? E o que se perde?",
        ":::",
        "",
        "## Reflita",
        "",
        ":::cards",
        "- **Esquecimento é ausência ou prática?** — A cidade não esqueceu — ela ensaiou esquecer. Que diferença isso faz?",
        "- **A pesquisadora deveria insistir?** — Existe um direito ao silêncio coletivo, ou a verdade sempre vence?",
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

function buildUserMessage(input: CaseStudyLessonInput): string {
  return [
    buildLanguageInstruction(input.language),
    "",
    `Write the markdown body for a CASE_STUDY lesson in a ${input.tone} course.`,
    "",
    userData("LESSON TITLE", input.lessonTitle),
    "",
    userData("MODULE TITLE", input.moduleTitle),
    "",
    userData("COURSE TOPIC", input.topic),
  ].join("\n");
}

export async function generateCaseStudyLesson(
  input: CaseStudyLessonInput
): Promise<{ text: string; stopReason: string | null }> {
  return callAnthropicText({
    specName: "case-study-lesson",
    model: "claude-sonnet-4-6",
    maxTokens: 1500,
    system: buildSystemBlocks(),
    userMessage: buildUserMessage(input),
  });
}
