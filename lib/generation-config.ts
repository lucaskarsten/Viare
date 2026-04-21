// Maximum number of lessons that may generate concurrently per course.
// Must be consistent across: generate route (claim gate), sweep cron, and resume trigger.
export const LESSON_GENERATION_CAP = 4;
