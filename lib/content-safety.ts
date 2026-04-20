// RULE: CONTENT-01 — sanitize user input before LLM calls
// RULE: CONTENT-02 — absolute blocklist (never published)
// RULE: CONTENT-03 — restricted categories (require manual review)

const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instruction/i,
  /forget\s+(everything|all|previous)/i,
  /you\s+are\s+now\s+(a|an)\s/i,
  /act\s+as\s+(if\s+you\s+(are|were)|a|an)\s/i,
  /pretend\s+(you|to\s+be)\s/i,
  /jailbreak/i,
  /DAN\s*mode/i,
  /\[\s*SYSTEM\s*\]/i,
  /\[\s*INST\s*\]/i,
  /<\s*system\s*>/i,
  /bypass\s+(safety|filter|guardrail)/i,
  /new\s+conversation\s+start/i,
  /disregard\s+(all|previous|your)\s+(instructions?|rules?|guidelines?)/i,
];

// RULE: CONTENT-02 — absolute blocklist
const BLOCKED_PATTERNS = [
  /child\s*(sex|porn|abuse|exploit|erotica)/i,
  /csam/i,
  /(how\s+to\s+)?(make|build|create|synthesize|produce)\s+(a\s+)?(bomb|explosive|bioweapon|nerve\s+agent|anthrax|ricin|sarin|vx\s+nerve)/i,
  /(ransomware|keylogger|rootkit)\s+(source\s+code|tutorial|how\s+to\s+(make|build|create|write|code))/i,
  /working\s+(exploit|payload|shellcode)\s+for\s+cve-?\d+/i,
  /real\s+(child|minor|kid)\s+(nude|naked|sexual)/i,
];

// RULE: CONTENT-03 — restricted (operational vs educational threshold)
const RESTRICTED_PATTERNS = [
  /(step[\s-]by[\s-]step|complete\s+guide\s+to)\s+(hacking|attacking|exploiting)\s+(facebook|google|instagram|netflix|paypal|bank|amazon)/i,
  /credential\s+(stuffing|spraying)\s+(script|tool|attack)/i,
  /(how\s+to\s+)?(cook|make|produce|manufacture)\s+(crystal\s+meth|methamphetamine|heroin|fentanyl|crack\s+cocaine)/i,
  /convert\s+(semi[\s-]?auto|pistol|rifle)\s+(to|into)\s+(full[\s-]?auto|automatic)/i,
  /undetectable\s+(malware|virus|trojan|backdoor)/i,
];

// Red flags in generated content
const CONTENT_RED_FLAGS = [
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF
  /\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/, // credit card
  /(here\s+is|below\s+is)\s+(a\s+)?(working|functional|complete)\s+(exploit|payload|attack\s+script)/i,
  /paste\s+(this|the\s+following)\s+into\s+(terminal|cmd|powershell)\s+to\s+(destroy|delete|wipe|rm\s+-rf)/i,
];

export type SafetyCheckResult =
  | { status: "safe" }
  | { status: "blocked"; reason: "injection" | "blocked_category" }
  | { status: "restricted"; reason: "restricted_category" };

export function checkInputSafety(input: string): SafetyCheckResult {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { status: "blocked", reason: "injection" };
    }
  }
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return { status: "blocked", reason: "blocked_category" };
    }
  }
  for (const pattern of RESTRICTED_PATTERNS) {
    if (pattern.test(input)) {
      return { status: "restricted", reason: "restricted_category" };
    }
  }
  return { status: "safe" };
}

export type ContentClassification =
  | { verdict: "clean" }
  | { verdict: "blocked" }
  | { verdict: "restricted" };

export function classifyGeneratedContent(content: string): ContentClassification {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) return { verdict: "blocked" };
  }
  for (const pattern of CONTENT_RED_FLAGS) {
    if (pattern.test(content)) return { verdict: "blocked" };
  }
  for (const pattern of RESTRICTED_PATTERNS) {
    if (pattern.test(content)) return { verdict: "restricted" };
  }
  return { verdict: "clean" };
}

// RULE: CONTENT-09 — refusal text detection (never persist)
const REFUSAL_PREFIXES = [
  "desculpe",
  "não posso",
  "nao posso",
  "eu não posso",
  "i can't",
  "i cannot",
  "i'm not able",
  "i apologize",
  "sorry,",
  "lo siento",
  "no puedo",
  "désolé",
  "je ne peux",
  "entschuldigung",
  "ich kann nicht",
];

const HAS_MARKDOWN_HEADER = /^#{2,3}\s/m;
const HAS_INTERACTIVE_BLOCK = /^:::(callout|cards|steps|sandbox)/m;
const HAS_CODE_FENCE = /```/;

export function isRefusalText(text: string, stopReason?: string | null): boolean {
  const len = text.length;

  let primaryCount = 0;
  if (len < 300) primaryCount++;
  if (
    !HAS_MARKDOWN_HEADER.test(text) &&
    !HAS_INTERACTIVE_BLOCK.test(text) &&
    !HAS_CODE_FENCE.test(text)
  )
    primaryCount++;
  if (stopReason === "end_turn" && len < 500) primaryCount++;

  if (primaryCount >= 2) return true;

  if (primaryCount >= 1) {
    const prefix = text.slice(0, 60).toLowerCase();
    for (const p of REFUSAL_PREFIXES) {
      if (prefix.includes(p)) return true;
    }
  }

  return false;
}

// RULE: CONTENT-06 — sensitive topic suggestion/gating
const SENSITIVE_TOPIC_PATTERNS = [
  /\b(tantr[ao]|tantric|tantrica|kama\s*sutra|yab[\s-]?yum)\b/i,
  /\b(sexualidade|educação\s+sexual|educacao\s+sexual|sex\s+education|sexual\s+practice)/i,
  /\b(BDSM|fetiche|fetish|kink|pornografia|pornography|prostituição|prostituicao|prostitution)\b/i,
  /\b(ayahuasca|LSD|psilocybin|psilocibina|DMT|MDMA|ecstasy|cannabis|maconha)\b/i,
  /\b(drogas\s+psicoativas|substâncias\s+psicodélicas|substancias\s+psicodelicas|psychedelic|recreational\s+drug)/i,
  /\b(nudismo|nudism|naturismo)\b/i,
  /\b(violência\s+sexual|violencia\s+sexual|sexual\s+violence)/i,
];

export function detectSensitiveTopic(topic: string): boolean {
  return SENSITIVE_TOPIC_PATTERNS.some((p) => p.test(topic));
}

// RULE: CONTENT-05 — error messages must not reveal detection patterns
export const SAFETY_MESSAGES = {
  injection: "Não foi possível gerar o curso. Revise o título ou descrição e tente novamente.",
  blocked_category: "Este tópico não está disponível na plataforma. Escolha um assunto diferente.",
  restricted_category:
    "Seu curso foi salvo como rascunho e será revisado pela equipe antes da publicação.",
  content_blocked: "O conteúdo gerado não pôde ser publicado. O rascunho foi salvo para revisão.",
} as const;
