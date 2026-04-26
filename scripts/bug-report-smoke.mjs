#!/usr/bin/env node
/**
 * Bug-report (issue reporter) CI/CD smoke
 *
 * The `report-issue` edge function backs the in-app "Report a bug" widget.
 * This script verifies the function is deployed and behaves correctly without
 * needing real credentials:
 *
 *   1. OPTIONS preflight returns CORS headers (browser can call it)
 *   2. POST without Authorization returns 401 (security gate is active)
 *   3. POST with a bogus Bearer token returns 401 (token is actually checked)
 *   4. The response is JSON with an { error } field (not an HTML 5xx page)
 *
 * Any 5xx (especially 503 SUPABASE_EDGE_RUNTIME_ERROR) is a hard fail —
 * that means the function failed to boot (lockfile / import drift).
 *
 * Env:
 *   SUPABASE_URL         default https://kgrstnbxqdmadtoankqr.supabase.co
 *   SUPABASE_ANON_KEY    default project anon key
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://kgrstnbxqdmadtoankqr.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncnN0bmJ4cWRtYWR0b2Fua3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzM0MDgsImV4cCI6MjA4NTg0OTQwOH0.XmY5BDVKz2SBv4_MZk7lgrP5CJDSXeCl-PwDFoCwiik";

const FN_URL = `${SUPABASE_URL}/functions/v1/report-issue`;

const failures = [];
const pass = (m) => console.log(`PASS ${m}`);
const fail = (m) => { console.log(`FAIL ${m}`); failures.push(m); };

async function checkOptions() {
  const resp = await fetch(FN_URL, {
    method: "OPTIONS",
    headers: {
      Origin: "https://jobline.ai",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  if (resp.status >= 500) {
    fail(`OPTIONS → HTTP ${resp.status} (function is not booting)`);
    return;
  }
  if (resp.status !== 200 && resp.status !== 204) {
    fail(`OPTIONS → HTTP ${resp.status} (expected 200/204)`);
    return;
  }
  const allowOrigin = resp.headers.get("access-control-allow-origin");
  if (!allowOrigin) {
    fail("OPTIONS missing Access-Control-Allow-Origin header");
    return;
  }
  pass(`OPTIONS preflight ok (HTTP ${resp.status}, ACAO=${allowOrigin})`);
}

async function checkUnauthenticated() {
  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ title: "smoke" }),
  });
  if (resp.status >= 500) {
    fail(`POST (no auth) → HTTP ${resp.status} (function is not booting)`);
    return;
  }
  if (resp.status !== 401) {
    fail(`POST (no auth) → HTTP ${resp.status} (expected 401 — security gate)`);
    return;
  }
  let json = null;
  try { json = await resp.json(); } catch { /* ignore */ }
  if (!json || typeof json.error !== "string") {
    fail("POST (no auth) response is not JSON with an 'error' string");
    return;
  }
  pass(`POST (no auth) → 401 with JSON error: "${json.error}"`);
}

async function checkBogusToken() {
  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: "Bearer not-a-real-token",
      "content-type": "application/json",
    },
    body: JSON.stringify({ title: "smoke" }),
  });
  if (resp.status >= 500) {
    fail(`POST (bogus token) → HTTP ${resp.status} (function is not booting)`);
    return;
  }
  if (resp.status !== 401) {
    fail(`POST (bogus token) → HTTP ${resp.status} (expected 401 — token must be validated)`);
    return;
  }
  pass("POST (bogus token) → 401 (token is being validated)");
}

async function main() {
  console.log("== Bug-report (report-issue) edge function smoke ==");
  console.log(`URL: ${FN_URL}`);
  await checkOptions();
  await checkUnauthenticated();
  await checkBogusToken();

  console.log("\n== Result ==");
  if (failures.length === 0) {
    console.log("PASS bug-report function is healthy and gated.");
    return;
  }
  for (const f of failures) console.log(`FAIL ${f}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("FAIL bug-report smoke could not complete");
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
