import { BrowserWindow, dialog, ipcMain } from "electron";
import * as path from "path";
import * as http from "http";
import * as https from "https";
import { AppConfig, saveConfig } from "./config";

const DEFAULT_CLOUD_URL = "https://jobline.ai";

/**
 * Returns true if the app is running with the default cloud URL and no
 * self-hosted Supabase configured — meaning it has never been configured
 * for enterprise/ITAR use.
 */
export function isUnconfiguredForSelfHosted(config: AppConfig): boolean {
  return config.appUrl === DEFAULT_CLOUD_URL && !config.supabaseUrl;
}

/**
 * Returns true if the config is explicitly in ITAR mode (itar_mode flag).
 * In ITAR mode, connecting to the default cloud URL is blocked.
 */
export function isITARMode(config: AppConfig): boolean {
  return (config as AppConfig & { itar_mode?: boolean }).itar_mode === true;
}

/**
 * Validates that a URL is reachable by attempting a HEAD request.
 * Times out after 8 seconds.
 */
export async function validateUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;
      const req = lib.request(
        { hostname: parsed.hostname, port: parsed.port, path: parsed.pathname, method: "HEAD" },
        () => resolve(true)
      );
      req.setTimeout(8000, () => { req.destroy(); resolve(false); });
      req.on("error", () => resolve(false));
      req.end();
    } catch {
      resolve(false);
    }
  });
}

/**
 * Shows a native Electron setup dialog for first-launch ITAR/self-hosted
 * configuration. Called before createWindow() when the config is unconfigured.
 *
 * Presents a dialog asking whether to use:
 *   (A) Cloud — connect to jobline.ai (default, no config needed)
 *   (B) Self-Hosted — prompt for custom URL and save to config.json
 */
export async function showSetupWizard(
  config: AppConfig,
  onComplete: (updatedConfig: AppConfig) => void
): Promise<void> {
  const choice = dialog.showMessageBoxSync({
    type: "question",
    title: "JobLine AI — First Launch Setup",
    message: "How do you want to connect JobLine AI?",
    detail:
      "Cloud: Connect to jobline.ai (standard setup).\n\n" +
      "Self-Hosted / ITAR: Connect to your organization's private JobLine AI instance. " +
      "Required for ITAR-regulated environments where data must stay on org-controlled infrastructure.",
    buttons: ["Use Cloud (jobline.ai)", "Configure Self-Hosted / ITAR"],
    defaultId: 0,
    cancelId: 0,
  });

  if (choice === 0) {
    // Cloud — use defaults, mark as configured so wizard doesn't show again
    const updated = { ...config, _setupComplete: true } as AppConfig & { _setupComplete: boolean };
    saveConfig(updated);
    onComplete(config);
    return;
  }

  // Self-hosted — open the config UI window
  await showSelfHostedConfigWindow(config, onComplete);
}

/**
 * Opens a small native-HTML config window that collects:
 *   - App URL (required)
 *   - ITAR mode toggle (optional)
 * Then saves to config.json and calls onComplete.
 */
async function showSelfHostedConfigWindow(
  config: AppConfig,
  onComplete: (updatedConfig: AppConfig) => void
): Promise<void> {
  const win = new BrowserWindow({
    width: 560,
    height: 480,
    resizable: false,
    title: "JobLine AI — Self-Hosted Configuration",
    webPreferences: {
      // Setup window loads a trusted data: URL generated from our own code.
      // nodeIntegration is enabled here solely to allow ipcRenderer in the
      // inline HTML config form. This is safe because:
      // 1. No remote URL is loaded (data: only)
      // 2. The window has no internet access intent
      // 3. contextIsolation is still off because the data: URL is our own
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  win.setMenuBarVisibility(false);

  // IPC handler for config submission
  ipcMain.once("jobline:saveSetupConfig", async (_event, data: {
    appUrl: string;
    itarMode: boolean;
  }) => {
    const reachable = await validateUrl(data.appUrl);
    if (!reachable) {
      win.webContents.send("jobline:setupError",
        `Cannot reach ${data.appUrl}. Check the URL and your network connection.`
      );
      return;
    }

    const updated: AppConfig & { itar_mode?: boolean; _setupComplete?: boolean } = {
      ...config,
      appUrl: data.appUrl,
      apiBaseUrl: data.appUrl,
      itar_mode: data.itarMode,
      _setupComplete: true,
    };
    saveConfig(updated as AppConfig);
    console.log(`[Setup] Self-hosted configured: ${data.appUrl} (ITAR mode: ${data.itarMode})`);
    win.close();
    onComplete(updated as AppConfig);
  });

  win.on("closed", () => {
    // If window closed without completing setup, fall back to cloud
    onComplete(config);
  });

  // Load inline HTML for the setup form
  const html = buildSetupHtml();
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function buildSetupHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Self-Hosted Setup</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f1117; color: #e2e8f0; padding: 28px; }
    h1 { font-size: 16px; font-weight: 600; margin-bottom: 6px; color: #f8fafc; }
    p.sub { font-size: 12px; color: #94a3b8; margin-bottom: 20px; line-height: 1.5; }
    label { display: block; font-size: 12px; font-weight: 500; color: #cbd5e1; margin-bottom: 5px; }
    input[type=text] {
      width: 100%; padding: 8px 12px; border-radius: 6px;
      border: 1px solid #334155; background: #1e293b; color: #f1f5f9;
      font-size: 13px; outline: none; margin-bottom: 16px;
    }
    input[type=text]:focus { border-color: #6366f1; }
    .row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
    .row input[type=checkbox] { margin-top: 2px; width: 15px; height: 15px; cursor: pointer; }
    .row .label-block label { font-size: 13px; color: #e2e8f0; }
    .row .label-block p { font-size: 11px; color: #64748b; margin-top: 2px; }
    .error { font-size: 12px; color: #f87171; margin-bottom: 14px; min-height: 18px; }
    button {
      width: 100%; padding: 10px; border-radius: 6px; border: none;
      background: #6366f1; color: white; font-size: 13px; font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #4f46e5; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <h1>Self-Hosted / ITAR Configuration</h1>
  <p class="sub">
    Enter the URL of your organization's private JobLine AI deployment.
    This URL will be loaded on every launch instead of jobline.ai.
  </p>

  <label for="appUrl">App URL *</label>
  <input type="text" id="appUrl" placeholder="https://app.yourcompany.internal" />

  <div class="row">
    <input type="checkbox" id="itarMode" />
    <div class="label-block">
      <label for="itarMode">ITAR Mode</label>
      <p>Prevents connecting to jobline.ai. Enable for ITAR-regulated environments.</p>
    </div>
  </div>

  <div class="error" id="errorMsg"></div>

  <button id="saveBtn" onclick="save()">Validate & Save Configuration</button>

  <script>
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('jobline:setupError', (_, msg) => {
      document.getElementById('errorMsg').textContent = msg;
      document.getElementById('saveBtn').disabled = false;
      document.getElementById('saveBtn').textContent = 'Validate & Save Configuration';
    });

    function save() {
      const appUrl = document.getElementById('appUrl').value.trim();
      if (!appUrl || !appUrl.startsWith('http')) {
        document.getElementById('errorMsg').textContent = 'Enter a valid URL starting with https://';
        return;
      }
      document.getElementById('errorMsg').textContent = 'Validating connection…';
      document.getElementById('saveBtn').disabled = true;
      document.getElementById('saveBtn').textContent = 'Checking…';
      const itarMode = document.getElementById('itarMode').checked;
      ipcRenderer.send('jobline:saveSetupConfig', { appUrl, itarMode });
    }
  </script>
</body>
</html>`;
}
