#!/usr/bin/env node
/**
 * Static prerender for marketing routes.
 *
 * Why: Vite SPA ships an empty <div id="root"> in dist/index.html. Googlebot
 * sees no content and parks pages in "Discovered – currently not indexed".
 * This script spins up `vite preview`, navigates Puppeteer to each marketing
 * route, captures the fully-rendered HTML, and writes dist/<route>/index.html.
 * Lovable's static hosting then serves the snapshot directly to crawlers.
 *
 * Route source: parsed from public/sitemap.xml so the two lists can't drift.
 * Concurrency: PRERENDER_CONCURRENCY (default 4) pages in parallel.
 *
 * Safe: never throws. If puppeteer / preview fails, leaves dist/ untouched.
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");
const PUBLIC_DIR = join(ROOT, "public");
const DEFAULT_PORT = Number(process.env.PRERENDER_PORT ?? 4173);
const CONCURRENCY = Math.max(1, Number(process.env.PRERENDER_CONCURRENCY ?? 4));
let previewPort = DEFAULT_PORT;

function getOrigin() {
  return `http://127.0.0.1:${previewPort}`;
}

const log = (...args) => globalThis.console.log("[prerender]", ...args);
const warn = (...args) => globalThis.console.warn("[prerender]", ...args);

// Routes the prerender skips even when present in sitemap.xml.
// Reasons:
//   - require auth or user data (display, dashboard, etc.)
//   - are dynamic per-user (talent profiles) and prerendered separately
//   - serve their own static html (status, _api_health)
const SKIP_PATTERNS = [
  /^\/dashboard/, /^\/admin/, /^\/auth/, /^\/profile/, /^\/queue/, /^\/teams/,
  /^\/setup/, /^\/settings/, /^\/display/, /^\/functions\//, /^\/start/,
  /^\/talent\/[a-z0-9_-]+$/i, // per-user talent pages
];

async function loadRoutesFromSitemap() {
  const out = new Set();
  const files = ["sitemap.xml", "sitemap-index.xml"]; // sitemap-talent has dynamic profiles
  for (const f of files) {
    try {
      const xml = await readFile(join(PUBLIC_DIR, f), "utf8");
      const matches = xml.matchAll(/<loc>\s*https?:\/\/[^/]+([^<]*)<\/loc>/g);
      for (const m of matches) {
        const path = (m[1] || "").trim();
        if (!path || path.endsWith(".xml")) continue;
        if (SKIP_PATTERNS.some((re) => re.test(path))) continue;
        // Strip trailing slash except for root
        const clean = path === "/" ? "/" : path.replace(/\/$/, "");
        out.add(clean);
      }
    } catch {
      // ignore missing sitemap
    }
  }
  return Array.from(out).sort();
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function loadPuppeteer() {
  try {
    const mod = await import("puppeteer");
    return mod.default ?? mod;
  } catch (err) {
    warn("puppeteer not available, skipping prerender:", err.message);
    return null;
  }
}

function reservePort(port) {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.unref();
    server.once("error", rejectPort);
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : port;
      server.close((closeError) => {
        if (closeError) {
          rejectPort(closeError);
          return;
        }
        resolvePort(resolvedPort);
      });
    });
  });
}

async function findAvailablePort() {
  try {
    return await reservePort(DEFAULT_PORT);
  } catch {
    return reservePort(0);
  }
}

async function waitForPreview(port, proc) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) {
      throw new Error(`vite preview exited early (code ${proc.exitCode})`);
    }
    try {
      const response = await globalThis.fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch { /* preview still starting */ }
    await new Promise((r) => globalThis.setTimeout(r, 250));
  }
  proc.kill();
  throw new Error("vite preview failed to start within 20s");
}

function startPreview(port) {
  return new Promise((resolveStart, rejectStart) => {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const args = ["vite", "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"];
    const proc = spawn(command, args, {
      cwd: ROOT,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    proc.stderr.on("data", (chunk) => {
      const txt = chunk.toString();
      if (/EADDRINUSE/i.test(txt)) {
        rejectStart(new Error("Port in use"));
      }
    });
    waitForPreview(port, proc).then(() => resolveStart(proc)).catch(rejectStart);
  });
}

async function prerenderRoute(browser, route, shellHtml) {
  const url = getOrigin() + route;
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (compatible; JoblinePrerender/1.0; +https://jobline.ai)",
    );
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });
    await new Promise((r) => globalThis.setTimeout(r, 250));
    const html = await page.content();
    if (!html || html.length < shellHtml.length / 2) {
      throw new Error(`suspiciously small (${html?.length ?? 0} bytes)`);
    }
    const outDir = route === "/" ? DIST : join(DIST, route);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "index.html"), html, "utf8");
    return { ok: true, route, bytes: html.length };
  } catch (err) {
    return { ok: false, route, error: err.message };
  } finally {
    await page.close().catch(() => {});
  }
}

async function runPool(browser, routes, shellHtml) {
  let i = 0, ok = 0, fail = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= routes.length) return;
      const r = await prerenderRoute(browser, routes[idx], shellHtml);
      if (r.ok) { ok++; log(`✓ ${r.route} (${r.bytes}b)`); }
      else { fail++; warn(`✗ ${r.route}: ${r.error}`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { ok, fail };
}

async function main() {
  if (!(await exists(join(DIST, "index.html")))) {
    warn("dist/index.html missing — did `vite build` run?");
    return;
  }
  const routes = await loadRoutesFromSitemap();
  if (routes.length === 0) {
    warn("no routes discovered from sitemap.xml — skipping");
    return;
  }
  log(`Discovered ${routes.length} routes from sitemap (concurrency=${CONCURRENCY})`);

  const puppeteer = await loadPuppeteer();
  if (!puppeteer) return;

  let preview;
  try {
    previewPort = await findAvailablePort();
    preview = await startPreview(previewPort);
  } catch (err) {
    warn("Could not start vite preview:", err.message);
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (err) {
    warn("puppeteer.launch failed:", err.message);
    preview.kill();
    return;
  }

  const shellHtml = await readFile(join(DIST, "index.html"), "utf8");
  const { ok, fail } = await runPool(browser, routes, shellHtml);

  await browser.close().catch(() => {});
  preview.kill();
  log(`Done — ${ok} prerendered, ${fail} failed.`);
}

// Never fail the build — SEO is best-effort.
main().catch((err) => {
  warn("Unexpected error (continuing build):", err.message);
});
