import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRole, useAllUsers } from "@/hooks/useAdminData";
import { ONBOARDING_STEPS, OnboardingStep } from "@/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Loader2, Search, User, Building2, Shield, Crown, UserCog, 
  Eye, Lock, Unlock, CheckCircle2, Circle, AlertTriangle, 
  XCircle, RefreshCw, Map, ChevronRight, Info, ShieldAlert,
  ShieldCheck, Briefcase, Play, Flag, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// User journey state from database
interface UserOnboardingState {
  user_id: string;
  current_step: string;
  completed_steps: string[];
  is_complete: boolean;
  has_seen_welcome: boolean;
  completed_at: string | null;
  created_at: string;
}

// Extended user with journey data
interface UserWithJourney extends UserWithRole {
  onboarding?: UserOnboardingState | null;
  accessIssues: AccessIssue[];
}

interface AccessIssue {
  severity: "error" | "warning" | "info";
  message: string;
  fix?: string;
}

// RLS Access computation (same as UserManagement)
type RLSAccessLevel = "platform_admin" | "developer" | "org_owner" | "org_admin" | "supervisor" | "operator" | "viewer" | "no_access";

interface RLSAccess {
  level: RLSAccessLevel;
  label: string;
  color: "destructive" | "default" | "secondary" | "outline";
}

function computeRLSAccess(user: UserWithRole): RLSAccess {
  const hasPlatformAdmin = user.roles.includes("admin");
  const hasDeveloper = user.roles.includes("developer");
  const hasSupervisor = user.roles.includes("supervisor");
  const orgRole = user.organization?.role;

  if (hasPlatformAdmin) return { level: "platform_admin", label: "Platform Admin", color: "destructive" };
  if (hasDeveloper) return { level: "developer", label: "Developer", color: "default" };
  if (orgRole === "owner") return { level: "org_owner", label: "Org Owner", color: "default" };
  if (orgRole === "admin") return { level: "org_admin", label: "Org Admin", color: "secondary" };
  if (hasSupervisor && user.organization) return { level: "supervisor", label: "Supervisor", color: "secondary" };
  if (user.organization) return { level: "operator", label: "Operator", color: "outline" };
  if (user.roles.includes("viewer")) return { level: "viewer", label: "Viewer", color: "outline" };
  return { level: "no_access", label: "No Access", color: "outline" };
}

// Analyze access issues for a user
function analyzeAccessIssues(user: UserWithRole, onboarding: UserOnboardingState | null): AccessIssue[] {
  const issues: AccessIssue[] = [];

  // Check onboarding state
  if (!onboarding) {
    issues.push({
      severity: "error",
      message: "No onboarding record found",
      fix: "User may have been created outside normal signup flow. Create onboarding record manually.",
    });
  } else {
    if (!onboarding.has_seen_welcome && !onboarding.is_complete) {
      issues.push({
        severity: "warning",
        message: "User hasn't completed welcome modal",
        fix: "User will see welcome modal on next login. Consider reaching out to guide them.",
      });
    }

    if (onboarding.current_step === "organization-setup" && !user.organization) {
      issues.push({
        severity: "error",
        message: "Stuck at org setup - no organization joined",
        fix: "User needs to create or join an organization to proceed.",
      });
    }

    if (onboarding.current_step === "shop-setup" && user.organization) {
      // Check if they have teams/stations
      issues.push({
        severity: "info",
        message: "User is in shop setup phase",
        fix: "Guide user through team and station creation.",
      });
    }
  }

  // Check organization membership
  if (!user.organization) {
    issues.push({
      severity: "error",
      message: "No organization membership - most features blocked by RLS",
      fix: "Send organization invite or help user create new organization.",
    });
  }

  // Check role configuration
  if (user.roles.length === 0) {
    issues.push({
      severity: "error",
      message: "No platform roles assigned",
      fix: "Assign at least 'operator' role for basic access.",
    });
  }

  // Check for conflicting states
  if (user.organization?.role === "owner" && !user.roles.includes("supervisor")) {
    issues.push({
      severity: "info",
      message: "Org owner without supervisor platform role",
      fix: "Consider adding supervisor role for team management features.",
    });
  }

  // Check if operator without org membership
  if (user.roles.includes("operator") && !user.organization) {
    issues.push({
      severity: "warning",
      message: "Operator role but no org - limited functionality",
      fix: "Operators need organization membership to access work orders and stations.",
    });
  }

  return issues;
}

// Journey step status
function getStepStatus(step: OnboardingStep, onboarding: UserOnboardingState | null): "completed" | "current" | "pending" | "blocked" {
  if (!onboarding) return "blocked";
  if (onboarding.completed_steps?.includes(step)) return "completed";
  if (onboarding.current_step === step) return "current";
  return "pending";
}

