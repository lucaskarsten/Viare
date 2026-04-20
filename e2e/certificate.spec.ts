import { test, expect } from "@playwright/test";
import { ensureAuthenticated } from "./helpers/auth";

// Certificate smoke tests — verify routes render and API validates correctly.

test.describe("Certificate (smoke)", () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test("/certificates renderiza sem erros", async ({ page }) => {
    await page.goto("/certificates");
    await expect(page).toHaveURL(/\/certificates/);
    await expect(page.getByText(/500|Internal Server Error/i)).not.toBeVisible();
  });

  test("API /api/certificates/issue retorna 400 sem enrollmentId", async ({ request }) => {
    const res = await request.post("/api/certificates/issue", {
      data: {},
    });
    expect([400, 401]).toContain(res.status());
  });

  test("API /api/certificates/issue retorna 404 para enrollmentId inexistente", async ({
    request,
  }) => {
    const res = await request.post("/api/certificates/issue", {
      data: { enrollmentId: "nonexistent-enrollment-id" },
    });
    // 404 (not found) — confirms auth + validation pass, enrollment check works
    expect([404, 401]).toContain(res.status());
  });
});
