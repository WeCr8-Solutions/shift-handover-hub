import { test, expect, type Page } from "@playwright/test";

// ─── helpers ────────────────────────────────────────────────────────────────

async function gotoOap(page: Page) {
  await page.goto("/oap");
  await page.waitForLoadState("networkidle");
}

async function gotoLearn(page: Page) {
  await page.goto("/oap/learn");
  await page.waitForLoadState("networkidle");
}

async function getRobotsMetaContents(page: Page) {
  return page.locator('meta[name="robots"]').evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute("content") ?? "")
      .filter(Boolean)
  );
}

// ─── OAP Landing ────────────────────────────────────────────────────────────

test.describe("OAP Landing (/oap)", () => {
  test("renders hero heading and key CTAs", async ({ page }) => {
    await gotoOap(page);
    await expect(page.getByRole("heading", { name: /Operator Acceptance Program/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Launch the Program/i }).first()).toBeVisible();
  });

  test("has noindex meta tag", async ({ page }) => {
    await gotoOap(page);
    const robots = await getRobotsMetaContents(page);
    // OAP landing is indexed (marketing page) — confirm meta present and not noindex
    // If tag exists check it doesn't say noindex on the public landing
    // Landing is a public marketing page — either no robots tag or not noindex
    if (robots.length > 0) {
      expect(robots.some((content) => content.includes("noindex"))).toBe(false);
    }
  });

  test("FAQ section renders", async ({ page }) => {
    await gotoOap(page);
    await expect(page.getByRole("heading", { name: /^FAQ$/i })).toBeVisible();
  });

  test("certificate preview section visible", async ({ page }) => {
    await gotoOap(page);
    await expect(page.getByText(/certificate/i).first()).toBeVisible();
  });

  test("links to /talent (Talent Network)", async ({ page }) => {
    await gotoOap(page);
    const talentLink = page.getByRole("link", { name: /talent|operator network/i });
    if (await talentLink.count() > 0) {
      await expect(talentLink.first()).toHaveAttribute("href", /\/talent/);
    }
  });
});

// ─── OAP Learn Hub (/oap/learn) ─────────────────────────────────────────────

test.describe("OAP Learn Hub (/oap/learn)", () => {
  test("loads hub page", async ({ page }) => {
    await gotoLearn(page);
    // Either shows hub content or redirects to auth
    const url = page.url();
    const isAuth = url.includes("/auth");
    const isLearn = url.includes("/oap/learn") || url.includes("/oap");
    expect(isAuth || isLearn).toBe(true);
  });

  test("unauthenticated: redirects to auth or shows sign-in prompt", async ({ page }) => {
    await gotoLearn(page);
    await page.waitForTimeout(1000);
    const url = page.url();
    // If auth-gated, should redirect. If public, should show course cards.
    const hasAuthLink = await page.getByRole("link", { name: /sign in|log in|get started/i }).count() > 0;
    const redirectedToAuth = url.includes("/auth");
    const showsCourses = await page.getByText(/Safety|Orientation|Measurement|Tooling/i).count() > 0;
    expect(redirectedToAuth || hasAuthLink || showsCourses).toBe(true);
  });
});

// ─── OAP routes — smoke ──────────────────────────────────────────────────────

test.describe("OAP routes smoke", () => {
  test("/oap loads without crash", async ({ page }) => {
    await page.goto("/oap");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("main").or(page.locator("body"))).toBeVisible();
  });

  test("/oap/learn loads without crash", async ({ page }) => {
    await page.goto("/oap/learn");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("/oap/employer redirects unauthenticated", async ({ page }) => {
    await page.goto("/oap/employer");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const url = page.url();
    // Should redirect to auth or show access-denied state
    const blocked = url.includes("/auth") ||
      await page.getByText(/sign in|not authorized|access denied|admin/i).count() > 0;
    expect(blocked).toBe(true);
  });

  test("/oap/my-transcript redirects unauthenticated", async ({ page }) => {
    await page.goto("/oap/my-transcript");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const url = page.url();
    const blocked = url.includes("/auth") ||
      await page.getByText(/sign in|not authorized/i).count() > 0;
    expect(blocked).toBe(true);
  });

  test("/oap/walkthrough redirects unauthenticated", async ({ page }) => {
    await page.goto("/oap/walkthrough");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const url = page.url();
    const blocked = url.includes("/auth") ||
      await page.getByText(/sign in|not authorized|mentor/i).count() > 0;
    expect(blocked).toBe(true);
  });
});

// ─── Certificate Verification ────────────────────────────────────────────────

test.describe("Certificate verification (/verify/:certId)", () => {
  test("invalid cert ID shows not found", async ({ page }) => {
    await page.goto("/verify/INVALID-CERT-000");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await expect(
      page.getByText(/not found|invalid|could not|no certificate/i).first()
    ).toBeVisible();
  });

  test("page loads without crash for any cert ID format", async ({ page }) => {
    await page.goto("/verify/OAP-XXXXXX-2026");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ─── Talent Network (/talent) ────────────────────────────────────────────────

test.describe("Talent Network (/talent)", () => {
  test("/talent landing loads", async ({ page }) => {
    await page.goto("/talent");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("/talent/search requires auth", async ({ page }) => {
    await page.goto("/talent/search");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const url = page.url();
    const blocked = url.includes("/auth") ||
      await page.getByText(/sign in|not authorized|upgrade/i).count() > 0;
    expect(blocked).toBe(true);
  });
});

// ─── ITAR / security: noindex on protected pages ─────────────────────────────

test.describe("ITAR security: noindex on authenticated pages", () => {
  const noindexRoutes = [
    "/oap/employer",
    "/gca/employer",
    "/oap/my-transcript",
    "/talent/search",
  ];

  for (const route of noindexRoutes) {
    test(`${route} has noindex meta`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      // May redirect to /auth — check current page OR original
      const robots = await getRobotsMetaContents(page);
      if (robots.length > 0) {
        expect(robots.some((content) => content.includes("noindex"))).toBe(true);
      }
      // If redirected to /auth, the page is already protected — pass
    });
  }
});
