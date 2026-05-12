import { mkdirSync, appendFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * GapReport — JSON-lines logger so smoke tests can record every missing UI
 * element, broken state transition, perf miss, or assertion failure without
 * aborting the run.
 *
 * Output: e2e-gap-report.json (array) + e2e-gap-report.ndjson (stream)
 * Override path with E2E_GAP_REPORT_PATH.
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
}

export function getGaps() {
  return [...buffer];
}
