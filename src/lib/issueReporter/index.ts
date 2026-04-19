/**
 * Public API for the issue-reporter subsystem.
 */
export { issueReporterRegistry } from "./registry";
export type { ModuleContextSnapshot, ModuleContextProvider } from "./registry";
export { breadcrumbs } from "./breadcrumbs";
export type { Breadcrumb, BreadcrumbCategory } from "./breadcrumbs";
export { installNetworkCapture } from "./captures/network";
export { installInteractionCapture } from "./captures/interactions";
export { useNavigationCapture } from "./captures/navigation";

import { installNetworkCapture } from "./captures/network";
import { installInteractionCapture } from "./captures/interactions";

/** Install passive captures once at app boot. */
export function bootIssueReporter() {
  installNetworkCapture();
  installInteractionCapture();
}
