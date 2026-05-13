import type { Page, Request } from "@playwright/test";
import { recordGap } from "./gapReport";

export interface InstrumentCtx {
  spec: string;
  role?: string;
  pathway?: string;
  scenario?: string;
}

/**
 * Attach console / pageerror / network watchers to a Page.
 * Each event becomes a gap-report entry — never throws.
 *
 * Filters out known noise: Vite HMR pings, third-party analytics, expected 401s
 * on guard-bouncing routes.
 */
const NOISE_PATTERNS: RegExp[] = [
  /vite-ping|@vite\/client|hot-update/i,
  /googletagmanager|google-analytics|doubleclick|gtag/i,
  /sentry|posthog|hotjar|fullstory|datadoghq/i,
  /Download the React DevTools/i,
  /Unknown message type: RESET_BLANK_CHECK/i,
];

function isNoise(text: string) {
  return NOISE_PATTERNS.some((re) => re.test(text));
}

export function instrumentPage(page: Page, ctx: InstrumentCtx) {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isNoise(text)) return;
    recordGap({
      ...ctx,
      step: "console.error",
      severity: "warn",
      category: "other",
      message: text.slice(0, 500),
      url: page.url(),
    });
  });

  page.on("pageerror", (err) => {
    const text = err.message || String(err);
    if (isNoise(text)) return;
    recordGap({
      ...ctx,
      step: "pageerror",
      severity: "error",
      category: "other",
      message: `Uncaught: ${text.slice(0, 500)}`,
      url: page.url(),
    });
  });

  page.on("requestfailed", (req: Request) => {
    const url = req.url();
    if (isNoise(url)) return;
    if (req.resourceType() === "image" || req.resourceType() === "font") return;
    recordGap({
      ...ctx,
      step: "requestfailed",
      severity: "warn",
      category: "data",
      message: `${req.method()} ${url} — ${req.failure()?.errorText ?? "failed"}`,
      url: page.url(),
    });
  });

  page.on("response", (res) => {
    const status = res.status();
    if (status < 500) return;
    const url = res.url();
    if (isNoise(url)) return;
    recordGap({
      ...ctx,
      step: "http5xx",
      severity: "error",
      category: "data",
      message: `${status} ${res.request().method()} ${url}`,
      url: page.url(),
    });
  });
}

/**
 * Detect when navigation lands somewhere unexpected (auth bounce, /404, etc.)
 */
export async function expectLandedAt(
  page: Page,
  expected: RegExp,
  ctx: InstrumentCtx & { step: string },
) {
  const url = page.url();
  if (!expected.test(url)) {
    recordGap({
      ...ctx,
      severity: "error",
      category: "routing",
      message: `Expected URL to match ${expected}, got ${url}`,
      url,
    });
    return false;
  }
  return true;
}
