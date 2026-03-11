import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function safeGit(command) {
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

function detectDeployTarget() {
  if (process.env.VERCEL) return "vercel";
  if (process.env.CF_PAGES) return "cloudflare-pages";
  if (process.env.GITHUB_ACTIONS) return "github-actions";
  if (process.env.LOVABLE_PROJECT_ID || process.env.LOVABLE_ENV) return "lovable";
  return "local";
}

const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const commitSha = (
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  safeGit("git rev-parse HEAD")
).slice(0, 12);
const shortSha = commitSha.slice(0, 7);
const buildTime = new Date().toISOString();
const deployTarget = detectDeployTarget();
const releaseStamp = `${packageJson.version}+${shortSha}`;

const releaseInfo = {
  version: packageJson.version,
  commitSha,
  shortSha,
  releaseStamp,
  buildTime,
  deployTarget,
};

mkdirSync(path.join(rootDir, "public"), { recursive: true });
mkdirSync(path.join(rootDir, "src", "generated"), { recursive: true });

writeFileSync(
  path.join(rootDir, "public", "release.json"),
  `${JSON.stringify(releaseInfo, null, 2)}\n`,
  "utf8"
);

writeFileSync(
  path.join(rootDir, "src", "generated", "release.ts"),
  [
    "export const releaseInfo = " + JSON.stringify(releaseInfo, null, 2) + " as const;",
    "",
    `export const APP_VERSION = ${JSON.stringify(releaseInfo.version)};`,
    `export const APP_COMMIT_SHA = ${JSON.stringify(releaseInfo.commitSha)};`,
    `export const APP_RELEASE_STAMP = ${JSON.stringify(releaseInfo.releaseStamp)};`,
    `export const APP_BUILD_TIME = ${JSON.stringify(releaseInfo.buildTime)};`,
    `export const APP_DEPLOY_TARGET = ${JSON.stringify(releaseInfo.deployTarget)};`,
    "",
  ].join("\n"),
  "utf8"
);

console.log(`Release manifest written: ${releaseInfo.releaseStamp} (${releaseInfo.commitSha})`);