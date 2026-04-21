import { describe, it, expect } from "vitest";
import { canConsume } from "./lesson-gate";

describe("canConsume", () => {
  it("returns false for PENDING", () => {
    expect(canConsume({ lessonGenerationStatus: "PENDING" })).toBe(false);
  });

  it("returns false for GENERATING", () => {
    expect(canConsume({ lessonGenerationStatus: "GENERATING" })).toBe(false);
  });

  it("returns false for DONE", () => {
    expect(canConsume({ lessonGenerationStatus: "DONE" })).toBe(false);
  });

  it("returns true for READY", () => {
    expect(canConsume({ lessonGenerationStatus: "READY" })).toBe(true);
  });

  it("returns false for FAILED", () => {
    expect(canConsume({ lessonGenerationStatus: "FAILED" })).toBe(false);
  });
});
