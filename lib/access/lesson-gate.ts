// RULE: AG-01, AG-02, CS-01, LAB-01, SH-01, FK-01 — default-deny on all write surfaces until course finalizes
export type ConsumeSurface =
  | "progress_write"
  | "lab_submit"
  | "quiz_attempt"
  | "reflection"
  | "share"
  | "fork";

export function canConsume(course: { finalizedAt: Date | null }): boolean {
  return course.finalizedAt !== null;
}
