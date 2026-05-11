import { type Page, expect } from "@playwright/test";

/**
 * Logs the user in via the /auth Login tab.
 * Targets the form by its stable input IDs (`#login-email`, `#login-password`)
 * so it is immune to copy / Tabs / Sign-up form duplication issues.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });

  // Make sure we are on the Login tab (defaultValue="login" but be defensive).
  const loginTab = page.getByRole("tab", { name: /^login$/i });
  if (await loginTab.isVisible().catch(() => false)) {
    await loginTab.click().catch(() => {});
  }

  // Auth.tsx now uses a unified form with #email / #password (hidden #login-email
  // / #login-password are kept for backcompat only). Prefer the visible inputs.
  const emailInput = page.locator("#email").first();
  await emailInput.waitFor({ state: "visible", timeout: 20_000 });
  await emailInput.fill(email);
  await page.locator("#password").first().fill(password);

  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
      timeout: 30_000,
    }),
    page.getByRole("button", { name: /^sign in$/i }).click(),
  ]);
}

/**
 * Best-effort logout. Clears storage as a fallback so the next login starts
 * from a clean slate even if the menu interaction misses.
 */
export async function logout(page: Page) {
  try {
    const menu = page
      .getByRole("button", { name: /account|user menu|profile|avatar/i })
      .first();
    if (await menu.isVisible().catch(() => false)) {
      await menu.click();
      const out = page.getByRole("menuitem", { name: /sign out|log out/i });
      if (await out.isVisible().catch(() => false)) {
        await out.click();
        await page.waitForURL(/\/auth|\/$/, { timeout: 10_000 }).catch(() => {});
      }
    }
  } finally {
    await page.context().clearCookies().catch(() => {});
    await page
      .evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  }
}

export async function expectAuthenticated(page: Page) {
  await expect(page).not.toHaveURL(/\/auth/);
}
