#!/usr/bin/env node
/**
 * Generates public/sitemap-talent.xml from Supabase public talent profiles.
 *
 * Why: Per-profile URLs (e.g. /talent/zach-w) need their own sitemap entries
 * so Google, Bing, and LinkedIn can discover & rank live operator profiles
 * individually instead of relying on /talent/browse alone.
 *
 * Safe: never throws — failures log a warning and exit 0 so builds don't break.
 * Reads only public profiles via list_public_operator_profiles RPC; private
 * and employers_only profiles are excluded automatically by the RPC.
 */

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public", "sitemap-talent.xml");
const ORIGIN = "https://jobline.ai";
const HARD_CAP = 5000; // Sitemap protocol limit is 50k; we cap soft for cost.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://kgrstnbxqdmadtoankqr.supabase.co";

const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

function escapeXml(s) {
  return String(s ?? "").replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]),
  );
}

function buildSitemap(profiles) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = profiles
    .filter((p) => p.public_username)
    .map((p) => {
      const lastmod = p.public_published_at
        ? new Date(p.public_published_at).toISOString().slice(0, 10)
        : today;
      return `  <url>
    <loc>${ORIGIN}/talent/${escapeXml(p.public_username)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Per-profile public talent URLs.
  Regenerated at build time by scripts/generate-talent-sitemap.mjs.
  Generated: ${new Date().toISOString()}
  Profile count: ${profiles.length}
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function fetchPublicProfiles() {
  if (!ANON_KEY) {
    throw new Error("Missing Supabase anon key (VITE_SUPABASE_PUBLISHABLE_KEY).");
  }
  const url = `${SUPABASE_URL}/rest/v1/rpc/list_public_operator_profiles`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ _limit: HARD_CAP, _sort: "recent" }),
  });
  if (!res.ok) {
    throw new Error(`Supabase RPC failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected RPC response shape (expected array).");
  }
  return data;
}

async function main() {
  try {
    const profiles = await fetchPublicProfiles();
    const xml = buildSitemap(profiles);
    await writeFile(OUT, xml, "utf8");
    console.log(`[sitemap-talent] wrote ${profiles.length} profile URLs`);
  } catch (err) {
    console.warn(`[sitemap-talent] skipped: ${err?.message || err}`);
    // Leave existing file in place; exit 0 so builds never break.
    process.exit(0);
  }
}

main();
