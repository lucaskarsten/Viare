import { Page } from "@playwright/test";

// Dev server uses SKIP_AUTH=true — all routes are auto-authenticated as the dev preview user.
// This helper ensures a protected page is reachable before the test body runs.
export async function ensureAuthenticated(page: Page) {
  await page.goto("/dashboard");
  await page.waitForURL("/dashboard");
}
