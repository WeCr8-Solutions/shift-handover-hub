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
/**
 * Console / network noise that we *intentionally* ignore. Each pattern below
 * has a documented reason — never add a pattern just to silence a real failure.
 *
 *  - Vite HMR / dev-server pings — never represent app bugs
 *  - Third-party analytics — out of our control + blocked by adblockers in CI
 *  - React DevTools nag message
 *  - Lovable preview shell `RESET_BLANK_CHECK` postMessage
 *  - `TypeError: Failed to fetch` — React Query cancels in-flight queries on
 *    unmount/navigation, surfacing as `pageerror`/console.error noise
 *  - `AbortError` from fetch + supabase-js (same root cause)
 */
const NOISE_PATTERNS: RegExp[] = [
  /vite-ping|@vite\/client|hot-update/i,
  /googletagmanager|google-analytics|doubleclick|gtag|gtm\.js/i,
  /sentry|posthog|hotjar|fullstory|datadoghq|cdn\.gpteng\.co/i,
  /Download the React DevTools/i,
  /Unknown message type: RESET_BLANK_CHECK/i,
  /TypeError: Failed to fetch/i,
  /AbortError|signal is aborted|The user aborted a request/i,
  /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i,
  /404 Error: User attempted to access non-existent route/i,
  /React does not recognize the .* prop on a DOM element/i,
  /React Router Future Flag Warning/i,
  /Missing `Description` or `aria-describedby/i,
];

const NETWORK_ABORT_PATTERNS: RegExp[] = [
  /ERR_ABORTED|NS_BINDING_ABORTED|net::ERR_ABORTED/i,
  /ERR_CANCELED|NS_BINDING_CANCELED/i,
  /signal is aborted/i,
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
    const errText = req.failure()?.errorText ?? "failed";
    if (NETWORK_ABORT_PATTERNS.some((re) => re.test(errText))) return;
    recordGap({
      ...ctx,
      step: "requestfailed",
      severity: "warn",
      category: "data",
      message: `${req.method()} ${url} — ${errText}`,
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
