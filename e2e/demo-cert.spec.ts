import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { downloadCertificatePdf, visitVerifyPage } from "./flows/cert";

test.describe.configure({ mode: "serial", timeout: 60_000 });

const DEFAULT_PAUSE_MS = Number(process.env.DEMO_PAUSE_MS ?? "1200");

function getPauseMs() {
  return Number.isFinite(DEFAULT_PAUSE_MS) && DEFAULT_PAUSE_MS >= 0
    ? DEFAULT_PAUSE_MS
    : 1200;
}

async function resolveDemoCertId() {
  const explicitCertId = process.env.DEMO_CERT_ID?.trim();
  if (explicitCertId) {
    return explicitCertId;
  }

  const fx = await seedFixture("cert_paid");
  return (fx as unknown as { certificate?: { id?: string } }).certificate?.id ?? fx.work_order.code;
}

test.describe("Product demo - certificate verification", () => {
  test("verify certificate and download PDF", async ({ page }) => {
    const certId = await resolveDemoCertId();
    const pauseMs = getPauseMs();

    await test.step("open certificate verification page", async () => {
      await visitVerifyPage(page, certId);
      await expect(page.getByRole("heading").first()).toBeVisible();
      await page.waitForTimeout(pauseMs);
    });

    await test.step("show verified state", async () => {
      await expect(
        page.getByRole("heading", { name: /certificate verified/i }),
      ).toBeVisible();
      await expect(page.getByText(/^valid$/i)).toBeVisible();
      await page.waitForTimeout(pauseMs);
    });

    await test.step("show certificate action state", async () => {
      const downloadButton = page.getByRole("button", { name: /download pdf/i });
      const unlockButton = page.getByRole("button", {
        name: /unlock pdf.*print|unlock pdf \& print/i,
      });

      if (await downloadButton.isVisible().catch(() => false)) {
        await downloadCertificatePdf(page);
      } else {
        await expect(unlockButton).toBeVisible();
      }

      await page.waitForTimeout(pauseMs);
    });
  });
});