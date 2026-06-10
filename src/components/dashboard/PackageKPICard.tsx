import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package as PackageIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { usePackages, type WorkOrderPackage } from "@/hooks/usePackages";

/**
 * Pure helper — exported for unit tests. Computes on-time-ship %, open count,
 * and at-risk count (open packages whose required ship date is in the past).
 */
export function computePackageKPIs(packages: WorkOrderPackage[], now: Date = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const shipped = packages.filter((p) => p.status === "shipped" && p.actual_ship_date);
  const onTime = shipped.filter(
    (p) =>
      !p.required_ship_date ||
      (p.actual_ship_date && p.actual_ship_date <= p.required_ship_date),
  );
  const open = packages.filter(
    (p) => p.status !== "shipped" && p.status !== "closed" && p.status !== "cancelled",
  );
  const atRisk = open.filter((p) => {
    if (!p.required_ship_date) return false;
    return new Date(p.required_ship_date) < today;
  });

  return {
    shippedCount: shipped.length,
    onTimeCount: onTime.length,
    openCount: open.length,
    atRiskCount: atRisk.length,
    onTimeRate: shipped.length === 0 ? null : Math.round((onTime.length / shipped.length) * 100),
  };
}

export function PackageKPICard() {
  const { packages, loading } = usePackages({ includeClosed: true });
  const kpi = useMemo(() => computePackageKPIs(packages), [packages]);

  if (loading && packages.length === 0) return null;
  if (!loading && packages.length === 0) return null;

  return (
    <Card data-testid="package-kpi-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <PackageIcon className="w-4 h-4 text-primary" />
          Package Shipments
          <Link to="/packages" className="ml-auto text-xs font-normal text-primary hover:underline">
            View all
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Open" value={kpi.openCount} />
          <Stat label="Shipped" value={kpi.shippedCount} icon={CheckCircle2} tone="success" />
          <Stat
            label="On-time"
            value={kpi.onTimeRate == null ? "—" : `${kpi.onTimeRate}%`}
            tone={kpi.onTimeRate != null && kpi.onTimeRate < 80 ? "warn" : "default"}
          />
          <Stat
            label="At risk"
            value={kpi.atRiskCount}
            icon={kpi.atRiskCount > 0 ? AlertTriangle : undefined}
            tone={kpi.atRiskCount > 0 ? "warn" : "default"}
          />
        </div>
        {kpi.atRiskCount > 0 && (
          <Badge variant="destructive" className="mt-3 text-[10px]">
            {kpi.atRiskCount} package{kpi.atRiskCount === 1 ? "" : "s"} past required ship date
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warn";
}) {
  const toneClass =
    tone === "success" ? "text-state-running" : tone === "warn" ? "text-state-down" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold flex items-center gap-1 ${toneClass}`}>
        {Icon && <Icon className="w-4 h-4" />}
        {value}
      </div>
    </div>
  );
}
