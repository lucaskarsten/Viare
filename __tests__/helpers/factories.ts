export const mockSession = (overrides: Record<string, unknown> = {}) => ({
  user: { id: "user-1", role: "STUDENT", ...overrides },
});

export const mockCourse = (overrides: Record<string, unknown> = {}) => ({
  id: "course-1",
  title: "Test Course",
  status: "PUBLISHED",
  maturityRating: "GENERAL",
  ...overrides,
});

export const mockEnrollment = (overrides: Record<string, unknown> = {}) => ({
  id: "enrollment-1",
  userId: "user-1",
  courseId: "course-1",
  status: "IN_PROGRESS",
  progressPercent: 0,
  ...overrides,
});

export const mockLesson = (overrides: Record<string, unknown> = {}) => ({
  id: "lesson-1",
  type: "THEORY",
  content: null,
  module: { courseId: "course-1", course: { language: "pt" } },
  ...overrides,
});

export const mockLab = (overrides: Record<string, unknown> = {}) => ({
  id: "lab-1",
  title: "Test Lab",
  description: "Lab description",
  scenario: "You are a security researcher...",
  objectives: ["Find the flag"],
  difficulty: "EASY",
  hints: [{ cost: 10, text: null }],
  revealedHintIndexes: [],
  ...overrides,
});
