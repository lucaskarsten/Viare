import { describe, it, expect } from "vitest";
import { getTemplate, listTemplates, CtfFlagSchema } from "@/lib/labs/templates/registry";

describe("getTemplate", () => {
  it("retorna o template code-lab válido", () => {
    const t = getTemplate("code-lab");
    expect(t).not.toBeNull();
    expect(t?.id).toBe("code-lab");
    expect(t?.type).toBe("INTERACTIVE");
    expect(typeof t?.component).toBe("function");
  });

  it("retorna interactive-calculator válido", () => {
    const t = getTemplate("interactive-calculator");
    expect(t).not.toBeNull();
    expect(t?.id).toBe("interactive-calculator");
  });

  it("retorna interactive-chart válido", () => {
    const t = getTemplate("interactive-chart");
    expect(t).not.toBeNull();
    expect(t?.id).toBe("interactive-chart");
  });

  it("retorna null para template desconhecido", () => {
    expect(getTemplate("unknown")).toBeNull();
    expect(getTemplate("")).toBeNull();
  });
});

describe("listTemplates", () => {
  it("retorna todos os 6 templates V1+E", () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(6);
    const ids = templates.map((t) => t.id);
    expect(ids).toContain("code-lab");
    expect(ids).toContain("interactive-calculator");
    expect(ids).toContain("interactive-chart");
    expect(ids).toContain("interactive-timeline");
    expect(ids).toContain("interactive-map");
    expect(ids).toContain("interactive-piano");
  });
});

