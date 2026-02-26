import { Card, CardContent } from "@/components/ui/card";
import { computeQualityMetrics } from "@/lib/ncrUtils";
import { TrendingUp, TrendingDown, Trash2, RefreshCw, Target } from "lucide-react";

interface QualityMetricsDashboardProps {
  items: Array<{
    qty_original?: number | null;
    qty_completed?: number | null;
    qty_scrap?: number | null;
    qty_rework?: number | null;
    is_rework?: boolean | null;
  }>;
}

export function QualityMetricsDashboard({ items }: QualityMetricsDashboardProps) {
  const metrics = computeQualityMetrics(items);

  const cards = [
    {
      label: "First Pass Yield",
      value: `${metrics.firstPassYieldPct.toFixed(1)}%`,
      icon: Target,
      color: metrics.firstPassYieldPct >= 95 ? "text-green-600" : metrics.firstPassYieldPct >= 85 ? "text-amber-600" : "text-red-600",
      bgColor: metrics.firstPassYieldPct >= 95 ? "bg-green-100 dark:bg-green-900/20" : metrics.firstPassYieldPct >= 85 ? "bg-amber-100 dark:bg-amber-900/20" : "bg-red-100 dark:bg-red-900/20",
    },
    {
      label: "Scrap Rate",
      value: `${metrics.scrapRatePct.toFixed(1)}%`,
      subValue: `${metrics.totalScrap} pcs`,
      icon: Trash2,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
    {
      label: "Rework Rate",
      value: `${metrics.reworkRatePct.toFixed(1)}%`,
      subValue: `${metrics.totalRework} pcs`,
      icon: RefreshCw,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
    },
  ];

  if (metrics.totalOriginal === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                {(card as any).subValue && (
                  <p className="text-xs text-muted-foreground">{(card as any).subValue}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
