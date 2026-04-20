import { describe, it, expect } from "vitest";

import { isPro } from "@/lib/subscription";

// NOTE: Pro gate is temporarily disabled (see lib/subscription.ts). Tests cover
// current behavior (any authenticated user treated as Pro). Quando o gate
// SUB-03 voltar, restaurar os testes originais que cobrem a matriz plan×status.
describe("isPro — Pro gate temporariamente desativado", () => {
  it("retorna false quando userId está vazio", async () => {
    expect(await isPro("")).toBe(false);
  });

  it("retorna true para qualquer userId não-vazio", async () => {
    expect(await isPro("user-1")).toBe(true);
    expect(await isPro("any-user")).toBe(true);
  });
});
