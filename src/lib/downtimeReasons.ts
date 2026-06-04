/**
 * Default downtime reason taxonomy. Orgs can override / extend via
 * `org_downtime_reasons` table; this serves as a fallback when no rows exist.
 */
export interface DowntimeReason {
  code: string;
  label: string;
  category: "machine" | "material" | "tooling" | "quality" | "people" | "process" | "other";
  sort_order: number;
}

export const DEFAULT_DOWNTIME_REASONS: DowntimeReason[] = [
  { code: "tool_break", label: "Tool Break / Wear", category: "tooling", sort_order: 10 },
  { code: "tool_change", label: "Tool Change", category: "tooling", sort_order: 20 },
  { code: "material_shortage", label: "Material Shortage", category: "material", sort_order: 30 },
  { code: "material_defect", label: "Material Defect", category: "material", sort_order: 40 },
  { code: "machine_alarm", label: "Machine Alarm / Fault", category: "machine", sort_order: 50 },
  { code: "scheduled_maintenance", label: "Scheduled Maintenance", category: "machine", sort_order: 60 },
  { code: "unplanned_maintenance", label: "Unplanned Maintenance", category: "machine", sort_order: 70 },
  { code: "awaiting_qa", label: "Awaiting QA / Inspection", category: "quality", sort_order: 80 },
  { code: "first_article", label: "First Article Inspection", category: "quality", sort_order: 90 },
  { code: "rework", label: "Rework", category: "quality", sort_order: 100 },
  { code: "setup", label: "Setup / Changeover", category: "process", sort_order: 110 },
  { code: "program_load", label: "Program Load / Verify", category: "process", sort_order: 120 },
  { code: "operator_break", label: "Operator Break", category: "people", sort_order: 130 },
  { code: "no_operator", label: "No Operator Available", category: "people", sort_order: 140 },
  { code: "no_work", label: "No Work / Awaiting Schedule", category: "process", sort_order: 150 },
  { code: "other", label: "Other", category: "other", sort_order: 999 },
];

export function findReasonLabel(
  code: string | null | undefined,
  reasons: { code: string; label: string }[],
): string {
  if (!code) return "Uncategorized";
  return reasons.find((r) => r.code === code)?.label ?? code;
}
