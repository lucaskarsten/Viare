import { describe, it, expect } from "vitest";
import { calculateAge, requiresAgeConfirmation, isAgeConfirmed } from "@/lib/access-control";

describe("calculateAge", () => {
  it("returns 18 for exactly 18 years ago today", () => {
    const now = new Date("2026-04-20");
    const birthDate = new Date("2008-04-20");
    expect(calculateAge(birthDate, now)).toBe(18);
  });

  it("returns 17 for just under 18 years", () => {
    const now = new Date("2026-04-20");
    const birthDate = new Date("2008-04-21");
    expect(calculateAge(birthDate, now)).toBe(17);
  });

  it("returns 50 for 50 years ago", () => {
    const now = new Date("2026-04-20");
    const birthDate = new Date("1976-04-20");
    expect(calculateAge(birthDate, now)).toBe(50);
  });

  it("handles leap-year birthday (Feb 29 2008 → Feb 28 2026 = 18 by ms diff)", () => {
    // 6574 days → ageDate UTC year 1988 → 1988-1970 = 18
    const now = new Date("2026-02-28T00:00:00.000Z");
    const birthDate = new Date("2008-02-29T00:00:00.000Z");
    expect(calculateAge(birthDate, now)).toBe(18);
  });
});

describe("requiresAgeConfirmation", () => {
  it("returns false for GENERAL course regardless of user", () => {
    expect(requiresAgeConfirmation(null, { maturityRating: "GENERAL" })).toBe(false);
    expect(requiresAgeConfirmation({ ageConfirmedAt: null }, { maturityRating: "GENERAL" })).toBe(
      false
    );
  });

  it("returns false for MATURE course when user has ageConfirmedAt", () => {
    expect(
      requiresAgeConfirmation(
        { ageConfirmedAt: new Date("2025-01-01") },
        { maturityRating: "MATURE" }
      )
    ).toBe(false);
  });

  it("returns true for MATURE course when user has no ageConfirmedAt", () => {
    expect(requiresAgeConfirmation({ ageConfirmedAt: null }, { maturityRating: "MATURE" })).toBe(
      true
    );
  });

  it("returns true for MATURE course when user is null (guest)", () => {
    expect(requiresAgeConfirmation(null, { maturityRating: "MATURE" })).toBe(true);
  });
});

describe("isAgeConfirmed", () => {
  it("returns false for null user", () => {
    expect(isAgeConfirmed(null)).toBe(false);
  });

  it("returns false for user without ageConfirmedAt", () => {
    expect(isAgeConfirmed({ ageConfirmedAt: null })).toBe(false);
  });

  it("returns true for user with ageConfirmedAt", () => {
    expect(isAgeConfirmed({ ageConfirmedAt: new Date("2025-06-01") })).toBe(true);
  });
});
