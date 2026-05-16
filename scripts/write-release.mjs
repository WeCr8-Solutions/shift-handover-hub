import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function safeGitHead() {
  // Fallback: read .git/HEAD directly without requiring the git CLI.
  // Works in shallow-clone build environments (e.g. Lovable) that lack git.
  try {
    const headPath = path.join(rootDir, ".git", "HEAD");
    const headContent = readFileSync(headPath, "utf8").trim();
    if (headContent.startsWith("ref: ")) {
      const refFile = path.join(rootDir, ".git", headContent.slice(5));
      return readFileSync(refFile, "utf8").trim();
    }
    return headContent; // detached HEAD — content is the SHA directly
  } catch {
    return null;
  }
}

function safeGit(command) {
  // Try multiple git binaries: Lovable's sandbox proxies `git` to a wrapper
  // that may fail in hosted builds. `__LOVABLE_REAL_GIT` points at the real
  // binary when present. Fall back to PATH and known absolute paths.
  const candidates = [
    process.env.__LOVABLE_REAL_GIT,
    "git",
    "/bin/git",
    "/usr/bin/git",
    "/usr/local/bin/git",
  ].filter(Boolean);
  for (const bin of candidates) {
    try {
      const cmd = command.replace(/^git\b/, bin);
      const out = execSync(cmd, {
        cwd: rootDir,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim();
      if (out) return out;
    } catch {
      // try next candidate
    }
  }
  return "unknown";
}

function previousCommitSha() {
  // Last-resort fallback: preserve the SHA already committed to
  // public/release.json so the live site never regresses to "unknown".
  try {
    const prev = JSON.parse(readFileSync(path.join(rootDir, "public", "release.json"), "utf8"));
    if (typeof prev?.commitSha === "string" && prev.commitSha && prev.commitSha !== "unknown") {
      return prev.commitSha;
    }
  } catch {}
  return null;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() && value.trim() !== "0.0.0") {
      return value.trim();
    }
  }

  return "";
}

function calendarVersion(date) {
  return `${date.getUTCFullYear()}.${date.getUTCMonth() + 1}.${date.getUTCDate()}`;
}

function resolveVersion(packageVersion, buildDate) {
  const explicitVersion = firstNonEmpty(
    process.env.RELEASE_VERSION,
    process.env.APP_VERSION,
    process.env.npm_package_version,
  );

  if (explicitVersion) return explicitVersion;
  if (packageVersion && packageVersion !== "0.0.0") return packageVersion;

  return calendarVersion(buildDate);
}

function resolveCommitSha() {
  const envCommit = firstNonEmpty(
    process.env.VITE_COMMIT_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.CF_PAGES_COMMIT_SHA,
    process.env.GITHUB_SHA,
    process.env.CI_COMMIT_SHA,
    process.env.COMMIT_SHA,
    process.env.GIT_COMMIT,
    process.env.SOURCE_COMMIT,
    process.env.LOVABLE_GIT_COMMIT_SHA,
    process.env.LOVABLE_COMMIT_SHA,
    process.env.LOVABLE_COMMIT_ID,
    process.env.RAILWAY_GIT_COMMIT_SHA,
    process.env.RENDER_GIT_COMMIT,
  );

  return (envCommit || safeGit("git rev-parse HEAD") || safeGitHead() || "unknown").slice(0, 12);
}

function detectDeployTarget() {
  if (process.env.VERCEL) return "vercel";
  if (process.env.CF_PAGES) return "cloudflare-pages";
  if (process.env.GITHUB_ACTIONS) return "github-actions";
  if (
    process.env.LOVABLE_PROJECT_ID ||
    process.env.LOVABLE_ENV ||
    process.env.LOVABLE ||
    process.env.LOVABLE_GIT_COMMIT_SHA ||
    process.env.LOVABLE_COMMIT_SHA
  ) {
    return "lovable";
  }
  return "local";
}

const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const buildDate = new Date();
const version = resolveVersion(packageJson.version, buildDate);
const commitSha = resolveCommitSha();
const shortSha = commitSha.slice(0, 7);
const buildTime = buildDate.toISOString();
const deployTarget = detectDeployTarget();
const releaseStamp = `${version}+${shortSha}`;

const releaseInfo = {
  version,
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
// FedRAMP G-03 (SR-3, SA-12): SBOM files are generated by .github/workflows/release.yml
// on every tagged release (CycloneDX JSON + SPDX JSON) via anchore/sbom-action and
// uploaded to the GitHub Release as downloadable artifacts.
// SBOM artifact names: sbom-<tag>.cyclonedx.json, sbom-<tag>.spdx.json
console.log(`SBOM: generated by release.yml on tagged builds (see GitHub Releases for sbom-*.json artifacts).`);