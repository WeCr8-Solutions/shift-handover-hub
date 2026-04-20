import { type Page, expect } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth");
  // Robust to copy changes — match by role
  const emailInput = page.getByLabel(/email/i).first();
  await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  await emailInput.fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 20_000,
  });
}

export async function logout(page: Page) {
  // Best-effort — open user menu and click sign out
  const menu = page.getByRole("button", { name: /account|user menu|profile/i }).first();
  if (await menu.isVisible().catch(() => false)) {
    await menu.click();
    const out = page.getByRole("menuitem", { name: /sign out|log out/i });
    if (await out.isVisible().catch(() => false)) {
      await out.click();
      await page.waitForURL(/\/auth|\/$/, { timeout: 10_000 }).catch(() => {});
      return;
    }
  }
  // Fallback — clear storage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function selectTeam(page: Page, teamName: string) {
  const selector = page.getByRole("button", { name: /select team|teams|all teams/i }).first();
  if (await selector.isVisible().catch(() => false)) {
    await selector.click();
    const opt = page.getByRole("option", { name: new RegExp(teamName, "i") });
    if (await opt.isVisible().catch(() => false)) await opt.click();
  }
}

export async function expectAuthenticated(page: Page) {
  await expect(page).not.toHaveURL(/\/auth/);
}
