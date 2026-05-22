import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial", timeout: 60_000 });

const DEFAULT_PAUSE_MS = Number(process.env.DEMO_PAUSE_MS ?? "1200");
const DEFAULT_STATION = process.env.DEMO_DASHBOARD_STATION?.trim() || "CNC-001";
const SCREENSHOT_PATH = path.join(
  "tmp",
  "recordings",
  "raw",
  `03-dashboard-handoff-${DEFAULT_STATION.toLowerCase()}.png`,
);

function getPauseMs() {
  return Number.isFinite(DEFAULT_PAUSE_MS) && DEFAULT_PAUSE_MS >= 0
    ? DEFAULT_PAUSE_MS
    : 1200;
}

async function openFirstActionsMenu(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /^Actions$/ }).first().click();
}

test.describe("Product demo - dashboard handoff", () => {
  test("open dashboard work order and handoff flows and capture screenshot 3", async ({ page }) => {
    const pauseMs = getPauseMs();

    await test.step("open dashboard station wall", async () => {
      await page.goto("/dashboard");
      await expect(page.getByRole("tab", { name: /stations/i })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("heading", { name: new RegExp(DEFAULT_STATION, "i") })).toBeVisible();
      await expect(page.getByText(/work order/i).first()).toBeVisible();
      await page.waitForTimeout(pauseMs);
    });

    await test.step("show add work order entry state", async () => {
      await openFirstActionsMenu(page);
      await expect(page.getByRole("menuitem", { name: /add work order/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /new handoff/i })).toBeVisible();
      await page.getByRole("menuitem", { name: /add work order/i }).click();
      await expect(page.getByRole("heading", { name: /add work order/i })).toBeVisible();
      await expect(page.getByPlaceholder(/enter your work order number/i)).toBeVisible();
      await expect(page.getByText(/^assign to station$/i)).toBeVisible();
      await expect(page.getByPlaceholder(/e\.g\. pn-12345/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /create work order/i })).toBeVisible();
      await page.waitForTimeout(pauseMs);
      await page.getByRole("button", { name: /^close$/i }).click();
    });

    await test.step("show new handoff entry state", async () => {
      await openFirstActionsMenu(page);
      await page.getByRole("menuitem", { name: /new handoff/i }).click();
      await expect(page.getByRole("heading", { name: /end of shift handoff/i })).toBeVisible();
      await expect(page.getByText(/^select station$/i)).toBeVisible();
      await expect(page.getByPlaceholder(/enter work order number/i)).toBeVisible();
      await expect(page.getByText(/^select current state$/i)).toBeVisible();
      await expect(page.getByPlaceholder(/enter part number/i)).toBeVisible();
      await expect(page.getByPlaceholder(/your name/i)).toBeVisible();
      await page.waitForTimeout(pauseMs);
    });

    await test.step("capture screenshot 3", async () => {
      await mkdir(path.dirname(SCREENSHOT_PATH), { recursive: true });
      await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
      await page.waitForTimeout(pauseMs);
    });
  });
});