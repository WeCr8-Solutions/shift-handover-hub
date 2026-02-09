import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
    setIsReporting(true);

    try {
      // Get the latest error if any
      const latestError = errorsRef.current[errorsRef.current.length - 1];

      // Build metadata for the database function
      const metadata = {
        ...PRODUCTION_CONTEXT,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        user_agent: navigator.userAgent,
        recent_errors_count: errorsRef.current.length,
        is_guest_report: !user,
      };

      // Prepare console logs
      const consoleLogs = report.includeConsoleLogs !== false 
        ? logsRef.current.slice(-50).map(log => ({
            level: log.level,
            message: log.message,
            timestamp: log.timestamp,
            stack: log.stack || null
          }))
        : [];

      // If user is authenticated, use the secure RPC function
      if (user) {
        const { data: issueId, error } = await supabase.rpc("report_issue", {
          _title: report.title,
          _description: report.description || null,
          _severity: report.severity || "medium",
          _error_message: latestError?.message || null,
          _error_stack: latestError?.stack || null,
          _console_logs: consoleLogs,
          _page_url: report.includePage !== false ? window.location.href : null,
          _metadata: metadata,
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Issue reported",
          description: "Thank you! Our team has been notified.",
        });

        return { success: true, issue_id: issueId };
      } else {
        // Guest reporting - use edge function that doesn't require auth
        const { data, error } = await supabase.functions.invoke("report-issue", {
          body: {
            title: report.title,
            description: report.description || null,
            severity: report.severity || "medium",
            error_message: latestError?.message || null,
            error_stack: latestError?.stack || null,
            console_logs: consoleLogs,
            page_url: report.includePage !== false ? window.location.href : null,
            metadata: metadata,
          },
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Issue reported",
          description: "Thank you! Our team has been notified. Please try signing in again.",
        });

        return { success: true, issue_id: data?.issue_id };
      }
    } catch (error) {
      console.error("Failed to report issue:", error);
      toast({
        title: "Failed to report issue",
        description: "Please try again later or contact support directly.",
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
