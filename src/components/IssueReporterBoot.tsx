import { useEffect } from "react";
import { bootIssueReporter, useNavigationCapture } from "@/lib/issueReporter";
import { installOutboundLinkTracker } from "@/lib/outboundLinkTracker";

/**
 * Mounts inside <BrowserRouter> to install passive captures (network +
 * interactions + outbound link analytics) once, and to track navigation
 * breadcrumbs. Renders nothing.
 */
export function IssueReporterBoot() {
  useNavigationCapture();
  useEffect(() => {
    bootIssueReporter();
    installOutboundLinkTracker();
  }, []);
  return null;
}
