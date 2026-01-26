import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CoverageData {
  lines: number;
  statements: number;
  branches: number;
  functions: number;
}

interface TestCoverageCardProps {
  coverage: CoverageData;
}

function getCoverageColor(value: number): string {
  if (value >= 80) return "text-green-600";
  if (value >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getCoverageProgressColor(value: number): string {
  if (value >= 80) return "bg-green-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

export function TestCoverageCard({ coverage }: TestCoverageCardProps) {
  const metrics = [
    { label: "Lines", value: coverage.lines },
    { label: "Statements", value: coverage.statements },
    { label: "Branches", value: coverage.branches },
    { label: "Functions", value: coverage.functions },
  ];

  const averageCoverage = Math.round(
    (coverage.lines + coverage.statements + coverage.branches + coverage.functions) / 4
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Code Coverage</CardTitle>
            <CardDescription>Overall test coverage metrics</CardDescription>
          </div>
          <div className={cn("text-2xl font-bold", getCoverageColor(averageCoverage))}>
            {averageCoverage}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className={cn("font-medium", getCoverageColor(metric.value))}>
                {metric.value}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-500", getCoverageProgressColor(metric.value))}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
