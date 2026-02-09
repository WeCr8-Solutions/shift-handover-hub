import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Wrench, FileText, Activity, Briefcase } from "lucide-react";
import { SystemStats } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStatsCardsProps {
  stats: SystemStats;
  loading: boolean;
}

export function AdminStatsCards({ stats, loading }: AdminStatsCardsProps) {
  const statCards = [
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
