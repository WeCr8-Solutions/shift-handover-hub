import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsSkeletonProps {
  /** Number of skeleton card rows to render (default: 3) */
  rows?: number;
}

/**
 * Consistent loading skeleton for settings tabs.
 * Replaces ad-hoc skeleton/spinner implementations across settings components.
 */
export function SettingsSkeleton({ rows = 3 }: SettingsSkeletonProps) {
  return (
    <div className="space-y-4 py-6">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-4 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
