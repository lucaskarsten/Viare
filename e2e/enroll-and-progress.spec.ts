import { test, expect } from "@playwright/test";
import { ensureAuthenticated } from "./helpers/auth";

// Smoke tests for the enroll + progress flow.
// Full integration requires a seeded course — these verify the pages render correctly.

test.describe("Enroll and progress (smoke)", () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test("/courses renderiza sem erros", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByText(/500|Internal Server Error/i)).not.toBeVisible();
  });

  test("/discover renderiza sem erros", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByText(/500|Internal Server Error/i)).not.toBeVisible();
  });

  test("API /api/courses/enroll retorna 400 sem courseId", async ({ request }) => {
    const res = await request.post("/api/courses/enroll", {
      data: {},
    });
    // 400 (invalid) or 401 (auth check in test env) — not a 500
    expect([400, 401]).toContain(res.status());
  });

  test("API /api/courses/progress retorna 400 sem lessonId", async ({ request }) => {
    const res = await request.post("/api/courses/progress", {
      data: {},
    });
    expect([400, 401]).toContain(res.status());
  });
});