describe("configSchema — code-lab", () => {
  const schema = getTemplate("code-lab")!.configSchema;

  it("parseia config válida", () => {
    const result = schema.safeParse({
      language: "typescript",
      files: { "index.ts": "console.log('hello')" },
      instructions: "Escreva uma função",
    });
    expect(result.success).toBe(true);
  });

  it("parseia config válida com testCode", () => {
    const result = schema.safeParse({
      language: "python",
      files: { "main.py": "print('hello')" },
      testCode: "assert True",
      instructions: "Teste aqui",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita language inválida", () => {
    const result = schema.safeParse({
      language: "java",
      files: {},
      instructions: "x",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita campos desconhecidos — LAB-05", () => {
    const result = schema.safeParse({
      language: "javascript",
      files: {},
      instructions: "x",
      extraField: "should fail",
    });
    expect(result.success).toBe(false);
  });
});

describe("configSchema — interactive-calculator", () => {
  const schema = getTemplate("interactive-calculator")!.configSchema;

  const validCalc = {
    variables: [{ name: "rate", label: "Taxa (%)", min: 0, max: 100, step: 0.5, default: 10 }],
    formula: "rate / 100",
    resultLabel: "Taxa decimal",
    instructions: "Ajuste a taxa",
  };

  it("parseia config válida", () => {
    expect(schema.safeParse(validCalc).success).toBe(true);
  });

  it("rejeita variáveis com step <= 0", () => {
    const bad = {
      ...validCalc,
      variables: [{ name: "x", label: "X", min: 0, max: 10, step: 0, default: 5 }],
    };
    expect(schema.safeParse(bad).success).toBe(false);
  });

  it("rejeita lista de variáveis vazia", () => {
    expect(schema.safeParse({ ...validCalc, variables: [] }).success).toBe(false);
  });

  it("rejeita campos desconhecidos — LAB-05", () => {
    expect(schema.safeParse({ ...validCalc, extra: true }).success).toBe(false);
  });
});

describe("configSchema — interactive-chart", () => {
  const schema = getTemplate("interactive-chart")!.configSchema;

  const validChart = {
    chartType: "bar" as const,
    datasets: [
      {
        label: "Vendas",
        data: [
          { x: "Jan", y: 100 },
          { x: "Feb", y: 200 },
        ],
      },
    ],
    instructions: "Observe os dados",
  };

  it("parseia config válida", () => {
    expect(schema.safeParse(validChart).success).toBe(true);
  });

  it("parseia com interactiveAxes explícito", () => {
    expect(schema.safeParse({ ...validChart, interactiveAxes: true }).success).toBe(true);
  });

  it("rejeita chartType inválido", () => {
    expect(schema.safeParse({ ...validChart, chartType: "scatter" }).success).toBe(false);
  });

  it("rejeita datasets vazio", () => {
    expect(schema.safeParse({ ...validChart, datasets: [] }).success).toBe(false);
  });

  it("rejeita campos desconhecidos — LAB-05", () => {
    expect(schema.safeParse({ ...validChart, extra: "x" }).success).toBe(false);
  });
});

describe("getTemplate — novos templates E", () => {
  it("retorna interactive-timeline válido", () => {
    const t = getTemplate("interactive-timeline");
    expect(t).not.toBeNull();
    expect(t?.id).toBe("interactive-timeline");
    expect(t?.type).toBe("INTERACTIVE");
    expect(typeof t?.component).toBe("function");
  });

  it("retorna interactive-map válido", () => {
    const t = getTemplate("interactive-map");
    expect(t).not.toBeNull();
    expect(t?.id).toBe("interactive-map");
    expect(t?.type).toBe("INTERACTIVE");
  });

  it("retorna interactive-piano válido", () => {
    const t = getTemplate("interactive-piano");
    expect(t).not.toBeNull();
    expect(t?.id).toBe("interactive-piano");
    expect(t?.type).toBe("INTERACTIVE");
  });
});

describe("configSchema — interactive-timeline", () => {
  const schema = getTemplate("interactive-timeline")!.configSchema;

  const validTimeline = {
    events: [
      { date: "1969-07-20", label: "Moon landing", description: "Apollo 11" },
      { date: "1957-10-04", label: "Sputnik launch" },
    ],
    instructions: "Explore the timeline",
  };

  it("parseia config válida", () => {
    expect(schema.safeParse(validTimeline).success).toBe(true);
  });

  it("parseia com orientation explícito", () => {
    expect(schema.safeParse({ ...validTimeline, orientation: "vertical" }).success).toBe(true);
  });

  it("rejeita events com menos de 2 itens", () => {
    expect(
      schema.safeParse({ ...validTimeline, events: [{ date: "2000", label: "X" }] }).success
    ).toBe(false);
  });

  it("rejeita orientation inválido", () => {
    expect(schema.safeParse({ ...validTimeline, orientation: "diagonal" }).success).toBe(false);
  });

  it("rejeita campos desconhecidos — LAB-05", () => {
    expect(schema.safeParse({ ...validTimeline, extra: true }).success).toBe(false);
  });
});

describe("configSchema — interactive-map", () => {
  const schema = getTemplate("interactive-map")!.configSchema;

  const validMap = {
    center: { lat: -15.79, lng: -47.88 },
    markers: [{ lat: -15.79, lng: -47.88, label: "Brasília", description: "Capital do Brasil" }],
    instructions: "Explore o mapa",
  };

  it("parseia config válida", () => {
    expect(schema.safeParse(validMap).success).toBe(true);
  });

  it("parseia com zoom explícito", () => {
    expect(schema.safeParse({ ...validMap, zoom: 10 }).success).toBe(true);
  });

  it("rejeita markers vazio", () => {
    expect(schema.safeParse({ ...validMap, markers: [] }).success).toBe(false);
  });

  it("rejeita zoom fora do range", () => {
    expect(schema.safeParse({ ...validMap, zoom: 0 }).success).toBe(false);
    expect(schema.safeParse({ ...validMap, zoom: 19 }).success).toBe(false);
  });

  it("rejeita campos desconhecidos — LAB-05", () => {
    expect(schema.safeParse({ ...validMap, extra: "x" }).success).toBe(false);
  });
});

describe("configSchema — interactive-piano", () => {
  const schema = getTemplate("interactive-piano")!.configSchema;

  const validPiano = {
    instructions: "Pratique as escalas",
  };

  it("parseia config mínima válida", () => {
    expect(schema.safeParse(validPiano).success).toBe(true);
  });

  it("parseia config completa", () => {
    expect(
      schema.safeParse({
        scale: "minor",
        rootNote: "A",
        octaves: 2,
        exerciseNotes: ["A4", "C5", "E5"],
        instructions: "Toque a escala de lá menor",
      }).success
    ).toBe(true);
  });

  it("rejeita octaves fora do range", () => {
    expect(schema.safeParse({ ...validPiano, octaves: 0 }).success).toBe(false);
    expect(schema.safeParse({ ...validPiano, octaves: 4 }).success).toBe(false);
  });

  it("rejeita scale inválido", () => {
    expect(schema.safeParse({ ...validPiano, scale: "blues" }).success).toBe(false);
  });

  it("rejeita rootNote inválido", () => {
    expect(schema.safeParse({ ...validPiano, rootNote: "H" }).success).toBe(false);
  });

  it("rejeita campos desconhecidos — LAB-05", () => {
    expect(schema.safeParse({ ...validPiano, extra: 1 }).success).toBe(false);
  });
});

describe("CtfFlagSchema — CA-B3", () => {
  it("aceita FLAG{test_123}", () => {
    expect(() => CtfFlagSchema.parse("FLAG{test_123}")).not.toThrow();
  });

  it("aceita FLAG{abc-def}", () => {
    expect(() => CtfFlagSchema.parse("FLAG{abc-def}")).not.toThrow();
  });

  it("aceita FLAG{a}", () => {
    expect(() => CtfFlagSchema.parse("FLAG{a}")).not.toThrow();
  });

  it("rejeita 'wrong'", () => {
    expect(() => CtfFlagSchema.parse("wrong")).toThrow();
  });

  it("rejeita FLAG{} (vazio)", () => {
    expect(() => CtfFlagSchema.parse("FLAG{}")).toThrow();
  });

  it("rejeita FLAG{Upper} (maiúsculas)", () => {
    expect(() => CtfFlagSchema.parse("FLAG{Upper}")).toThrow();
  });

  it("rejeita flag sem chaves", () => {
    expect(() => CtfFlagSchema.parse("FLAGtest")).toThrow();
  });
});
