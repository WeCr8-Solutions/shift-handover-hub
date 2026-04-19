import { useEffect } from "react";
import { bootIssueReporter, useNavigationCapture } from "@/lib/issueReporter";

/**
 * Mounts inside <BrowserRouter> to install passive captures (network +
 * interactions) once and to track navigation breadcrumbs. Renders nothing.
 */
export function IssueReporterBoot() {
  useNavigationCapture();
  useEffect(() => {
    bootIssueReporter();
  }, []);
  return null;
}
