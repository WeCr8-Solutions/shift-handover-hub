import { defineConfig, devices } from "@playwright/test";

const captureDemoArtifacts = process.env.PW_CAPTURE_DEMO === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  outputDir: captureDemoArtifacts ? "tmp/recordings/playwright-artifacts" : "test-results",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: captureDemoArtifacts ? "on" : "on-first-retry",
    screenshot: captureDemoArtifacts ? "on" : "only-on-failure",
    video: captureDemoArtifacts ? "on" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.CHROMIUM_BIN || undefined,
        },
      },
    },
  ],
});
