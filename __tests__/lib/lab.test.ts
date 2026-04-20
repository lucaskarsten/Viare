import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLabForUser, validateFlag } from "@/lib/lab";

vi.mock("@/lib/db", () => ({
  db: {
    lab: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const BASE_LAB = {
  id: "lab-1",
  title: "Test Lab",
  description: "Description",
  scenario: "Scenario text",
  objectives: ["obj1", "obj2"],
  difficulty: "EASY" as const,
  type: "CTF" as const,
  templateId: null,
  templateVersion: null,
  config: null,
  hints: [
    { text: "First hint", cost: 10 },
    { text: "Second hint", cost: 20 },
    { text: "Third hint", cost: 30 },
  ],
  hintReveals: [],
};

describe("getLabForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando lab não existe", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue(null);

    const result = await getLabForUser("nonexistent", "user-1");

    expect(result).toBeNull();
  });

  it("mascara hints não revelados (text: null) — LAB-01", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({ ...BASE_LAB, hintReveals: [] } as never);

    const result = await getLabForUser("lab-1", "user-1");

    expect(result?.hints[0].text).toBeNull();
    expect(result?.hints[1].text).toBeNull();
    expect(result?.hints[2].text).toBeNull();
  });

  it("exibe text apenas de hints revelados pelo userId", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({
      ...BASE_LAB,
      hintReveals: [{ hintIndex: 1 }],
    } as never);

    const result = await getLabForUser("lab-1", "user-1");

    expect(result?.hints[0].text).toBeNull();
    expect(result?.hints[1].text).toBe("Second hint");
    expect(result?.hints[2].text).toBeNull();
  });

  it("retorna revealedHintIndexes corretos", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({
      ...BASE_LAB,
      hintReveals: [{ hintIndex: 0 }, { hintIndex: 2 }],
    } as never);

    const result = await getLabForUser("lab-1", "user-1");

    expect(result?.revealedHintIndexes).toEqual([0, 2]);
  });

  it("não vaza flagHash em nenhum campo retornado — LAB-01", async () => {
    vi.mocked(db.lab.findUnique).mockResolvedValue({ ...BASE_LAB, hintReveals: [] } as never);

    const result = await getLabForUser("lab-1", "user-1");

    expect(result).not.toHaveProperty("flagHash");
    const json = JSON.stringify(result);
    expect(json).not.toContain("flagHash");
  });
});

describe("validateFlag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna true para flag correta", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await validateFlag("FLAG{abc}", "hash");

    expect(result).toBe(true);
  });

  it("retorna false para flag errada", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const result = await validateFlag("WRONG", "hash");

    expect(result).toBe(false);
  });

  it("trim() na flag antes de comparar", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await validateFlag("  FLAG{abc}  ", "hash");

    expect(vi.mocked(bcrypt.compare)).toHaveBeenCalledWith("FLAG{abc}", "hash");
  });

  it("retorna false quando flagHash é null — LAB-04 INTERACTIVE lab", async () => {
    const result = await validateFlag("FLAG{abc}", null);

    expect(result).toBe(false);
    expect(vi.mocked(bcrypt.compare)).not.toHaveBeenCalled();
  });
});
