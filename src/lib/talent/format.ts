/**
 * Format an ISO date string ("YYYY-MM-DD" or full ISO) into a short, human label.
 * Returns "—" for null/empty input.
 */
export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/** "Jan 2022 – Present" / "Jan 2020 – Mar 2022" */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent = false,
): string {
  const s = formatMonthYear(start);
  const e = isCurrent ? "Present" : formatMonthYear(end);
  return `${s} – ${e}`;
}
