#!/usr/bin/env node
/**
 * Convert e2e-gap-report.json into .lovable/smoke-repair-queue.md so the
 * Lovable agent (or a human) has a ready-made repair backlog grouped by
 * severity → category → pathway.
 *
 * Usage:
 *   node scripts/gap-report-to-tasks.mjs
 *   E2E_GAP_REPORT_PATH=/tmp/r node scripts/gap-report-to-tasks.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const SRC = resolve(
  (process.env.E2E_GAP_REPORT_PATH ?? "e2e-gap-report") + ".json",
);
const OUT = resolve(".lovable/smoke-repair-queue.md");

if (!existsSync(SRC)) {
  console.error(`No gap report at ${SRC}. Run the smoke matrix first.`);
  process.exit(1);
}

const gaps = JSON.parse(readFileSync(SRC, "utf8"));
mkdirSync(dirname(OUT), { recursive: true });

const SEV_ORDER = ["error", "warn", "info"];
const buckets = new Map();
for (const g of gaps) {
  const key = `${g.severity}::${g.category ?? "other"}`;
  if (!buckets.has(key)) buckets.set(key, []);
  buckets.get(key).push(g);
}

const sortedKeys = [...buckets.keys()].sort((a, b) => {
  const [sa] = a.split("::");
  const [sb] = b.split("::");
  return SEV_ORDER.indexOf(sa) - SEV_ORDER.indexOf(sb);
});

let md = `# Smoke Repair Queue\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Total gaps: **${gaps.length}**\n\n`;

const counts = SEV_ORDER.map(
  (s) => `${s}: ${gaps.filter((g) => g.severity === s).length}`,
).join(" · ");
md += `${counts}\n\n---\n\n`;

for (const key of sortedKeys) {
  const [sev, cat] = key.split("::");
  const items = buckets.get(key);
  md += `## ${sev.toUpperCase()} · ${cat} (${items.length})\n\n`;
  for (const g of items) {
    md += `- [ ] **${g.spec} › ${g.step}** — ${g.message}`;
    if (g.role || g.pathway) md += `  \n  _${g.role ?? "?"} / ${g.pathway ?? "?"}_`;
    if (g.url) md += `  \n  <${g.url}>`;
    if (g.repairHint) md += `  \n  → ${g.repairHint}`;
    if (g.elapsedMs && g.budgetMs)
      md += `  \n  ⏱ ${g.elapsedMs}ms (budget ${g.budgetMs}ms)`;
    md += `\n`;
  }
  md += `\n`;
}

writeFileSync(OUT, md);
console.log(`Wrote ${OUT} (${gaps.length} gaps)`);
