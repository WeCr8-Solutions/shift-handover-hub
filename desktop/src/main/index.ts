import { app, BrowserWindow, shell, ipcMain } from "electron";
import * as path from "path";
import { loadConfig, getConfigDir } from "./config";
import { initLogger, getLogsPath } from "./logger";

// ---------------------------------------------------------------------------
// Single instance lock
// ---------------------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ---------------------------------------------------------------------------
// Config & logging
// ---------------------------------------------------------------------------
let config = loadConfig();
initLogger(config.logsPath);

console.log("JobLine AI Desktop starting…");
console.log(`Mode: ${config.mode}`);
console.log(`App URL: ${config.appUrl}`);

// ---------------------------------------------------------------------------
// Allowlisted external domains (open in system browser)
// ---------------------------------------------------------------------------
const ALLOWED_EXTERNAL_DOMAINS = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "github.com",
  "supabase.co",
  "jobline.ai",
  "stripe.com",
  "docs.jobline.ai",
];

function isAllowedExternal(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_EXTERNAL_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Create main window
// ---------------------------------------------------------------------------
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "JobLine AI",
    icon: path.join(__dirname, "..", "..", "assets", "icons", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
    show: false,
  });

  // Show when ready to avoid white flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Load the hosted app
  mainWindow.loadURL(config.appUrl);

  // Block unwanted popups — open allowed URLs in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternal(url)) {
      shell.openExternal(url);
    } else {
      console.warn(`Blocked popup: ${url}`);
    }
    return { action: "deny" };
  });

  // Intercept navigation to external domains
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const appHost = new URL(config.appUrl).hostname;
    try {
      const navHost = new URL(url).hostname;
      if (navHost !== appHost && !navHost.endsWith(`.${appHost}`)) {
        event.preventDefault();
        if (isAllowedExternal(url)) {
          shell.openExternal(url);
        } else {
          console.warn(`Blocked navigation: ${url}`);
        }
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// IPC handlers (used by preload bridge)
// ---------------------------------------------------------------------------
ipcMain.handle("jobline:getVersion", () => app.getVersion());

ipcMain.handle("jobline:openExternal", (_event, url: string) => {
  if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
    shell.openExternal(url);
  }
});

ipcMain.handle("jobline:openPath", (_event, pathType: string) => {
  switch (pathType) {
    case "logs":
      shell.openPath(getLogsPath());
      break;
    case "config":
      shell.openPath(getConfigDir());
      break;
    default:
      console.warn(`Unknown path type: ${pathType}`);
  }
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
