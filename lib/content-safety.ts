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

// RULE: CONTENT-05 — error messages must not reveal detection patterns
export const SAFETY_MESSAGES = {
  injection: "Não foi possível gerar o curso. Revise o título ou descrição e tente novamente.",
  blocked_category: "Este tópico não está disponível na plataforma. Escolha um assunto diferente.",
  restricted_category:
    "Seu curso foi salvo como rascunho e será revisado pela equipe antes da publicação.",
  content_blocked: "O conteúdo gerado não pôde ser publicado. O rascunho foi salvo para revisão.",
} as const;
