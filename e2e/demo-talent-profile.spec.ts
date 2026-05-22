import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial", timeout: 60_000 });

const DEFAULT_PAUSE_MS = Number(process.env.DEMO_PAUSE_MS ?? "1200");
const DEFAULT_USERNAME = process.env.DEMO_TALENT_USERNAME?.trim() || "zachgoodbody";
const SCREENSHOT_PATH = path.join(
  "tmp",
  "recordings",
  "raw",
  `02-talent-profile-${DEFAULT_USERNAME}.png`,
);

function getPauseMs() {
  return Number.isFinite(DEFAULT_PAUSE_MS) && DEFAULT_PAUSE_MS >= 0
    ? DEFAULT_PAUSE_MS
    : 1200;
}

test.describe("Product demo - talent profile", () => {
  test("open public talent profile and capture screenshot 2", async ({ page }) => {
    const pauseMs = getPauseMs();

    await test.step("open public talent profile", async () => {
      await page.goto(`/talent/${DEFAULT_USERNAME}`);
      await expect(
        page.getByRole("heading", { name: /zach goodbody/i }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/@zachgoodbody/i)).toBeVisible();
      await page.waitForTimeout(pauseMs);
    });

    await test.step("show profile proof points", async () => {
      await expect(page.getByText(/jobline verified/i)).toBeVisible();
      await expect(page.getByText(/verified/i).first()).toBeVisible();
      await expect(page.getByRole("link", { name: /employers: contact via talent search/i })).toBeVisible();
      await page.waitForTimeout(pauseMs);
    });

    await test.step("capture screenshot 2", async () => {
      await mkdir(path.dirname(SCREENSHOT_PATH), { recursive: true });
      await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
      await page.waitForTimeout(pauseMs);
    });
  });
});