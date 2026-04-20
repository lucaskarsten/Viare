import { describe, it, expect } from "vitest";
import { sm2, type SM2Card } from "@/lib/sm2";

const BASE: SM2Card = { easeFactor: 2.5, interval: 1, repetitions: 0 };

describe("sm2", () => {
  it("rating 0 (again) resets repetitions and interval", () => {
    const result = sm2({ easeFactor: 2.5, interval: 10, repetitions: 5 }, 0);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBe(2.5);
  });

  it("rating 1 (hard) increments repetitions (quality=3 is not a reset)", () => {
    const result = sm2(BASE, 1);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("rating 2 (good) on first repetition → interval 1, repetitions 1", () => {
    const result = sm2(BASE, 2);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("rating 2 on second repetition → interval 6", () => {
    const result = sm2({ ...BASE, repetitions: 1 }, 2);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it("rating 2 on third repetition → interval = round(prev * easeFactor)", () => {
    const result = sm2({ easeFactor: 2.5, interval: 6, repetitions: 2 }, 2);
    expect(result.interval).toBe(Math.round(6 * 2.5));
    expect(result.repetitions).toBe(3);
  });

  it("rating 3 (easy) increases easeFactor", () => {
    const result = sm2(BASE, 3);
    expect(result.easeFactor).toBeCloseTo(2.6, 5);
  });

  it("rating 2 (good) keeps easeFactor stable", () => {
    const result = sm2(BASE, 2);
    expect(result.easeFactor).toBeCloseTo(2.5, 5);
  });

  it("easeFactor never falls below 1.3", () => {
    const result = sm2({ easeFactor: 1.3, interval: 1, repetitions: 5 }, 1);
    // rating 1 → quality 3 → q >= 3, updates easeFactor
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("dueAt is in the future", () => {
    const before = Date.now();
    const result = sm2(BASE, 2);
    expect(result.dueAt.getTime()).toBeGreaterThan(before);
  });

  it("dueAt reflects interval in days", () => {
    const before = Date.now();
    const result = sm2({ easeFactor: 2.5, interval: 6, repetitions: 1 }, 2);
    const expectedDue = before + result.interval * 24 * 60 * 60 * 1000;
    expect(result.dueAt.getTime()).toBeCloseTo(expectedDue, -2);
  });
});
