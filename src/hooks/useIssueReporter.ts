import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { issueReporterRegistry, breadcrumbs } from "@/lib/issueReporter";

interface ConsoleLog {
  level: "log" | "warn" | "error" | "info" | "debug";
  message: string;
  timestamp: string;
  stack?: string;
}

interface IssueReport {
  title: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  includeConsoleLogs?: boolean;
  includePage?: boolean;
}

interface RuntimeError {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: string;
}

const MAX_CONSOLE_LOGS = 100;
const MAX_ERRORS = 20;

// Production context (would be injected at build time in real deployment)
const PRODUCTION_CONTEXT = {
  app_version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  build_id: import.meta.env.VITE_BUILD_ID || "dev",
  commit_hash: import.meta.env.VITE_COMMIT_HASH || "local",
  environment: import.meta.env.MODE || "development",
};

export function useIssueReporter() {
  const { user } = useAuth();
  const [isReporting, setIsReporting] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [runtimeErrors, setRuntimeErrors] = useState<RuntimeError[]>([]);
  const logsRef = useRef<ConsoleLog[]>([]);
  const errorsRef = useRef<RuntimeError[]>([]);

  // Capture console logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    const captureLog = (level: ConsoleLog["level"]) => (...args: unknown[]) => {
      // Call original
      originalConsole[level](...args);

      // Capture log
      const log: ConsoleLog = {
        level,
        message: args.map((arg) => {
          try {
            return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
          } catch {
            return String(arg);
          }
        }).join(" "),
        timestamp: new Date().toISOString(),
      };

      // If it's an error with a stack, capture it
      if (level === "error" && args[0] instanceof Error) {
        log.stack = (args[0] as Error).stack;
      }

      logsRef.current = [...logsRef.current.slice(-MAX_CONSOLE_LOGS + 1), log];
      setConsoleLogs(logsRef.current);
    };

    console.log = captureLog("log");
    console.warn = captureLog("warn");
    console.error = captureLog("error");
    console.info = captureLog("info");
    console.debug = captureLog("debug");

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    };
  }, []);

  // Capture runtime errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error: RuntimeError = {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
      };

      errorsRef.current = [...errorsRef.current.slice(-MAX_ERRORS + 1), error];
      setRuntimeErrors(errorsRef.current);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error: RuntimeError = {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      };

      errorsRef.current = [...errorsRef.current.slice(-MAX_ERRORS + 1), error];
      setRuntimeErrors(errorsRef.current);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const reportIssue = useCallback(async (report: IssueReport) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report an issue. If you're having trouble signing in, contact support@joblineai.com",
        variant: "destructive",
      });
      return { success: false, error: "Not authenticated" };
    }

    setIsReporting(true);

    try {
      // Get the latest error if any
      const latestError = errorsRef.current[errorsRef.current.length - 1];

      // Snapshot active modules from the registry (page-aware context)
      const activeModules = issueReporterRegistry.snapshot();
      const recentBreadcrumbs = breadcrumbs.snapshot();

      // Build metadata for the database function
      const metadata = {
        ...PRODUCTION_CONTEXT,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        device_pixel_ratio: window.devicePixelRatio,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        user_agent: navigator.userAgent,
        recent_errors_count: errorsRef.current.length,
        // Registry-driven, page-aware context
        active_modules: activeModules,
        breadcrumbs: recentBreadcrumbs,
        breadcrumb_count: recentBreadcrumbs.length,
      };

      // Prepare and sanitize console logs to prevent leaking secrets
      const sanitizeLogMessage = (msg: string): string =>
        msg
          .replace(/bearer\s+[\w\-.]+/gi, 'bearer [REDACTED]')
          .replace(/(api[_-]?key|token|secret|password|authorization)["']?\s*[:=]\s*["']?[\w\-.]+/gi, '$1=[REDACTED]')
          .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[JWT_REDACTED]');

      const consoleLogs = report.includeConsoleLogs !== false 
        ? logsRef.current.slice(-50).map(log => ({
            level: log.level,
            message: sanitizeLogMessage(log.message),
            timestamp: log.timestamp,
            stack: log.stack ? sanitizeLogMessage(log.stack) : null
          }))
        : [];

      // Use direct database function call (much faster than Edge Function)
      const { data: issueId, error } = await supabase.rpc("report_issue", {
        _title: report.title,
        _description: report.description || undefined,
        _severity: report.severity || "medium",
        _error_message: latestError?.message || undefined,
        _error_stack: latestError?.stack || undefined,
        _console_logs: JSON.parse(JSON.stringify(consoleLogs)),
        _page_url: report.includePage !== false ? window.location.href : undefined,
        _metadata: JSON.parse(JSON.stringify(metadata)),
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Issue reported",
        description: "Thank you! Our team has been notified.",
      });

      return { success: true, issue_id: issueId };
    } catch (error) {
      console.error("Failed to report issue:", error);
      toast({
        title: "Failed to report issue",
        description: "Please try again later or contact support@joblineai.com",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsReporting(false);
    }
  }, [user]);

  const reportError = useCallback(async (error: Error, context?: string) => {
    if (!user) return { success: false, error: "Not authenticated" };

    return reportIssue({
      title: `Runtime Error: ${error.message.slice(0, 100)}`,
      description: context || "Automatically captured runtime error",
      severity: "high",
      includeConsoleLogs: true,
      includePage: true,
    });
  }, [user, reportIssue]);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    errorsRef.current = [];
    setConsoleLogs([]);
    setRuntimeErrors([]);
  }, []);

  return {
    reportIssue,
    reportError,
    clearLogs,
    isReporting,
    consoleLogs,
    runtimeErrors,
    hasErrors: runtimeErrors.length > 0,
    productionContext: PRODUCTION_CONTEXT,
  };
}
