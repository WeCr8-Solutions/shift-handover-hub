import * as path from "path";
import * as fs from "fs";
import { app } from "electron";

export interface AppConfig {
  mode: "cloud" | "embedded";
  appUrl: string;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  updateChannel: "stable" | "beta";
  logsPath: string;
}

const CONFIG_DIR = path.join(app.getPath("userData")); // %APPDATA%/JobLine AI
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: AppConfig = {
  mode: "cloud",
  appUrl: "https://app.jobline.ai",
  apiBaseUrl: "https://api.jobline.ai",
  supabaseUrl: "",
  supabaseAnonKey: "",
  updateChannel: "stable",
  logsPath: path.join(CONFIG_DIR, "logs"),
};

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadConfig(): AppConfig {
  ensureDir(CONFIG_DIR);

  let fileConfig: Partial<AppConfig> = {};

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      fileConfig = JSON.parse(raw);
    } catch {
      // Corrupted config — use defaults
    }
  } else {
    // Write default config for user reference
    saveConfig(DEFAULT_CONFIG);
  }

  // Merge: defaults < file < env vars
  const config: AppConfig = {
    ...DEFAULT_CONFIG,
    ...fileConfig,
  };

  // Environment variable overrides (lower precedence than config.json; useful for
  // enterprise/ITAR deployments where admins set machine-wide env vars)
  if (process.env.JOBLINE_APP_URL)        config.appUrl        = process.env.JOBLINE_APP_URL;
  if (process.env.JOBLINE_API_BASE_URL)   config.apiBaseUrl    = process.env.JOBLINE_API_BASE_URL;
  if (process.env.JOBLINE_LOGS_PATH)      config.logsPath      = process.env.JOBLINE_LOGS_PATH;
  if (process.env.JOBLINE_SUPABASE_URL)   config.supabaseUrl   = process.env.JOBLINE_SUPABASE_URL;
  if (process.env.JOBLINE_SUPABASE_ANON_KEY) config.supabaseAnonKey = process.env.JOBLINE_SUPABASE_ANON_KEY;
  if (process.env.JOBLINE_MODE === "embedded" || process.env.JOBLINE_MODE === "cloud") {
    config.mode = process.env.JOBLINE_MODE;
  }
  if (process.env.JOBLINE_UPDATE_CHANNEL === "beta" || process.env.JOBLINE_UPDATE_CHANNEL === "stable") {
    config.updateChannel = process.env.JOBLINE_UPDATE_CHANNEL;
  }

  // Ensure logs directory exists
  ensureDir(config.logsPath);

  return config;
}

export function saveConfig(config: AppConfig): void {
  ensureDir(CONFIG_DIR);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
