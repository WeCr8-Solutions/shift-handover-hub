import { Card, CardContent } from "@/components/ui/card";
import { ListTodo, Clock, PlayCircle, CheckCircle2, AlertTriangle, Target, Trash2, RotateCcw } from "lucide-react";

interface QueueStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    scrapRate?: number;
    reworkRate?: number;
    fpy?: number;
  };
}

export function QueueStatsCards({ stats }: QueueStatsCardsProps) {
  const cards = [
    {
      label: "Total Items",
      value: stats.total,
      icon: ListTodo,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: PlayCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  // Add quality metrics if available
  const qualityCards = [];
  if (stats.fpy !== undefined) {
    qualityCards.push({
      label: "First Pass Yield",
      value: `${stats.fpy.toFixed(1)}%`,
      icon: Target,
      color: stats.fpy >= 95 ? "text-green-600" : stats.fpy >= 85 ? "text-yellow-600" : "text-red-600",
      bgColor: stats.fpy >= 95 ? "bg-green-100 dark:bg-green-900/20" : stats.fpy >= 85 ? "bg-yellow-100 dark:bg-yellow-900/20" : "bg-red-100 dark:bg-red-900/20",
    });
  }
  if (stats.scrapRate !== undefined && stats.scrapRate > 0) {
    qualityCards.push({
      label: "Scrap Rate",
      value: `${stats.scrapRate.toFixed(1)}%`,
      icon: Trash2,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    });
  }
  if (stats.reworkRate !== undefined && stats.reworkRate > 0) {
    qualityCards.push({
      label: "Rework Rate",
      value: `${stats.reworkRate.toFixed(1)}%`,
      icon: RotateCcw,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
    });
  }

  const allCards = [...cards, ...qualityCards];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {allCards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
