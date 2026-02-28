import { contextBridge, ipcRenderer } from "electron";

/**
 * Preload bridge — exposes a minimal, safe API to the renderer (web app).
 *
 * Available at: window.jobline
 *
 * Security:
 * - No fs / child_process / net access
 * - All calls go through ipcRenderer.invoke (async, sandboxed)
 */
contextBridge.exposeInMainWorld("jobline", {
  /** Returns the desktop app version from package.json */
  getVersion: (): Promise<string> => ipcRenderer.invoke("jobline:getVersion"),

  /** Opens a URL in the system's default browser */
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("jobline:openExternal", url),

  /** Opens the logs or config folder in the file explorer */
  openPath: (pathType: "logs" | "config"): Promise<void> => ipcRenderer.invoke("jobline:openPath", pathType),
});
