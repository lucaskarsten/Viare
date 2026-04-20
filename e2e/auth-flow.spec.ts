import { test, expect } from "@playwright/test";

// Dev server runs with SKIP_AUTH=true — all routes are auto-authenticated.
// These tests verify the auth layer and navigation work correctly in dev mode.

test.describe("Auth flow (dev mode: SKIP_AUTH=true)", () => {
  test("acessa /dashboard diretamente sem redirecionamento", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("página /login existe e mostra botões OAuth", async ({ page }) => {
    await page.goto("/login");
    // Login page has Google and GitHub OAuth buttons only (no credentials form)
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
  });

  test("/dashboard carrega com conteúdo visível", async ({ page }) => {
    await page.goto("/dashboard");
    // Page should load without a Next.js error page
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.getByText(/Internal Server Error/i)).not.toBeVisible();
  });

  test("navegar para /courses carrega o catálogo", async ({ page }) => {
    await page.goto("/courses");
    await expect(page).toHaveURL(/\/courses/);
    await expect(page.getByText(/Internal Server Error/i)).not.toBeVisible();
  });
});
