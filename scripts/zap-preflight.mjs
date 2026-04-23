import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const productionUrl = new URL(process.env.ZAP_PRECHECK_URL ?? "https://jobline.ai");
const releaseUrl = new URL("/release.json", productionUrl);
const expectedHeaders = [
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "content-security-policy",
  "referrer-policy",
  "permissions-policy",
];

async function fetchResponse(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "jobline-zap-preflight/1.0",
      accept: "application/json,text/html;q=0.9,*/*;q=0.8",
    },
  });

  return response;
}

function readLocalRelease() {
  const localReleasePath = path.join(rootDir, "public", "release.json");
  return JSON.parse(readFileSync(localReleasePath, "utf8"));
}

function normalizeHeaderMap(headers) {
  return Object.fromEntries([...headers.entries()].map(([key, value]) => [key.toLowerCase(), value]));
}

function printSection(title) {
  console.log(`\n== ${title} ==`);
}

async function main() {
  const failures = [];
  const localRelease = readLocalRelease();

  const productionResponse = await fetchResponse(productionUrl);
  const releaseResponse = await fetchResponse(releaseUrl);
  const headerMap = normalizeHeaderMap(productionResponse.headers);
  const liveRelease = await releaseResponse.json();

  printSection(`Target ${productionUrl.href}`);
  console.log(`Status: ${productionResponse.status}`);

  for (const headerName of expectedHeaders) {
    const headerValue = headerMap[headerName];
    if (headerValue) {
      console.log(`PASS header ${headerName}: ${headerValue}`);
      continue;
    }

    console.log(`FAIL header ${headerName}: missing`);
    failures.push(`Missing required header: ${headerName}`);
  }

  printSection(`Release manifest ${releaseUrl.href}`);
  console.log(`Live commit: ${liveRelease.commitSha}`);
  console.log(`Local commit: ${localRelease.commitSha}`);
  console.log(`Live deploy target: ${liveRelease.deployTarget}`);
  console.log(`Local deploy target: ${localRelease.deployTarget}`);

  if (liveRelease.commitSha === "unknown") {
    failures.push("Live release.json is still reporting commitSha=unknown.");
  }

  if (liveRelease.commitSha !== localRelease.commitSha) {
    failures.push(
      `Live release.json commitSha (${liveRelease.commitSha}) does not match repo manifest (${localRelease.commitSha}).`
    );
  }

  if (liveRelease.deployTarget !== "vercel") {
    failures.push(
      `Live release.json deployTarget is ${liveRelease.deployTarget}; expected vercel for the hardened deployment path.`
    );
  }

  printSection("Result");
  if (failures.length === 0) {
    console.log("PASS ZAP preflight is green for the production target.");
    return;
  }

  for (const failure of failures) {
    console.log(`FAIL ${failure}`);
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error("FAIL zap preflight could not complete");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});