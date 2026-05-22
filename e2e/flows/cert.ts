import { type Page, expect } from "@playwright/test";

/**
 * Shared certificate-flow helpers for e2e specs.
 * Keep these UI selectors in one place so spec updates don't ripple.
 */

export async function visitVerifyPage(page: Page, certId: string) {
  await page.goto(`/verify/${certId}`);
  await expect(
    page.getByRole("heading", { name: /certificate verified/i }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/^valid$/i)).toBeVisible({ timeout: 10_000 });
}

export async function downloadCertificatePdf(page: Page) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /download pdf/i }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  return { download, path };
}

export async function loginAsOperator(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 15_000 });
}
