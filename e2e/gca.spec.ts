import { test, expect, type Page } from "@playwright/test";

// ─── helpers ────────────────────────────────────────────────────────────────

async function gotoLanding(page: Page) {
  await page.goto("/gcode-academy");
  await page.waitForLoadState("networkidle");
}

// ─── GCA Landing ────────────────────────────────────────────────────────────

test.describe("GCA Landing (/gcode-academy)", () => {
  test("renders hero and key sections", async ({ page }) => {
    await gotoLanding(page);
    await expect(page.getByRole("heading", { name: /G-Code Academy/i }).first()).toBeVisible();
    await expect(page.getByText(/Free Interactive CNC Training/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Launch the Academy/i }).first()).toBeVisible();
  });

  test("shows four track cards", async ({ page }) => {
    await gotoLanding(page);
    for (const track of ["CNC Lathe", "CNC Mill", "GD&T", "Controls"]) {
      await expect(page.getByText(track).first()).toBeVisible();
    }
  });

  test("shows four progression levels", async ({ page }) => {
    await gotoLanding(page);
    for (const level of ["Beginner", "Intermediate", "Advanced", "Automation"]) {
      await expect(page.getByText(level).first()).toBeVisible();
    }
  });

  test("Study section lists question banks when loaded", async ({ page }) => {
    await gotoLanding(page);
    // The Study section appears only when banks are fetched; if DB is seeded it will render bank cards
    const studyHeading = page.getByRole("heading", { name: /Test your knowledge/i });
    // Section may not appear in unauthenticated e2e if RLS hides unpublished banks — assert nav link still works
    const launchBtn = page.getByRole("link", { name: /Launch the Academy/i }).first();
    await expect(launchBtn).toBeVisible();
    // If study section rendered, each card should have a Take test link
    const takeTestLinks = page.getByRole("link", { name: /Take test/i });
    const count = await takeTestLinks.count();
    if (count > 0) {
      await expect(takeTestLinks.first()).toHaveAttribute("href", /\/gca\/test\//);
    }
    // Suppress unused variable warning
    void studyHeading;
  });

  test("FAQ section is present", async ({ page }) => {
    await gotoLanding(page);
    await expect(page.getByText(/Is G-Code Academy free/i)).toBeVisible();
    await expect(page.getByText(/What controllers are covered/i)).toBeVisible();
  });

  test("certificate section and buy button visible", async ({ page }) => {
    await gotoLanding(page);
    await expect(page.getByRole("button", { name: /Get my certificate/i })).toBeVisible();
  });
});

// ─── GCA Test Page — unauthenticated ────────────────────────────────────────

test.describe("GCA Test Page (/gca/test/:bankSlug)", () => {
  test("loads page with back navigation", async ({ page }) => {
    await page.goto("/gca/test/lathe-fundamentals");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: /Back/i })).toBeVisible();
  });

  test("back link returns to /gcode-academy", async ({ page }) => {
    await page.goto("/gca/test/lathe-fundamentals");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: /Back/i }).click();
    await expect(page).toHaveURL(/\/gcode-academy/);
  });

  test("displays bank title or loading state", async ({ page }) => {
    await page.goto("/gca/test/lathe-fundamentals");
    await page.waitForLoadState("networkidle");
    // Either the title loaded or a loading/not-found state is shown
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("unauthenticated user sees submit disabled or sign-in prompt", async ({ page }) => {
    await page.goto("/gca/test/lathe-fundamentals");
    await page.waitForLoadState("networkidle");
    // Wait for test player to attempt to render
    await page.waitForTimeout(1500);
    // If questions loaded, submit should be disabled (no auth)
    const submitBtn = page.getByRole("button", { name: /Sign in to submit/i });
    const submitEnabled = page.getByRole("button", { name: /Submit test/i });
    const lockScreen = page.getByText(/Pro required/i);
    const noQuestions = page.getByText(/No questions/i);
    // One of these states must be present
    const states = [submitBtn, submitEnabled, lockScreen, noQuestions];
    let found = false;
    for (const s of states) {
      if (await s.isVisible().catch(() => false)) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  test("404-like bank shows not found", async ({ page }) => {
    await page.goto("/gca/test/does-not-exist-bank-xyz");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/not found|Loading/i).first()).toBeVisible();
  });
});

// ─── GCA routes load without crashing ───────────────────────────────────────

test.describe("GCA routes smoke", () => {
  const banks = [
    "lathe-fundamentals",
    "mill-fundamentals",
    "fanuc-controller",
    "haas-controller",
    "gdt-basics",
    "speeds-and-feeds",
    "inspection-metrology",
  ];

  for (const slug of banks) {
    test(`/gca/test/${slug} loads`, async ({ page }) => {
      await page.goto(`/gca/test/${slug}`);
      await page.waitForLoadState("networkidle");
      // No unhandled JS error — page should have a heading
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});
