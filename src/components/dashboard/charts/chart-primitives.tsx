import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

// ─── Shared Chart Config ───────────────────────────────────

export const CHART_AXIS_STYLE = {
  fontSize: 10,
  fill: "hsl(var(--muted-foreground))",
} as const;

export const CHART_GRID_PROPS = {
  strokeDasharray: "3 3",
  stroke: "hsl(var(--border))",
  opacity: 0.3,
} as const;

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

export const CHART_AXIS_LINE = { stroke: "hsl(var(--border))" };

// ─── Helpers ───────────────────────────────────────────────

export function truncateLabel(label: string, maxLen = 14): string {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + "…" : label;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function safeAdd(a: number, b: number | null | undefined): number {
  return a + (Number(b) || 0);
}

// ─── Reusable Components ──────────────────────────────────

interface ChartEmptyStateProps {
  message: string;
}

export function ChartEmptyState({ message }: ChartEmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

interface ChartContainerProps {
  subtitle: string;
  children: React.ReactNode;
}

export function ChartContainer({ subtitle, children }: ChartContainerProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      {children}
    </div>
  );
}

interface ScrollableChartWrapperProps {
  minWidth: number;
  children: React.ReactNode;
}

export function ScrollableChartWrapper({ minWidth, children }: ScrollableChartWrapperProps) {
  return (
    <div className="overflow-x-auto scrollbar-none">
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}

// ─── Stat Chip ─────────────────────────────────────────────

interface StatChipProps {
  icon?: LucideIcon;
  dotColor?: string;
  label: string;
  value: string;
  valueClass?: string;
}

export function StatChip({ icon: Icon, dotColor, label, value, valueClass }: StatChipProps) {
  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shrink-0">
      {Icon && <Icon className={cn("w-3.5 h-3.5 shrink-0", valueClass)} aria-hidden="true" />}
      {!Icon && dotColor && (
        <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} aria-hidden="true" />
      )}
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <span className={cn("text-sm font-bold font-mono", valueClass)}>{value}</span>
    </div>
  );
}

// ─── Toggle Chip Group ─────────────────────────────────────

interface ToggleChipGroupProps<T extends string> {
  items: readonly { readonly key: T; readonly label: string; readonly icon?: LucideIcon }[];
  value: T;
  onChange: (key: T) => void;
  ariaLabel: string;
  showIcon?: boolean;
}

export function ToggleChipGroup<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  showIcon = false,
}: ToggleChipGroupProps<T>) {
  return (
    <div className="w-full min-w-0 overflow-x-auto pb-1 -mb-1 scrollbar-none">
      <div
        className="inline-flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5"
        role="group"
        aria-label={ariaLabel}
      >
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              value === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={value === key}
          >
            {showIcon && Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