export function UserJourneyDebugPanel() {
  const { users, loading: usersLoading } = useAllUsers();
  const [onboardingData, setOnboardingData] = useState<Record<string, UserOnboardingState>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "issues" | "incomplete" | "complete">("all");
  const [selectedUser, setSelectedUser] = useState<UserWithJourney | null>(null);
  const { toast } = useToast();

  // Fetch all onboarding states
  useEffect(() => {
    async function fetchOnboardingData() {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_onboarding")
        .select("*");

      if (error) {
        console.error("Error fetching onboarding data:", error);
        toast({
          title: "Failed to load onboarding data",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const map: Record<string, UserOnboardingState> = {};
        data?.forEach((record) => {
          map[record.user_id] = record as UserOnboardingState;
        });
        setOnboardingData(map);
      }
      setLoading(false);
    }

    fetchOnboardingData();
  }, [toast]);

  // Combine users with journey data
  const usersWithJourney: UserWithJourney[] = users.map((user) => {
    const onboarding = onboardingData[user.user_id] || null;
    return {
      ...user,
      onboarding,
      accessIssues: analyzeAccessIssues(user, onboarding),
    };
  });

  // Filter users
  const filteredUsers = usersWithJourney.filter((user) => {
    const matchesSearch = 
      user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterStatus) {
      case "issues":
        return user.accessIssues.some((i) => i.severity === "error" || i.severity === "warning");
      case "incomplete":
        return !user.onboarding?.is_complete;
      case "complete":
        return user.onboarding?.is_complete;
      default:
        return true;
    }
  });

  // Stats
  const issueCount = usersWithJourney.filter((u) => u.accessIssues.some((i) => i.severity === "error")).length;
  const incompleteCount = usersWithJourney.filter((u) => !u.onboarding?.is_complete).length;
  const noOrgCount = usersWithJourney.filter((u) => !u.organization).length;

  const refreshData = async () => {
    setLoading(true);
    const { data } = await supabase.from("user_onboarding").select("*");
    if (data) {
      const map: Record<string, UserOnboardingState> = {};
      data.forEach((record) => {
        map[record.user_id] = record as UserOnboardingState;
      });
      setOnboardingData(map);
    }
    setLoading(false);
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value as "all" | "issues" | "incomplete" | "complete");
  };

  if (usersLoading || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus("all")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 border-destructive/50" onClick={() => setFilterStatus("issues")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Issues</p>
                <p className="text-2xl font-bold text-destructive">{issueCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus("incomplete")}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Incomplete Journey</p>
                <p className="text-2xl font-bold">{incompleteCount}</p>
              </div>
              <Map className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No Organization</p>
                <p className="text-2xl font-bold">{noOrgCount}</p>
              </div>
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5" />
                User Journey & Access Debug
              </CardTitle>
              <CardDescription>
                Track onboarding progress, org membership, and RLS access levels
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-lg">
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="issues">With Issues</SelectItem>
                <SelectItem value="incomplete">Incomplete Journey</SelectItem>
                <SelectItem value="complete">Completed Journey</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User List */}
            <div className="border rounded-lg">
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {filteredUsers.map((user) => {
                    const access = computeRLSAccess(user);
                    const hasErrors = user.accessIssues.some((i) => i.severity === "error");
                    const hasWarnings = user.accessIssues.some((i) => i.severity === "warning");
                    const progress = user.onboarding 
                      ? Math.round((user.onboarding.completed_steps?.length || 0) / (ONBOARDING_STEPS.length - 1) * 100)
                      : 0;

                    return (
                      <div
                        key={user.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedUser?.id === user.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{user.display_name}</p>
                              {hasErrors && <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                              {!hasErrors && hasWarnings && <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                              {!hasErrors && !hasWarnings && user.onboarding?.is_complete && (
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={access.color} className="text-xs">
                                {access.label}
                              </Badge>
                              {user.organization && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {user.organization.name}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Journey: {user.onboarding?.current_step || "Not started"}</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1" />
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-3" />
                        </div>
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No users match your filters
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* User Detail Panel */}
            <div className="border rounded-lg">
              {selectedUser ? (
                <ScrollArea className="h-[600px]">
                  <div className="p-4 space-y-4">
                    {/* User Header */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {selectedUser.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedUser.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Access Issues */}
                    {selectedUser.accessIssues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Access Issues ({selectedUser.accessIssues.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedUser.accessIssues.map((issue, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-lg text-sm ${
                                issue.severity === "error" 
                                  ? "bg-destructive/10 border border-destructive/30" 
                                  : issue.severity === "warning"
                                  ? "bg-secondary/50 border border-secondary"
                                  : "bg-muted"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {issue.severity === "error" ? (
                                  <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                                ) : issue.severity === "warning" ? (
                                  <AlertTriangle className="w-4 h-4 text-secondary-foreground mt-0.5" />
                                ) : (
                                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                                )}
                                <div>
                                  <p className="font-medium">{issue.message}</p>
                                  {issue.fix && (
                                    <p className="text-muted-foreground mt-1">
                                      <strong>Fix:</strong> {issue.fix}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Journey Progress */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Map className="w-4 h-4" />
                        Onboarding Journey
                      </h4>
                      <div className="space-y-1">
                        {ONBOARDING_STEPS.map((step) => {
                          const status = getStepStatus(step.id, selectedUser.onboarding || null);
                          return (
                            <div
                              key={step.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                status === "current" ? "bg-primary/10" : ""
                              }`}
                            >
                              {status === "completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              ) : status === "current" ? (
                                <Play className="w-4 h-4 text-primary" />
                              ) : status === "blocked" ? (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <p className={`text-sm ${status === "current" ? "font-medium" : ""}`}>
                                  {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{step.description}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />

                    {/* Organization Membership */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Organization Membership
                      </h4>
                      {selectedUser.organization ? (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{selectedUser.organization.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Role: {selectedUser.organization.role}
                              </p>
                            </div>
                            <Badge variant="secondary" className="gap-1">
                              {selectedUser.organization.role === "owner" && <Crown className="w-3 h-3" />}
                              {selectedUser.organization.role === "admin" && <Shield className="w-3 h-3" />}
                              {selectedUser.organization.role === "member" && <User className="w-3 h-3" />}
                              {selectedUser.organization.role}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p>• is_org_member(): ✅ Passes</p>
                            <p>• is_org_admin(): {selectedUser.organization.role === "owner" || selectedUser.organization.role === "admin" ? "✅ Passes" : "❌ Denied"}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-destructive" />
                            <p className="text-sm font-medium">No Organization</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            User cannot access most features. RLS policies will deny access to org-scoped data.
                          </p>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p>• is_org_member(): ❌ Denied</p>
                            <p>• is_org_admin(): ❌ Denied</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Platform Roles */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Platform Roles & RLS Functions
                      </h4>
                      <div className="space-y-2">
                        {selectedUser.roles.length > 0 ? (
                          selectedUser.roles.map((role) => (
                            <div key={role} className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between">
                                <Badge variant={role === "admin" ? "destructive" : role === "developer" ? "default" : "secondary"}>
                                  {role}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  has_role('{role}'): ✅
                                </span>
                              </div>
                              {role === "admin" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  • is_dev_or_admin(): ✅ Full platform access
                                </p>
                              )}
                              {role === "developer" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  • is_dev_or_admin(): ✅ Dev tools access
                                </p>
                              )}
                              {role === "supervisor" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  • is_supervisor_in_org(): {selectedUser.organization ? "✅" : "❌ Needs org"}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                            <p className="text-sm text-destructive">No platform roles assigned</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              User needs at least 'operator' role for basic access.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Teams */}
                    {selectedUser.teams && selectedUser.teams.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Team Memberships
                        </h4>
                        <div className="space-y-1">
                          {selectedUser.teams.map((team) => (
                            <div key={team.id} className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
                              <span className="text-sm">{team.name}</span>
                              <Badge variant="outline" className="text-xs">{team.role}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Computed Access Level */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Effective RLS Access
                      </h4>
                      {(() => {
                        const access = computeRLSAccess(selectedUser);
                        return (
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <Badge variant={access.color} className="text-sm mb-2">
                              {access.label}
                            </Badge>
                            <div className="text-xs text-muted-foreground space-y-1">
                              {access.level === "platform_admin" && (
                                <>
                                  <p>✅ Full platform access</p>
                                  <p>✅ Can manage all organizations</p>
                                  <p>✅ Access to dev tools & RLS health</p>
                                </>
                              )}
                              {access.level === "developer" && (
                                <>
                                  <p>✅ Dev tools access</p>
                                  <p>✅ Can debug user issues</p>
                                  <p>❌ Cannot modify org data directly</p>
                                </>
                              )}
                              {access.level === "org_owner" && (
                                <>
                                  <p>✅ Full org CRUD access</p>
                                  <p>✅ Can manage members & roles</p>
                                  <p>✅ Billing & subscription access</p>
                                </>
                              )}
                              {access.level === "org_admin" && (
                                <>
                                  <p>✅ Org member management</p>
                                  <p>✅ Team & station management</p>
                                  <p>❌ Cannot delete organization</p>
                                </>
                              )}
                              {access.level === "supervisor" && (
                                <>
                                  <p>✅ Team data read access</p>
                                  <p>✅ Review handoffs & performance</p>
                                  <p>❌ Cannot modify org structure</p>
                                </>
                              )}
                              {access.level === "operator" && (
                                <>
                                  <p>✅ Own profile access</p>
                                  <p>✅ Submit handoffs</p>
                                  <p>❌ Limited to assigned stations</p>
                                </>
                              )}
                              {access.level === "no_access" && (
                                <>
                                  <p>❌ No organization membership</p>
                                  <p>❌ Most features blocked</p>
                                  <p>⚠️ Needs org invite to proceed</p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a user to view their journey details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
