import { useState, useEffect } from "react";
import { OrganizationWithStats } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, Crown, Users, Building2, Wrench, Plug, Gift, Trash2, Mail, Calendar, Shield } from "lucide-react";

interface OrgMember {
  user_id: string;
  role: string;
  display_name: string | null;
  email: string | null;
  joined_at: string;
}

interface OrgTeam {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count: number;
}

interface OrgStation {
  id: string;
  name: string;
  station_id: string;
  work_center_type: string;
  is_active: boolean;
  team_name: string | null;
}

interface OrgDetailViewProps {
  org: OrganizationWithStats;
  onBack: () => void;
  isPlatformAdmin: boolean;
  onDelete: (org: OrganizationWithStats) => void;
  onGrant: (org: OrganizationWithStats) => void;
  erpStatus?: { status: string; vendor: string } | null;
}

export function OrgDetailView({ org, onBack, isPlatformAdmin, onDelete, onGrant, erpStatus }: OrgDetailViewProps) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [teams, setTeams] = useState<OrgTeam[]>([]);
  const [stations, setStations] = useState<OrgStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchOrgData = async () => {
      setLoading(true);
      const [membersRes, teamsRes, stationsRes] = await Promise.all([
        supabase
          .from("organization_members")
          .select("user_id, role, joined_at, profiles:user_id(display_name, email)")
          .eq("organization_id", org.id)
          .limit(100),
        supabase
          .from("teams")
          .select("id, name, description, created_at")
          .eq("organization_id", org.id)
          .limit(100),
        supabase
          .from("stations")
          .select("id, name, station_id, work_center_type, is_active, team_id, teams:team_id(name)")
          .eq("organization_id", org.id)
          .limit(100),
      ]);

      if (membersRes.data) {
        setMembers(membersRes.data.map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          display_name: m.profiles?.display_name || null,
          email: m.profiles?.email || null,
          joined_at: m.joined_at,
        })));
      }

      if (teamsRes.data) {
        // Get member counts per team
        const teamIds = teamsRes.data.map(t => t.id);
        const { data: teamMembers } = await supabase
          .from("team_members")
          .select("team_id")
          .in("team_id", teamIds.length > 0 ? teamIds : ["__none__"]);

        const countMap = new Map<string, number>();
        teamMembers?.forEach(tm => {
          countMap.set(tm.team_id, (countMap.get(tm.team_id) || 0) + 1);
        });

        setTeams(teamsRes.data.map(t => ({
          ...t,
          member_count: countMap.get(t.id) || 0,
        })));
      }

      if (stationsRes.data) {
        setStations(stationsRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          station_id: s.station_id,
          work_center_type: s.work_center_type,
          is_active: s.is_active,
          team_name: s.teams?.name || null,
        })));
      }

      setLoading(false);
    };

    fetchOrgData();
  }, [org.id]);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner": return <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-0.5"><Crown className="w-2.5 h-2.5" />Owner</Badge>;
      case "admin": return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5"><Shield className="w-2.5 h-2.5" />Admin</Badge>;
      default: return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 px-2 shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-lg font-bold truncate">{org.name}</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{org.slug}</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {org.subscription_tier || "Free"}
        </Badge>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { icon: Users, label: "Members", value: org.member_count },
          { icon: Building2, label: "Teams", value: org.team_count },
          { icon: Wrench, label: "Stations", value: org.station_count },
          { icon: Calendar, label: "Created", value: new Date(org.created_at).toLocaleDateString(undefined, { month: "short", year: "2-digit" }) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-1.5 sm:p-2 rounded-lg bg-muted/50 text-center">
            <Icon className="w-3 h-3 sm:w-4 sm:h-4 mx-auto text-muted-foreground" />
            <p className="text-sm sm:text-lg font-bold mt-0.5">{value}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Owner & ERP Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="p-2 sm:p-3 rounded-lg border bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 min-w-0">
            <Crown className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground">Owner</p>
              <p className="text-xs sm:text-sm font-medium truncate">{org.owner_name || "Unassigned"}</p>
              {org.owner_email && <p className="text-[10px] text-muted-foreground truncate">{org.owner_email}</p>}
            </div>
          </div>
        </div>
        <div className="p-2 sm:p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <Plug className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground">ERP</p>
              {erpStatus ? (
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{erpStatus.vendor}</Badge>
                  <Badge variant={erpStatus.status === "connected" ? "secondary" : "destructive"} className="text-[10px] px-1 py-0">{erpStatus.status}</Badge>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Not configured</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for detailed data */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full h-8 sm:h-9">
          <TabsTrigger value="overview" className="text-xs flex-1 px-1.5">Overview</TabsTrigger>
          <TabsTrigger value="members" className="text-xs flex-1 px-1.5">Members ({org.member_count})</TabsTrigger>
          <TabsTrigger value="teams" className="text-xs flex-1 px-1.5">Teams ({org.team_count})</TabsTrigger>
          <TabsTrigger value="stations" className="text-xs flex-1 px-1.5">Stations ({org.station_count})</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="space-y-3 mt-2">
              <Card>
                <CardHeader className="px-3 py-2 sm:px-4 sm:py-3">
                  <CardTitle className="text-sm">Subscription</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 sm:px-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs sm:text-sm font-bold">{org.subscription_tier || "Free"}</p>
                      <p className="text-[10px] text-muted-foreground">Plan</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs sm:text-sm font-bold">{org.subscription_status || "N/A"}</p>
                      <p className="text-[10px] text-muted-foreground">Status</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs sm:text-sm font-bold">{new Date(org.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-muted-foreground">Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isPlatformAdmin && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs flex-1"
                    onClick={() => onGrant(org)}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Grant Complimentary
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(org)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Org
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="mt-2">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No members found</p>
              ) : (
                <div className="space-y-1.5">
                  {members.map((m) => (
                    <div key={m.user_id} className="flex items-center gap-2 p-2 rounded-lg border bg-card min-w-0">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10">
                          {getInitials(m.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{m.display_name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <div className="shrink-0">{getRoleBadge(m.role)}</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="teams" className="mt-2">
              {teams.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No teams found</p>
              ) : (
                <div className="space-y-1.5">
                  {teams.map((t) => (
                    <div key={t.id} className="p-2 sm:p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium truncate">{t.name}</p>
                          {t.description && <p className="text-[10px] text-muted-foreground truncate">{t.description}</p>}
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 ml-2">
                          <Users className="w-2.5 h-2.5 mr-0.5" />
                          {t.member_count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stations" className="mt-2">
              {stations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No stations found</p>
              ) : (
                <div className="space-y-1.5">
                  {stations.map((s) => (
                    <div key={s.id} className="p-2 rounded-lg border bg-card">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium truncate">{s.name}</p>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.is_active ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {s.work_center_type}{s.team_name ? ` · ${s.team_name}` : ""}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                          {s.station_id}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
