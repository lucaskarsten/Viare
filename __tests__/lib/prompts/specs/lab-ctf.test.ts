import { describe, it, expect, vi, beforeEach } from "vitest";
import { CtfLabOutputSchema } from "@/lib/prompts/specs/lab-ctf";

vi.mock("@/lib/prompts/runner", () => ({
  callAnthropicJson: vi.fn(),
}));

import { callAnthropicJson } from "@/lib/prompts/runner";
import { generateCtfLab } from "@/lib/prompts/specs/lab-ctf";

const validOutput = {
  title: "Capture the Hash",
  description: "Find and capture the hidden flag by decoding the base64 string.",
  scenario:
    "## Task\n\nYou have been given a base64-encoded string.\n\n1. Decode it using Python or the terminal.\n2. Capture the flag inside.\n\n```bash\necho 'RkxBR3toZWxsb193b3JsZH0=' | base64 -d\n```",
  objectives: [
    "You decoded the base64 string successfully",
    "You identified and captured the flag from the output",
  ],
  hints: [
    { text: "Try using the base64 command-line tool or Python's base64 module.", cost: 10 },
    { text: "In Python: import base64; base64.b64decode('...').decode()", cost: 5 },
  ],
  flag: "FLAG{hello_world}",
};

const ctxBase = {
  language: "en" as const,
  topic: "Python Fundamentals",
  moduleTitle: "Strings and Encoding",
  lessonTitle: "Base64 Encoding",
  domainHint: "programming",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CtfLabOutputSchema", () => {
  it("parseia output válido", () => {
    expect(() => CtfLabOutputSchema.parse(validOutput)).not.toThrow();
  });

  it("rejeita flag em maiúsculas", () => {
    expect(
      CtfLabOutputSchema.safeParse({ ...validOutput, flag: "FLAG{Hello_World}" }).success
    ).toBe(false);
  });

  it("rejeita flag sem prefixo FLAG{}", () => {
    expect(CtfLabOutputSchema.safeParse({ ...validOutput, flag: "hello_world" }).success).toBe(
      false
    );
  });

  it("rejeita flag com espaços", () => {
    expect(
      CtfLabOutputSchema.safeParse({ ...validOutput, flag: "FLAG{hello world}" }).success
    ).toBe(false);
  });

  it("rejeita flag vazia FLAG{}", () => {
    expect(CtfLabOutputSchema.safeParse({ ...validOutput, flag: "FLAG{}" }).success).toBe(false);
  });

  it("rejeita title muito curto", () => {
    expect(CtfLabOutputSchema.safeParse({ ...validOutput, title: "Hi" }).success).toBe(false);
  });

  it("rejeita scenario muito curto", () => {
    expect(CtfLabOutputSchema.safeParse({ ...validOutput, scenario: "Too short" }).success).toBe(
      false
    );
  });

  it("rejeita objectives com menos de 2 itens", () => {
    expect(
      CtfLabOutputSchema.safeParse({ ...validOutput, objectives: ["Only one objective here"] })
        .success
    ).toBe(false);
  });

  it("rejeita objectives com mais de 5 itens", () => {
    const tooMany = Array(6).fill("You completed this objective successfully");
    expect(CtfLabOutputSchema.safeParse({ ...validOutput, objectives: tooMany }).success).toBe(
      false
    );
  });

  it("rejeita hints vazio", () => {
    expect(CtfLabOutputSchema.safeParse({ ...validOutput, hints: [] }).success).toBe(false);
  });

  it("rejeita hint cost fora do range", () => {
    const badHint = [{ text: "This is a valid hint text.", cost: 100 }];
    expect(CtfLabOutputSchema.safeParse({ ...validOutput, hints: badHint }).success).toBe(false);
  });

  it("rejeita campos extras — strict()", () => {
    expect(CtfLabOutputSchema.safeParse({ ...validOutput, extraField: "oops" }).success).toBe(
      false
    );
  });
});

describe("generateCtfLab", () => {
  it("retorna output válido quando callAnthropicJson resolve", async () => {
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(validOutput);

    const result = await generateCtfLab(ctxBase);
    expect(result).toEqual(validOutput);
    expect(callAnthropicJson).toHaveBeenCalledOnce();
  });

  it("passa specName=lab-ctf e model=claude-sonnet-4-6", async () => {
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(validOutput);

    await generateCtfLab(ctxBase);

    const call = vi.mocked(callAnthropicJson).mock.calls[0][0];
    expect(call.specName).toBe("lab-ctf");
    expect(call.model).toBe("claude-sonnet-4-6");
  });

  it("inclui domainHint na userMessage", async () => {
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(validOutput);

    await generateCtfLab(ctxBase);

    const call = vi.mocked(callAnthropicJson).mock.calls[0][0];
    expect(call.userMessage).toContain("programming");
  });

  it("aceita tone opcional sem falhar", async () => {
    vi.mocked(callAnthropicJson).mockResolvedValueOnce(validOutput);

    await expect(generateCtfLab({ ...ctxBase, tone: "practical" })).resolves.toEqual(validOutput);
  });

  it("propaga erro do callAnthropicJson", async () => {
    vi.mocked(callAnthropicJson).mockRejectedValueOnce(new Error("API timeout"));

    await expect(generateCtfLab(ctxBase)).rejects.toThrow("API timeout");
  });
});
