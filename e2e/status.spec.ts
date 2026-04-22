import { test, expect } from "@playwright/test";

test.describe("Status surface", () => {
  test("/status renders public operational summary", async ({ page }) => {
    await page.goto("/status");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/JobLine AI System Status/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Operational visibility for web, API, and incident communications/i })).toBeVisible();
    await expect(page.getByText(/Operational visibility for web, API, and incident communications/i)).toBeVisible();
    await expect(page.getByText(/All monitored first-party services operational/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /View Health JSON/i })).toHaveAttribute("href", "/api/health");
  });

  test("/api/health returns the first-party health payload", async ({ page }) => {
    const response = await page.request.get("/api/health");

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);

    const payload = await response.json();
    expect(payload).toMatchObject({
      status: "ok",
      service: "jobline-ai",
      components: [
        { name: "Web Application", status: "operational" },
        { name: "API & Database", status: "operational" },
        { name: "Edge Functions", status: "operational" },
      ],
    });
  });
});