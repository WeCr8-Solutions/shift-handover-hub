import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Wrench, FileText, Activity, Briefcase, Radio, RefreshCw } from "lucide-react";
import { SystemStats } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminStatsCardsProps {
  stats: SystemStats;
  loading: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  hasPlatformAccess?: boolean;
}

export function AdminStatsCards({ stats, loading, lastUpdated, onRefresh, hasPlatformAccess = false }: AdminStatsCardsProps) {
  // Platform admins/developers see full global stats; org-scoped users see simplified view
  const platformStatCards = [
    {
      title: "Organizations",
      value: stats.totalOrganizations,
      icon: Briefcase,
      description: "Enterprise buckets",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered operators",
    },
    {
      title: "Teams",
      value: stats.totalTeams,
      icon: Building2,
      description: "Across all orgs",
    },
    {
      title: "Stations",
      value: `${stats.activeStations}/${stats.totalStations}`,
      icon: Wrench,
      description: "Active / Total",
    },
    {
      title: "Total Handoffs",
      value: stats.totalHandoffs,
      icon: FileText,
      description: "All time records",
    },
    {
      title: "Today's Activity",
      value: stats.handoffsToday,
      icon: Activity,
      description: "Handoffs submitted",
    },
  ];

  const orgScopedStatCards = [
    {
      title: "Stations",
      value: `${stats.activeStations}/${stats.totalStations}`,
      icon: Wrench,
      description: "Active / Total",
    },
    {
      title: "Teams",
      value: stats.totalTeams,
      icon: Building2,
      description: "Your organization",
    },
    {
      title: "Today's Activity",
      value: stats.handoffsToday,
      icon: Activity,
      description: "Handoffs submitted",
    },
  ];

  const statCards = hasPlatformAccess ? platformStatCards : orgScopedStatCards;

  if (loading && !lastUpdated) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatLastUpdated = (date?: Date) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 10) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-2">
      {/* Live Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/30">
            <Radio className="w-3 h-3 animate-pulse" />
            Live Data
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {formatLastUpdated(lastUpdated)}
          </span>
          {loading && (
            <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>
        {onRefresh && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh now</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-2 ${hasPlatformAccess ? 'md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-3'} gap-3`}>
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
