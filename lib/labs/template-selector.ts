import { listTemplates, type TemplateLabType } from "./templates/registry";

export type TemplateSelectorInput = {
  labVariant: TemplateLabType;
  domain: string;
  topicHints?: string[];
};

const FALLBACK_INTERACTIVE = "interactive-chart";
// CTF: V1 has no CTF templates in registry — sentinel consumed by Phase C generator
const FALLBACK_CTF = "ctf-flag-hunt";

// RULE: P2 — zero-LLM for deterministic decisions
export function selectTemplate(input: TemplateSelectorInput): string {
  if (input.labVariant === "INTERACTIVE") {
    const match = listTemplates().find(
      (t) => t.type === "INTERACTIVE" && t.domains.includes(input.domain)
    );
    if (match) return match.id;

    const anyInteractive = listTemplates().find((t) => t.type === "INTERACTIVE");
    return anyInteractive?.id ?? FALLBACK_INTERACTIVE;
  }

  return FALLBACK_CTF;
}
