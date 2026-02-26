import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface QuantitySummaryCardProps {
  original: number;
  completed: number;
  scrap: number;
  rework: number;
  open: number;
  locked: boolean;
}

export function QuantitySummaryCard({
  original,
  completed,
  scrap,
  rework,
  open,
  locked,
}: QuantitySummaryCardProps) {
  const total = original || 1;
  const segments = [
    { label: "Completed", value: completed, pct: (completed / total) * 100, className: "bg-green-500" },
    { label: "Scrap", value: scrap, pct: (scrap / total) * 100, className: "bg-red-500" },
    { label: "Rework", value: rework, pct: (rework / total) * 100, className: "bg-amber-500" },
    { label: "Open", value: open, pct: (open / total) * 100, className: "bg-blue-500" },
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quantity Breakdown</span>
          <div className="flex items-center gap-2">
            {locked && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
            <span className="text-sm font-bold">{original} total</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
          {segments.map(
            (seg) =>
              seg.value > 0 && (
                <div
                  key={seg.label}
                  className={`${seg.className} transition-all`}
                  style={{ width: `${seg.pct}%` }}
                  title={`${seg.label}: ${seg.value}`}
                />
              ),
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${seg.className}`} />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="font-medium ml-auto">{seg.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
