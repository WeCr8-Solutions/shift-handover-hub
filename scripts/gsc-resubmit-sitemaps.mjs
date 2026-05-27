#!/usr/bin/env node
/**
 * Resubmit JobLine.ai sitemaps to Google Search Console.
 * Runs via the Lovable connector gateway — credentials come from env.
 * Usage: node scripts/gsc-resubmit-sitemaps.mjs
 * Requires: LOVABLE_API_KEY, GOOGLE_SEARCH_CONSOLE_API_KEY
 */
const SITE = encodeURIComponent("sc-domain:jobline.ai");
const SITEMAPS = [
  "https://jobline.ai/sitemap-index.xml",
  "https://jobline.ai/sitemap.xml",
  "https://jobline.ai/sitemap-talent.xml",
];

const { LOVABLE_API_KEY, GOOGLE_SEARCH_CONSOLE_API_KEY } = process.env;
if (!LOVABLE_API_KEY || !GOOGLE_SEARCH_CONSOLE_API_KEY) {
  console.warn("[gsc-resubmit] Skipping — LOVABLE_API_KEY or GOOGLE_SEARCH_CONSOLE_API_KEY missing.");
  process.exit(0);
}

let failed = 0;
for (const sm of SITEMAPS) {
  const url = `https://connector-gateway.lovable.dev/google_search_console/webmasters/v3/sites/${SITE}/sitemaps/${encodeURIComponent(sm)}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_SEARCH_CONSOLE_API_KEY,
      },
    });
    const ok = res.status === 204 || res.status === 200;
    console.log(`[gsc-resubmit] ${ok ? "✓" : "✗"} ${sm} → HTTP ${res.status}`);
    if (!ok) failed++;
  } catch (e) {
    console.error(`[gsc-resubmit] ✗ ${sm} → ${e.message}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
