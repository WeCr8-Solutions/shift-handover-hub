import { spawnSync } from "node:child_process";

const args = [
  "playwright",
  "test",
  "e2e/demo-dashboard-handoff.spec.ts",
  "--workers=1",
  "--reporter=line",
  ...process.argv.slice(2),
];

const result = spawnSync("npx", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    PW_CAPTURE_DEMO: "1",
  },
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);