import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Building2, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentIssue {
  id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
}

interface OrgActivity {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
}

export function PlatformOverviewTab() {
  const [recentIssues, setRecentIssues] = useState<RecentIssue[]>([]);
  const [activeOrgs, setActiveOrgs] = useState<OrgActivity[]>([]);
  const [platformHealth, setPlatformHealth] = useState<{ score: number; label: string }>({ score: 100, label: "Healthy" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      const [issuesRes, orgsRes, orgMembersRes] = await Promise.all([
        supabase.from("issues").select("id, title, severity, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("organizations").select("id, name, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("organization_members").select("organization_id"),
      ]);

      if (issuesRes.data) setRecentIssues(issuesRes.data);
      
      if (orgsRes.data && orgMembersRes.data) {
        const memberCounts = new Map<string, number>();
        orgMembersRes.data.forEach(m => {
          memberCounts.set(m.organization_id, (memberCounts.get(m.organization_id) || 0) + 1);
        });
        setActiveOrgs(orgsRes.data.map(o => ({
          ...o,
          member_count: memberCounts.get(o.id) || 0,
        })).sort((a, b) => b.member_count - a.member_count));
      }

      // Simple health: degrade if critical issues exist
      const criticals = (issuesRes.data || []).filter(i => i.severity === "critical" && i.status === "open").length;
      if (criticals > 0) {
        setPlatformHealth({ score: Math.max(60, 100 - criticals * 15), label: "Degraded" });
      }

      setLoading(false);
    };
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Health Banner */}
      <Card className={platformHealth.score < 80 ? "border-destructive/50 bg-destructive/5" : "border-primary/30 bg-primary/5"}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {platformHealth.score >= 80 ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-destructive" />
            )}
            <div>
              <p className="font-semibold">Platform Health: {platformHealth.label}</p>
              <p className="text-sm text-muted-foreground">Score: {platformHealth.score}%</p>
            </div>
          </div>
          <Badge variant={platformHealth.score >= 80 ? "default" : "destructive"}>
            {platformHealth.score >= 80 ? "Operational" : "Attention Needed"}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Issues */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4" />
              Recent Issues
            </CardTitle>
            <CardDescription>Latest reported issues across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No issues reported</p>
            ) : (
              <div className="space-y-2">
                {recentIssues.map(issue => (
                  <div key={issue.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant={issue.severity === "critical" ? "destructive" : issue.severity === "high" ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {issue.severity}
                      </Badge>
                      <span className="text-sm truncate">{issue.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">{issue.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Organizations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4" />
              Organizations by Activity
            </CardTitle>
            <CardDescription>Top organizations by member count</CardDescription>
          </CardHeader>
          <CardContent>
            {activeOrgs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No organizations</p>
            ) : (
              <div className="space-y-2">
                {activeOrgs.slice(0, 8).map((org, i) => (
                  <div key={org.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 text-right">#{i + 1}</span>
                      <span className="text-sm font-medium">{org.name}</span>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" />
                      {org.member_count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
