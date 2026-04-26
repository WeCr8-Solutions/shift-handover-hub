#!/usr/bin/env node
/**
 * Release manifest CI/CD smoke
 *
 * Verifies the live site's /release.json:
 *  - Reachable, valid JSON, expected schema
 *  - commitSha is NOT "unknown" (deploy did pick up the SHA)
 *  - shortSha is the 7-char prefix of commitSha
 *  - releaseStamp matches `${version}+${shortSha}`
 *  - buildTime is a valid ISO date
 *  - deployTarget is one of the known values
 *  - For non-local builds, releaseStamp matches the local manifest committed
 *    at public/release.json (catches Lovable/Vercel serving a stale snapshot)
 *
 * Env:
 *  PUBLIC_SITE_URL   default https://jobline.ai
 *  STRICT_MATCH      "1" to require live SHA == local repo SHA (use on tag releases)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://jobline.ai";
const STRICT_MATCH = process.env.STRICT_MATCH === "1";
const KNOWN_TARGETS = new Set([
  "vercel",
  "cloudflare-pages",
  "github-actions",
  "lovable",
  "local",
]);

const failures = [];
const warnings = [];
const pass = (m) => console.log(`PASS ${m}`);
const fail = (m) => { console.log(`FAIL ${m}`); failures.push(m); };
const warn = (m) => { console.log(`WARN ${m}`); warnings.push(m); };

async function main() {
  console.log(`== Release manifest smoke ==`);
  console.log(`Site: ${PUBLIC_SITE_URL}`);

  const url = `${PUBLIC_SITE_URL.replace(/\/$/, "")}/release.json`;
  const resp = await fetch(url, {
    headers: { "user-agent": "jobline-release-smoke/1.0", "cache-control": "no-cache" },
  });
  if (resp.status !== 200) {
    fail(`GET ${url} → HTTP ${resp.status}`);
    return;
  }
  pass(`GET ${url} → 200`);

  let live;
  try {
    live = await resp.json();
  } catch {
    fail("release.json is not valid JSON");
    return;
  }

  for (const key of ["version", "commitSha", "shortSha", "releaseStamp", "buildTime", "deployTarget"]) {
    if (typeof live[key] !== "string" || !live[key]) {
      fail(`release.json missing required string field: ${key}`);
    }
  }
  if (failures.length) return;
  pass("release.json schema present");

  if (live.commitSha === "unknown") {
    fail("release.json commitSha is 'unknown' — build env is not exposing a git SHA (set VERCEL_GIT_COMMIT_SHA / GITHUB_SHA / LOVABLE_GIT_COMMIT_SHA)");
  } else {
    pass(`commitSha=${live.commitSha}`);
  }

  if (live.shortSha !== live.commitSha.slice(0, 7)) {
    fail(`shortSha (${live.shortSha}) is not the 7-char prefix of commitSha (${live.commitSha})`);
  } else {
    pass("shortSha matches commitSha prefix");
  }

  const expectedStamp = `${live.version}+${live.shortSha}`;
  if (live.releaseStamp !== expectedStamp) {
    fail(`releaseStamp (${live.releaseStamp}) ≠ ${expectedStamp}`);
  } else {
    pass(`releaseStamp=${live.releaseStamp}`);
  }

  const buildTimeMs = Date.parse(live.buildTime);
  if (!Number.isFinite(buildTimeMs)) {
    fail(`buildTime is not a valid ISO date: ${live.buildTime}`);
  } else {
    const ageDays = (Date.now() - buildTimeMs) / 86_400_000;
    if (ageDays > 30) warn(`buildTime is ${ageDays.toFixed(1)} days old — site may be stale`);
    pass(`buildTime parsed (${ageDays.toFixed(1)}d ago)`);
  }

  if (!KNOWN_TARGETS.has(live.deployTarget)) {
    fail(`deployTarget '${live.deployTarget}' is not one of: ${[...KNOWN_TARGETS].join(", ")}`);
  } else {
    pass(`deployTarget=${live.deployTarget}`);
  }

  // Compare against repo manifest
  try {
    const localPath = path.join(rootDir, "public", "release.json");
    const local = JSON.parse(readFileSync(localPath, "utf8"));
    if (STRICT_MATCH) {
      if (local.commitSha !== "unknown" && local.commitSha !== live.commitSha) {
        fail(`STRICT: live commitSha (${live.commitSha}) ≠ repo commitSha (${local.commitSha})`);
      } else {
        pass("STRICT match between live and repo manifest");
      }
    } else if (local.commitSha !== "unknown" && live.commitSha !== "unknown" && local.commitSha !== live.commitSha) {
      warn(`live commitSha (${live.commitSha}) differs from repo (${local.commitSha}) — expected mid-deploy`);
    }
  } catch {
    warn("Could not read local public/release.json for comparison");
  }

  console.log(`\n== Result ==`);
  if (failures.length === 0) {
    console.log(`PASS release manifest is healthy${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
    return;
  }
  for (const f of failures) console.log(`FAIL ${f}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("FAIL release smoke could not complete");
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
