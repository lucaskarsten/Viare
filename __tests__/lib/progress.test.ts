import { describe, it, expect } from "vitest";
import { forwardOnlyPercent } from "@/lib/progress";

describe("forwardOnlyPercent — RULE: PROG-01", () => {
  it("mantém valor atual quando candidato é menor", () => {
    expect(forwardOnlyPercent(50, 21)).toBe(50);
  });

  it("avança para candidato quando maior", () => {
    expect(forwardOnlyPercent(50, 80)).toBe(80);
  });

  it("avança de zero para candidato", () => {
    expect(forwardOnlyPercent(0, 50)).toBe(50);
  });

  it("mantém 100 quando candidato é menor", () => {
    expect(forwardOnlyPercent(100, 50)).toBe(100);
  });
});
