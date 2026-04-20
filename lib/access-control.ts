import type { User, Course } from "@prisma/client";

// RULE: CONTENT-07 — age gate for mature content
export function requiresAgeConfirmation(
  user: Pick<User, "ageConfirmedAt"> | null,
  course: Pick<Course, "maturityRating">
): boolean {
  if (course.maturityRating !== "MATURE") return false;
  if (!user) return true;
  return !user.ageConfirmedAt;
}

export function isAgeConfirmed(user: Pick<User, "ageConfirmedAt"> | null): boolean {
  return Boolean(user?.ageConfirmedAt);
}

export function calculateAge(birthDate: Date, at: Date = new Date()): number {
  const diffMs = at.getTime() - birthDate.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
