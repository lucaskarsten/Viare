// RULE: PROG-01 — forward-only progress; progressPercent never decrements.
export function forwardOnlyPercent(current: number, candidate: number): number {
  return Math.max(current, candidate);
}
