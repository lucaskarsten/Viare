// RULE: AG-01, AG-02, CS-01, LAB-01, SH-01, FK-01 — per-lesson gate: only READY lessons are consumable
export type ConsumeSurface =
  | "progress_write"
  | "lab_submit"
  | "quiz_attempt"
  | "reflection"
  | "share"
  | "fork";

export type LessonGateInput = {
  lessonGenerationStatus: "PENDING" | "GENERATING" | "DONE" | "READY" | "FAILED";
};

export function canConsume(lesson: LessonGateInput): boolean {
  return lesson.lessonGenerationStatus === "READY";
}
