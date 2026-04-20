import { describe, it, expect, vi, beforeEach } from "vitest";
import { InteractiveLabOutputSchema } from "@/lib/prompts/specs/lab-interactive";

vi.mock("@/lib/prompts/runner", () => ({
  callAnthropicJson: vi.fn(),
}));

vi.mock("@/lib/labs/template-selector", () => ({
  selectTemplate: vi.fn(),
}));

import { callAnthropicJson } from "@/lib/prompts/runner";
import { selectTemplate } from "@/lib/labs/template-selector";
import { generateInteractiveLab } from "@/lib/prompts/specs/lab-interactive";

const validConfig = {
  variables: [{ name: "rate", label: "Taxa (%)", min: 0, max: 100, step: 1, default: 10 }],
  formula: "rate / 100",
  resultLabel: "Taxa decimal",
  instructions: "Ajuste o slider para ver como a taxa muda.",
};

const validOutput = {
  title: "Calculadora de Juros",
  description: "Explore como a taxa de juros afeta o retorno de um investimento.",
  scenario:
    "## Exercício\n\nUse os sliders abaixo para ajustar a taxa de juros.\n\n1. Observe como o resultado muda em tempo real.\n2. Anote a taxa que maximiza o retorno esperado.\n3. Declare que completou quando entender a relação.",
  objectives: [
    "Você ajustou os sliders e observou a mudança no resultado",
    "Você identificou a relação entre taxa e retorno",
  ],
  hints: [
    { text: "Tente aumentar a taxa gradualmente e observe o resultado.", cost: 10 },
    { text: "A fórmula usa divisão por 100 para converter percentual em decimal.", cost: 5 },
  ],
  templateId: "interactive-calculator",
  config: validConfig,
};

const ctxBase = {
  language: "pt" as const,
  topic: "Matemática Financeira",
  moduleTitle: "Juros Compostos",
  lessonTitle: "Taxa de Juros na Prática",
  domainHint: "finance",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(selectTemplate).mockReturnValue("interactive-calculator");
});

describe("InteractiveLabOutputSchema", () => {
  it("parseia output válido", () => {
    expect(() => InteractiveLabOutputSchema.parse(validOutput)).not.toThrow();
  });

  it("rejeita output sem config", () => {
    const { config: _c, ...noConfig } = validOutput;
    expect(InteractiveLabOutputSchema.safeParse(noConfig).success).toBe(false);
  });

  it("rejeita output sem templateId", () => {
    const { templateId: _t, ...noTemplate } = validOutput;
    expect(InteractiveLabOutputSchema.safeParse(noTemplate).success).toBe(false);
  });

  it("rejeita title muito curto", () => {
    expect(InteractiveLabOutputSchema.safeParse({ ...validOutput, title: "Hi" }).success).toBe(
      false
    );
  });

  it("rejeita scenario muito curto", () => {
    expect(
      InteractiveLabOutputSchema.safeParse({ ...validOutput, scenario: "Short" }).success
    ).toBe(false);
  });

  it("rejeita objectives com menos de 2 itens", () => {
    expect(
      InteractiveLabOutputSchema.safeParse({ ...validOutput, objectives: ["Só um objetivo aqui."] })
        .success
    ).toBe(false);
  });

  it("rejeita hints vazio", () => {
    expect(InteractiveLabOutputSchema.safeParse({ ...validOutput, hints: [] }).success).toBe(false);
  });

  it("rejeita campos extras — strict()", () => {
    expect(
      InteractiveLabOutputSchema.safeParse({ ...validOutput, flag: "FLAG{oops}" }).success
    ).toBe(false);
  });

  it("não tem campo flag — LAB-04", () => {
    const schema = InteractiveLabOutputSchema;
    const fields = Object.keys(schema.shape);
    expect(fields).not.toContain("flag");
  });
});

describe("generateInteractiveLab", () => {
  it("usa templateId de selectTemplate — RULE P2", async () => {
    vi.mocked(selectTemplate).mockReturnValue("interactive-calculator");
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(validOutput);

    const result = await generateInteractiveLab(ctxBase);
    expect(result.templateId).toBe("interactive-calculator");
    expect(selectTemplate).toHaveBeenCalledWith({
      labVariant: "INTERACTIVE",
      domain: ctxBase.domainHint,
    });
  });

  it("valida config contra o configSchema do template", async () => {
    vi.mocked(selectTemplate).mockReturnValue("interactive-calculator");
    const badConfigOutput = {
      ...validOutput,
      config: { language: "typescript", files: {}, instructions: "test" },
    };
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(badConfigOutput);

    await expect(generateInteractiveLab(ctxBase)).rejects.toThrow(
      /config failed template configSchema/
    );
  });

  it("retorna output com templateId quando config é válida", async () => {
    vi.mocked(selectTemplate).mockReturnValue("interactive-calculator");
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(validOutput);

    const result = await generateInteractiveLab(ctxBase);
    expect(result.config).toEqual(validConfig);
    expect(result.templateId).toBe("interactive-calculator");
  });

  it("passa specName=lab-interactive", async () => {
    vi.mocked(selectTemplate).mockReturnValue("interactive-calculator");
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(validOutput);

    await generateInteractiveLab(ctxBase);

    const call = vi.mocked(callAnthropicJson).mock.calls[0][0];
    expect(call.specName).toBe("lab-interactive");
    expect(call.model).toBe("claude-sonnet-4-6");
  });

  it("lança erro quando template não existe no registry", async () => {
    vi.mocked(selectTemplate).mockReturnValue("nonexistent-template");
    await expect(generateInteractiveLab(ctxBase)).rejects.toThrow(/template not found/);
  });

  it("propaga erro do callAnthropicJson", async () => {
    vi.mocked(selectTemplate).mockReturnValue("interactive-calculator");
    vi.mocked(callAnthropicJson).mockRejectedValueOnce(new Error("API error"));

    await expect(generateInteractiveLab(ctxBase)).rejects.toThrow("API error");
  });

  it("funciona com template code-lab para domínio programming", async () => {
    vi.mocked(selectTemplate).mockReturnValue("code-lab");
    const codeLabOutput = {
      ...validOutput,
      templateId: "code-lab",
      config: {
        language: "python",
        files: { "main.py": "print('hello')" },
        instructions: "Write a function that prints hello.",
      },
    };
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(codeLabOutput);

    const result = await generateInteractiveLab({ ...ctxBase, domainHint: "programming" });
    expect(result.templateId).toBe("code-lab");
  });
});
