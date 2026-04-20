import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prompts/specs/lab-ctf", () => ({
  generateCtfLab: vi.fn(),
}));

vi.mock("@/lib/prompts/specs/lab-interactive", () => ({
  generateInteractiveLab: vi.fn(),
}));

vi.mock("@/lib/content-safety", () => ({
  classifyGeneratedContent: vi.fn(),
}));

vi.mock("@/lib/labs/templates/registry", () => ({
  getTemplate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    lab: {
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

import { generateAndSaveLab } from "@/lib/labs/generator";
import { generateCtfLab } from "@/lib/prompts/specs/lab-ctf";
import { generateInteractiveLab } from "@/lib/prompts/specs/lab-interactive";
import { classifyGeneratedContent } from "@/lib/content-safety";
import { getTemplate } from "@/lib/labs/templates/registry";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const BASE_CTX = {
  language: "en" as const,
  topic: "Python basics",
  moduleTitle: "Module 1",
  lessonTitle: "Lesson 1",
  lessonId: "lesson-abc",
  domainHint: "programming",
};

const CTF_OUTPUT = {
  title: "Capture the Flag",
  description: "A CTF challenge",
  scenario: "## Task\n\nRun the script and find the flag.\n\nFollow these steps carefully.",
  objectives: ["You ran the script", "You captured the flag"],
  hints: [
    { text: "Try running with python3", cost: 10 },
    { text: "Look at the output carefully", cost: 5 },
  ],
  flag: "FLAG{python-basics-win}",
};

const INTERACTIVE_OUTPUT = {
  title: "Interactive Calculator Lab",
  description: "Explore formula relationships",
  scenario:
    "## Task\n\nUse the sliders to explore how variables affect the output.\n\nObserve the results.",
  objectives: ["You manipulated the sliders", "You observed the formula output"],
  hints: [{ text: "Try moving the first slider", cost: 10 }],
  templateId: "interactive-calculator",
  config: {
    variables: [{ name: "a", label: "Variable A", min: 0, max: 10, step: 1, default: 5 }],
    formula: "a * 2",
    resultLabel: "Result",
    instructions: "Adjust the slider",
  },
};

describe("generateAndSaveLab — CTF", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates CTF lab row with non-null flagHash and type=CTF", async () => {
    vi.mocked(generateCtfLab).mockResolvedValue(CTF_OUTPUT);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "clean" });
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed_flag" as never);
    vi.mocked(db.lab.create).mockResolvedValue({ id: "lab-1" } as never);

    const result = await generateAndSaveLab({ ...BASE_CTX, labVariant: "CTF" });

    expect(result).toEqual({ labId: "lab-1", labType: "CTF" });

    expect(bcrypt.hash).toHaveBeenCalledWith("FLAG{python-basics-win}", 10);

    const createCall = vi.mocked(db.lab.create).mock.calls[0][0];
    expect(createCall.data.type).toBe("CTF");
    expect(createCall.data.flagHash).toBe("hashed_flag");
    expect(createCall.data.config).toBeUndefined();
    expect(createCall.data.lessonId).toBe("lesson-abc");
  });

  it("throws LAB_CHECK_VIOLATION when content is blocked", async () => {
    vi.mocked(generateCtfLab).mockResolvedValue(CTF_OUTPUT);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "blocked" });

    await expect(generateAndSaveLab({ ...BASE_CTX, labVariant: "CTF" })).rejects.toThrow(
      "[LAB_CHECK_VIOLATION]"
    );

    expect(db.lab.create).not.toHaveBeenCalled();
  });

  it("passes safety text that includes scenario, objectives, and hint texts", async () => {
    vi.mocked(generateCtfLab).mockResolvedValue(CTF_OUTPUT);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "clean" });
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed_flag" as never);
    vi.mocked(db.lab.create).mockResolvedValue({ id: "lab-2" } as never);

    await generateAndSaveLab({ ...BASE_CTX, labVariant: "CTF" });

    const safetyArg = vi.mocked(classifyGeneratedContent).mock.calls[0][0];
    expect(safetyArg).toContain(CTF_OUTPUT.scenario);
    expect(safetyArg).toContain(CTF_OUTPUT.objectives[0]);
    expect(safetyArg).toContain(CTF_OUTPUT.hints[0].text);
  });
});

describe("generateAndSaveLab — INTERACTIVE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates INTERACTIVE lab row with flagHash=null, templateId set, config valid", async () => {
    vi.mocked(generateInteractiveLab).mockResolvedValue(INTERACTIVE_OUTPUT);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "clean" });
    vi.mocked(getTemplate).mockReturnValue({ version: 1 } as never);
    vi.mocked(db.lab.create).mockResolvedValue({ id: "lab-3" } as never);

    const result = await generateAndSaveLab({ ...BASE_CTX, labVariant: "INTERACTIVE" });

    expect(result).toEqual({ labId: "lab-3", labType: "INTERACTIVE" });

    const createCall = vi.mocked(db.lab.create).mock.calls[0][0];
    expect(createCall.data.type).toBe("INTERACTIVE");
    expect(createCall.data.flagHash).toBeNull();
    expect(createCall.data.templateId).toBe("interactive-calculator");
    expect(createCall.data.config).toEqual(INTERACTIVE_OUTPUT.config);
    expect(createCall.data.templateVersion).toBe(1);
  });

  it("throws LAB_CHECK_VIOLATION when content is blocked", async () => {
    vi.mocked(generateInteractiveLab).mockResolvedValue(INTERACTIVE_OUTPUT);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "blocked" });

    await expect(generateAndSaveLab({ ...BASE_CTX, labVariant: "INTERACTIVE" })).rejects.toThrow(
      "[LAB_CHECK_VIOLATION]"
    );

    expect(db.lab.create).not.toHaveBeenCalled();
  });

  it("does not call bcrypt for INTERACTIVE labs", async () => {
    vi.mocked(generateInteractiveLab).mockResolvedValue(INTERACTIVE_OUTPUT);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "clean" });
    vi.mocked(getTemplate).mockReturnValue({ version: 2 } as never);
    vi.mocked(db.lab.create).mockResolvedValue({ id: "lab-4" } as never);

    await generateAndSaveLab({ ...BASE_CTX, labVariant: "INTERACTIVE" });

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it("uses templateVersion=1 as fallback when template not found in registry", async () => {
    vi.mocked(generateInteractiveLab).mockResolvedValue(INTERACTIVE_OUTPUT);
    vi.mocked(classifyGeneratedContent).mockReturnValue({ verdict: "clean" });
    vi.mocked(getTemplate).mockReturnValue(null);
    vi.mocked(db.lab.create).mockResolvedValue({ id: "lab-5" } as never);

    await generateAndSaveLab({ ...BASE_CTX, labVariant: "INTERACTIVE" });

    const createCall = vi.mocked(db.lab.create).mock.calls[0][0];
    expect(createCall.data.templateVersion).toBe(1);
  });
});
