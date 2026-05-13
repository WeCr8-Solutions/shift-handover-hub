import { mkdirSync, appendFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * GapReport — JSON-lines logger so smoke tests can record every missing UI
 * element, broken state transition, perf miss, or assertion failure without
 * aborting the run.
 *
 * Outputs:
 *   - e2e-gap-report.ndjson   (streaming JSONL)
 *   - e2e-gap-report.json     (final array)
 *   - e2e-gap-summary.md      (categorized human-readable summary)
 *
 * Override base path via E2E_GAP_REPORT_PATH (no extension).
 */
export type GapSeverity = "info" | "warn" | "error";

export type GapCategory =
  | "dead_end"
  | "perf"
  | "rls"
  | "missing_ui"
  | "routing"
  | "notification"
  | "data"
  | "auth"
  | "other";

export interface GapEntry {
  ts: string;
  spec: string;
  step: string;
  severity: GapSeverity;
  message: string;
  scenario?: string;
  category?: GapCategory;
  selector?: string;
  url?: string;
  role?: string;
  pathway?: string;
  /** Free-form hint to help an agent locate the broken file/component. */
  repairHint?: string;
  /** Numeric perf miss when category=perf */
  elapsedMs?: number;
  budgetMs?: number;
  meta?: Record<string, unknown>;
}

const BASE_PATH = resolve(
  process.env.E2E_GAP_REPORT_PATH ?? "e2e-gap-report",
);
const NDJSON_PATH = `${BASE_PATH}.ndjson`;
const JSON_PATH = `${BASE_PATH}.json`;
const SUMMARY_PATH = resolve("e2e-gap-summary.md");

let initialized = false;
const buffer: GapEntry[] = [];

function init() {
  if (initialized) return;
  mkdirSync(dirname(NDJSON_PATH), { recursive: true });
  writeFileSync(NDJSON_PATH, "");
  if (!existsSync(JSON_PATH)) writeFileSync(JSON_PATH, "[]");
  initialized = true;
}

export function recordGap(entry: Omit<GapEntry, "ts">) {
  init();
  const full: GapEntry = {
    ts: new Date().toISOString(),
    category: entry.category ?? "other",
    ...entry,
  };
  buffer.push(full);
  appendFileSync(NDJSON_PATH, JSON.stringify(full) + "\n");
  const tag = full.severity.toUpperCase();
  // eslint-disable-next-line no-console
  console.log(
    `[GAP:${tag}] ${full.spec} › ${full.step} [${full.category}]: ${full.message}`,
  );
}

export function flushGapReport() {
  init();
  writeFileSync(JSON_PATH, JSON.stringify(buffer, null, 2));
  writeFileSync(SUMMARY_PATH, buildSummary(buffer));
}

export function getGaps() {
  return [...buffer];
}

function buildSummary(gaps: GapEntry[]): string {
  const total = gaps.length;
  const byCat = new Map<string, GapEntry[]>();
  const bySev = { error: 0, warn: 0, info: 0 };
  const routes = new Set<string>();
  for (const g of gaps) {
    bySev[g.severity]++;
    const cat = g.category ?? "other";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(g);
    if (g.url) {
      try {
        routes.add(new URL(g.url).pathname);
      } catch {
        routes.add(g.url);
      }
    }
  }

  const critical = gaps.filter(
    (g) => g.severity === "error" && (g.category === "dead_end" || g.category === "auth" || g.category === "rls"),
  );
  const blockers = gaps.filter(
    (g) => g.severity === "error" && !critical.includes(g),
  );
  const warnings = gaps.filter((g) => g.severity === "warn");
  const consoleNet = gaps.filter(
    (g) =>
      g.step === "console.error" ||
      g.step === "pageerror" ||
      g.step === "requestfailed" ||
      g.step === "http5xx",
  );

  const fmt = (g: GapEntry) =>
    `- **${g.spec} › ${g.step}** [${g.category}] — ${g.message}` +
    (g.url ? `\n  - URL: \`${g.url}\`` : "") +
    (g.repairHint ? `\n  - Fix: ${g.repairHint}` : "");

  return [
    `# E2E Gap Report Summary`,
    ``,
    `**Generated:** ${new Date().toISOString()}`,
    `**Total gaps:** ${total} — ${bySev.error} error / ${bySev.warn} warn / ${bySev.info} info`,
    ``,
    `## Critical failures (${critical.length})`,
    `Auth bounces, RLS leaks, dead-end routes — fix first.`,
    critical.length ? critical.map(fmt).join("\n") : `_None_`,
    ``,
    `## Functional blockers (${blockers.length})`,
    `Errors that break a core user task.`,
    blockers.length ? blockers.map(fmt).join("\n") : `_None_`,
    ``,
    `## Warnings & concerns (${warnings.length})`,
    warnings.length
      ? warnings
          .slice(0, 50)
          .map(fmt)
          .join("\n") +
        (warnings.length > 50 ? `\n\n_…and ${warnings.length - 50} more_` : "")
      : `_None_`,
    ``,
    `## Console / network issues (${consoleNet.length})`,
    consoleNet.length
      ? consoleNet
          .slice(0, 30)
          .map(fmt)
          .join("\n") +
        (consoleNet.length > 30
          ? `\n\n_…and ${consoleNet.length - 30} more_`
          : "")
      : `_None_`,
    ``,
    `## Routes touched (${routes.size})`,
    Array.from(routes)
      .sort()
      .map((r) => `- \`${r}\``)
      .join("\n") || `_None_`,
    ``,
    `## Categories`,
    Array.from(byCat.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([cat, list]) => `- **${cat}**: ${list.length}`)
      .join("\n"),
    ``,
  ].join("\n");
}
