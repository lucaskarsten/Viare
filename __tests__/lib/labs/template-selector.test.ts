import { describe, it, expect } from "vitest";
import { selectTemplate } from "@/lib/labs/template-selector";
import { listTemplates } from "@/lib/labs/templates/registry";

describe("selectTemplate — INTERACTIVE variant", () => {
  it("'programming' → code-lab", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "programming" })).toBe("code-lab");
  });

  it("'tech' → code-lab", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "tech" })).toBe("code-lab");
  });

  it("'devops' → code-lab", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "devops" })).toBe("code-lab");
  });

  it("'math' → interactive-calculator", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "math" })).toBe(
      "interactive-calculator"
    );
  });

  it("'finance' → interactive-calculator", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "finance" })).toBe(
      "interactive-calculator"
    );
  });

  it("'physics' → interactive-calculator", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "physics" })).toBe(
      "interactive-calculator"
    );
  });

  it("'statistics' → interactive-calculator or interactive-chart (both valid)", () => {
    const result = selectTemplate({ labVariant: "INTERACTIVE", domain: "statistics" });
    expect(["interactive-calculator", "interactive-chart"]).toContain(result);
  });

  it("'science' → interactive-chart", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "science" })).toBe(
      "interactive-chart"
    );
  });

  it("'economics' → interactive-chart", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "economics" })).toBe(
      "interactive-chart"
    );
  });

  it("'data' → interactive-chart", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "data" })).toBe("interactive-chart");
  });

  it("unknown domain falls back to an INTERACTIVE template id", () => {
    const result = selectTemplate({ labVariant: "INTERACTIVE", domain: "unknown-domain" });
    const interactiveIds = listTemplates()
      .filter((t) => t.type === "INTERACTIVE")
      .map((t) => t.id);
    expect(interactiveIds).toContain(result);
  });

  it("'history' → interactive-timeline (Phase E)", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "history" })).toBe(
      "interactive-timeline"
    );
  });

  it("'biography' → interactive-timeline", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "biography" })).toBe(
      "interactive-timeline"
    );
  });

  it("'process' → interactive-timeline", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "process" })).toBe(
      "interactive-timeline"
    );
  });

  it("'geography' → interactive-map", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "geography" })).toBe(
      "interactive-map"
    );
  });

  it("'culture' → interactive-map", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "culture" })).toBe(
      "interactive-map"
    );
  });

  it("'language' → interactive-map (Phase E)", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "language" })).toBe(
      "interactive-map"
    );
  });

  it("'music' → interactive-piano (Phase E)", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "music" })).toBe(
      "interactive-piano"
    );
  });

  it("'theory' → interactive-piano", () => {
    expect(selectTemplate({ labVariant: "INTERACTIVE", domain: "theory" })).toBe(
      "interactive-piano"
    );
  });

  it("'general' (no match) falls back to an INTERACTIVE template", () => {
    const result = selectTemplate({ labVariant: "INTERACTIVE", domain: "general" });
    const interactiveIds = listTemplates()
      .filter((t) => t.type === "INTERACTIVE")
      .map((t) => t.id);
    expect(interactiveIds).toContain(result);
  });
});

describe("selectTemplate — CTF variant", () => {
  it("'programming' + CTF → sentinel 'ctf-flag-hunt'", () => {
    expect(selectTemplate({ labVariant: "CTF", domain: "programming" })).toBe("ctf-flag-hunt");
  });

  it("'math' + CTF → sentinel 'ctf-flag-hunt'", () => {
    expect(selectTemplate({ labVariant: "CTF", domain: "math" })).toBe("ctf-flag-hunt");
  });

  it("any domain + CTF → 'ctf-flag-hunt'", () => {
    const domains = ["science", "history", "music", "finance", "language", "general"];
    for (const domain of domains) {
      expect(selectTemplate({ labVariant: "CTF", domain })).toBe("ctf-flag-hunt");
    }
  });
});
