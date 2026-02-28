import * as fs from "fs";
import * as path from "path";

let logStream: fs.WriteStream | null = null;
let logsPath = "";

export function initLogger(configuredLogsPath: string): void {
  logsPath = configuredLogsPath;

  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
  }

  const logFile = path.join(logsPath, `jobline-${formatDate()}.log`);
  logStream = fs.createWriteStream(logFile, { flags: "a" });

  // Redirect console to file as well
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: unknown[]) => {
    write("INFO", args);
    originalLog.apply(console, args);
  };

  console.error = (...args: unknown[]) => {
    write("ERROR", args);
    originalError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    write("WARN", args);
    originalWarn.apply(console, args);
  };
}

function write(level: string, args: unknown[]): void {
  if (!logStream) return;
  const timestamp = new Date().toISOString();
  const message = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  logStream.write(`[${timestamp}] [${level}] ${message}\n`);
}

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getLogsPath(): string {
  return logsPath;
}
