#!/usr/bin/env node
/**
 * Regenerate the static print PDFs in /public/print/ from the TS sheet sources.
 *
 * Run with:  bun scripts/generate-print-pdfs.mjs
 *
 * Requires `chromium` (or `chromium-browser` / `google-chrome`) on PATH.
 * The generated PDFs are committed so the app can serve them as static assets
 * without needing a headless browser at runtime.
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const { getPricingSheetHtml, getFeaturesSheetHtml } = await import(
  join(root, "src/components/admin/printables/printableSheets.ts")
);

const outDir = join(root, "public/print");
mkdirSync(outDir, { recursive: true });

function findChromium() {
  for (const bin of ["chromium", "chromium-browser", "google-chrome", "chrome"]) {
    try {
      execSync(`command -v ${bin}`, { stdio: "ignore" });
      return bin;
    } catch {
      /* try next */
    }
  }
  throw new Error("No chromium/chrome binary found on PATH");
}

const chrome = findChromium();
const sheets = [
  { name: "jobline-ai-pricing-sheet", html: getPricingSheetHtml() },
  { name: "jobline-ai-features-sheet", html: getFeaturesSheetHtml() },
];

for (const s of sheets) {
  const htmlPath = join(tmpdir(), `${s.name}.html`);
  const pdfPath = join(outDir, `${s.name}.pdf`);
  writeFileSync(htmlPath, s.html);
  execSync(
    `${chrome} --headless --disable-gpu --no-sandbox --no-pdf-header-footer ` +
      `--print-to-pdf="${pdfPath}" "file://${htmlPath}"`,
    { stdio: "inherit" }
  );
  console.log("wrote", pdfPath);
}
