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
const DEFAULT_PORT = Number(process.env.PRERENDER_PORT ?? 4173);
let previewPort = DEFAULT_PORT;

function getOrigin() {
  return `http://127.0.0.1:${previewPort}`;
}

// Routes to prerender — keep in sync with sitemap.xml priority list.
const ROUTES = [
  "/",
  "/pricing",
  "/demo",
  "/blog",
  "/help",
  "/tools",
  "/resources",
  "/resources/beginners",
  "/resources/careers",
  "/resources/comparisons",
  "/resources/gcode",
  "/resources/guides",
  "/resources/kanban",
  "/resources/lean",
  "/resources/quality",
  "/shift-handoff",
  "/machine-time-tracking",
  // Features
  "/features/ai-planning-assistant",
  "/features/cnc-operator-tools",
  "/features/downtime-tracking",
  "/features/machine-connect",
  "/features/machine-shop-software",
  "/features/manufacturing-oversight",
  "/features/production-control",
  "/features/production-scheduling",
  "/features/quality-management",
  "/features/team-collaboration",
  "/features/vscode-gcode",
  "/features/work-order-tracking",
  // Industries
  "/industries/additive-manufacturing",
  "/industries/aerospace-defense",
  "/industries/electronics-assembly",
  "/industries/ev-battery",
  "/industries/food-beverage",
  "/industries/industrial-manufacturing",
  "/industries/medical-device",
  "/industries/metal-fabrication",
  "/industries/pharma-life-sciences",
  "/industries/plastics-rubber",
  "/industries/renewable-energy",
  "/industries/semiconductor",
];

const log = (...args) => globalThis.console.log("[prerender]", ...args);
const warn = (...args) => globalThis.console.warn("[prerender]", ...args);

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
      if (response.ok) {
        return;
      }
    } catch {
      // Preview is still starting.
    }

    await new Promise((resolveDelay) => globalThis.setTimeout(resolveDelay, 250));
  }

  proc.kill();
  throw new Error("vite preview failed to start within 20s");
}

function startPreview(port) {
  return new Promise((resolveStart, rejectStart) => {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const args = ["vite", "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"];
    const proc = spawn(
      command,
      args,
      {
        cwd: ROOT,
        shell: process.platform === "win32",
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );
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
    // Give react-helmet-async a tick to flush head tags
    await new Promise((r) => globalThis.setTimeout(r, 250));
    const html = await page.content();
    // Sanity check — refuse to write empty/error snapshots
    if (!html || html.length < shellHtml.length / 2) {
      throw new Error(`suspiciously small (${html?.length ?? 0} bytes)`);
    }
    const outDir = route === "/" ? DIST : join(DIST, route);
    await mkdir(outDir, { recursive: true });
    const outFile = join(outDir, "index.html");
    await writeFile(outFile, html, "utf8");
    log(`✓ ${route} (${html.length} bytes)`);
    return true;
  } catch (err) {
    warn(`✗ ${route}: ${err.message}`);
    return false;
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  if (!(await exists(join(DIST, "index.html")))) {
    warn("dist/index.html missing — did `vite build` run?");
    return;
  }
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
  let ok = 0, fail = 0;
  for (const route of ROUTES) {
    const success = await prerenderRoute(browser, route, shellHtml);
    if (success) ok++; else fail++;
  }

  await browser.close().catch(() => {});
  preview.kill();
  log(`Done — ${ok} prerendered, ${fail} failed.`);
}

// Never fail the build — SEO is best-effort.
main().catch((err) => {
  warn("Unexpected error (continuing build):", err.message);
});
