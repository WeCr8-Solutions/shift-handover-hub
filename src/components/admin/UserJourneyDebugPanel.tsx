import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserWithRole, useAllUsers } from "@/hooks/useAdminData";
import { ONBOARDING_STEPS, OnboardingStep } from "@/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, Search, User, Building2, Shield, Crown, UserCog, 
  Eye, Lock, Unlock, CheckCircle2, Circle, AlertTriangle, 
  XCircle, RefreshCw, Map, ChevronRight, Info, ShieldAlert,
  ShieldCheck, Briefcase, Play, Flag, Users, RotateCcw,
  UserPlus, Wand2, Mail, Send, PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

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
  action?: "create_onboarding" | "reset_step" | "add_role" | "mark_welcome" | "send_invite";
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

// Analyze access issues for a user - comprehensive RLS and journey diagnostics
function analyzeAccessIssues(user: UserWithRole, onboarding: UserOnboardingState | null): AccessIssue[] {
  const issues: AccessIssue[] = [];

  // ============ ONBOARDING STATE CHECKS ============
  if (!onboarding) {
    issues.push({
      severity: "error",
      message: "No onboarding record found",
      fix: "User may have been created outside normal signup flow. Create onboarding record manually.",
      action: "create_onboarding",
    });
  } else {
    if (!onboarding.has_seen_welcome && !onboarding.is_complete) {
      issues.push({
        severity: "warning",
        message: "User hasn't completed welcome modal",
        fix: "Mark welcome as seen to allow user to proceed with journey.",
        action: "mark_welcome",
      });
    }

    if (onboarding.current_step === "organization-setup" && !user.organization) {
      issues.push({
        severity: "error",
        message: "Stuck at org setup - no organization joined",
        fix: "User needs to create or join an organization to proceed. Check if RLS allows organization creation.",
        action: "send_invite",
      });
    }

    if (onboarding.current_step === "shop-setup" && user.organization) {
      // Check if they can actually create teams/stations
      const canCreateTeams = user.organization.role === "owner" || user.organization.role === "admin";
      if (!canCreateTeams) {
        issues.push({
          severity: "error",
          message: "Cannot create teams - org role is 'member'",
          fix: "User's org role is 'member' but creating teams requires 'owner' or 'admin'. Upgrade their org role.",
        });
      } else {
        issues.push({
          severity: "info",
          message: "User is in shop setup phase",
          fix: "Guide user through team and station creation or advance their journey step.",
          action: "reset_step",
        });
      }
    }

    // Detect journey step mismatch
    if (onboarding.is_complete && !user.organization) {
      issues.push({
        severity: "error",
        message: "Journey marked complete but no organization",
        fix: "Inconsistent state: journey shows complete but user has no org. Reset journey to organization-setup.",
        action: "reset_step",
      });
    }
  }

  // ============ RLS ACCESS CHECKS ============
  
  // Check organization membership (critical for most RLS policies)
  if (!user.organization) {
    issues.push({
      severity: "error",
      message: "No organization membership - most features blocked by RLS",
      fix: "RLS functions is_org_member(), is_org_admin() will return FALSE. User cannot access org-scoped data. Send invite or help create organization.",
      action: "send_invite",
    });
  } else {
    // Check org role capabilities
    if (user.organization.role === "member") {
      issues.push({
        severity: "info",
        message: "Org role is 'member' - limited management access",
        fix: "is_org_admin() returns FALSE. User can view but not manage org resources. Consider upgrading to 'admin' if needed.",
      });
    }
  }

  // Check role configuration
  if (user.roles.length === 0) {
    issues.push({
      severity: "error",
      message: "No platform roles assigned",
      fix: "has_role() will return FALSE for all roles. The handle_new_user trigger should auto-assign 'operator'. Manually add 'operator' role.",
      action: "add_role",
    });
  }

  // Check for conflicting states
  if (user.organization?.role === "owner" && !user.roles.includes("supervisor")) {
    issues.push({
      severity: "info",
      message: "Org owner without supervisor platform role",
      fix: "is_supervisor_in_org() requires supervisor platform role + org membership. Adding supervisor enables approval workflows.",
      action: "add_role",
    });
  }

  // Check if operator without org membership
  if (user.roles.includes("operator") && !user.organization) {
    issues.push({
      severity: "warning",
      message: "Operator role but no org - limited functionality",
      fix: "Operators need organization membership to access work orders and stations. RLS will block most queries.",
      action: "send_invite",
    });
  }

  // ============ TEAM MEMBERSHIP CHECKS ============
  if (user.organization && (!user.teams || user.teams.length === 0)) {
    issues.push({
      severity: "info",
      message: "No team memberships",
      fix: "User has org but no teams. is_team_member() will return FALSE. Some features require team membership.",
    });
  }

  // Check for supervisor without teams
  if (user.roles.includes("supervisor") && user.organization && (!user.teams || user.teams.length === 0)) {
    issues.push({
      severity: "warning",
      message: "Supervisor role but no team memberships",
      fix: "is_supervisor_for_team() requires team membership. Add user to teams for proper supervisor access.",
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

// Quick Reset Card - top-level lookup by email or name
function QuickResetCard({
  users,
  actionLoading,
  onResetOnboarding,
  onCreateOnboarding,
}: {
  users: UserWithJourney[];
  actionLoading: string | null;
  onResetOnboarding: (user: UserWithJourney) => Promise<void>;
  onCreateOnboarding: (user: UserWithJourney) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [matchedUser, setMatchedUser] = useState<UserWithJourney | null>(null);

  const handleSearch = () => {
    if (!query.trim()) {
      setMatchedUser(null);
      return;
    }
    const q = query.trim().toLowerCase();
    const found = users.find(
      (u) => u.email.toLowerCase() === q || u.display_name.toLowerCase() === q || u.user_id === q
    );
    setMatchedUser(found || null);
  };

  const journeyLabel = matchedUser?.onboarding
    ? matchedUser.onboarding.is_complete
      ? "Complete"
      : `Step: ${matchedUser.onboarding.current_step}`
    : "No record";

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Quick Onboarding Reset
        </CardTitle>
        <CardDescription>
          Look up a user by email, name, or user ID and reset their onboarding to get them back on track.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter email, display name, or user ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Find
          </Button>
        </div>

        {query.trim() && !matchedUser && (
          <p className="text-sm text-muted-foreground mt-3">No user found matching "{query}"</p>
        )}

        {matchedUser && (
          <div className="mt-3 p-3 rounded-lg border bg-background flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {matchedUser.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{matchedUser.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">{matchedUser.email}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{journeyLabel}</Badge>
              {matchedUser.organization && (
                <Badge variant="secondary" className="text-xs shrink-0 gap-1">
                  <Building2 className="w-3 h-3" />
                  {matchedUser.organization.name}
                </Badge>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actionLoading?.startsWith("reset_full")}
                  className="shrink-0 gap-1.5"
                >
                  {actionLoading === `reset_full_${matchedUser.user_id}` ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3" />
                  )}
                  Reset Onboarding
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Onboarding for {matchedUser.display_name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset their entire onboarding journey back to the welcome screen.
                    They will need to go through organization setup and shop configuration again
                    on their next login. Their existing org membership and data will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={() => onResetOnboarding(matchedUser)}
                  >
                    Reset to Welcome
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface UserJourneyDebugPanelProps {
  /** Optional org scope. When set, only users in this org are listed. */
  scopedOrgId?: string | null;
}

export function UserJourneyDebugPanel({ scopedOrgId }: UserJourneyDebugPanelProps = {}) {
  const { users, loading: usersLoading, fetchUsers } = useAllUsers({ organizationId: scopedOrgId ?? null });
  const [onboardingData, setOnboardingData] = useState<Record<string, UserOnboardingState>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  // Update selected user when data changes
  useEffect(() => {
    if (selectedUser) {
      const updated = usersWithJourney.find(u => u.id === selectedUser.id);
      if (updated) {
        setSelectedUser(updated);
      }
    }
  }, [usersWithJourney, selectedUser?.id]);

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
    await fetchUsers();
    setLoading(false);
    toast({ title: "Data refreshed" });
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value as "all" | "issues" | "incomplete" | "complete");
  };

  // === ACTION HANDLERS ===

  // Full onboarding reset - back to welcome step
  const handleResetFullOnboarding = async (user: UserWithJourney) => {
    setActionLoading(`reset_full_${user.user_id}`);
    try {
      if (user.onboarding) {
        const { error } = await supabase
          .from("user_onboarding")
          .update({
            current_step: "welcome",
            completed_steps: [],
            is_complete: false,
            completed_at: null,
            has_seen_welcome: false,
          })
          .eq("user_id", user.user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_onboarding")
          .insert({
            user_id: user.user_id,
            current_step: "welcome",
            completed_steps: [],
            is_complete: false,
            has_seen_welcome: false,
          });
        if (error) throw error;
      }

      toast({
        title: "Onboarding fully reset",
        description: `${user.display_name} will restart from the welcome screen on next login.`,
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Failed to reset onboarding",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };


  // Create onboarding record for user
  const handleCreateOnboarding = async (user: UserWithJourney) => {
    setActionLoading(`create_onboarding_${user.user_id}`);
    try {
      const { error } = await supabase
        .from("user_onboarding")
        .insert({
          user_id: user.user_id,
          current_step: "welcome",
          completed_steps: [],
          is_complete: false,
          has_seen_welcome: false,
        });

      if (error) throw error;

      toast({
        title: "Onboarding record created",
        description: `${user.display_name} can now start their journey from welcome step.`,
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Failed to create onboarding",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Mark welcome as seen
  const handleMarkWelcomeSeen = async (user: UserWithJourney) => {
    setActionLoading(`mark_welcome_${user.user_id}`);
    try {
      const { error } = await supabase
        .from("user_onboarding")
        .update({ has_seen_welcome: true })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast({
        title: "Welcome marked as seen",
        description: `${user.display_name} will now proceed to organization setup.`,
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Failed to update",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Reset onboarding to specific step
  const handleResetToStep = async (user: UserWithJourney, step: OnboardingStep) => {
    setActionLoading(`reset_step_${user.user_id}`);
    try {
      const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === step);
      const completedSteps = ONBOARDING_STEPS.slice(0, stepIndex).map(s => s.id);

      const { error } = await supabase
        .from("user_onboarding")
        .update({
          current_step: step,
          completed_steps: completedSteps,
          is_complete: false,
          completed_at: null,
        })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast({
        title: "Journey step reset",
        description: `${user.display_name} is now at step: ${step}`,
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Failed to reset step",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Mark journey complete
  const handleMarkJourneyComplete = async (user: UserWithJourney) => {
    setActionLoading(`complete_journey_${user.user_id}`);
    try {
      const { error } = await supabase
        .from("user_onboarding")
        .update({
          is_complete: true,
          completed_at: new Date().toISOString(),
          current_step: "complete",
          completed_steps: ONBOARDING_STEPS.map(s => s.id),
          has_seen_welcome: true,
        })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast({
        title: "Journey marked complete",
        description: `${user.display_name} now has full access to all features.`,
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Failed to complete journey",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Add platform role
  const handleAddRole = async (user: UserWithJourney, role: AppRole) => {
    setActionLoading(`add_role_${user.user_id}_${role}`);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.user_id,
          role: role,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Role already assigned",
            description: `${user.display_name} already has the ${role} role.`,
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Role added",
        description: `${role} role assigned to ${user.display_name}.`,
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Failed to add role",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Remove platform role
  const handleRemoveRole = async (user: UserWithJourney, role: AppRole) => {
    setActionLoading(`remove_role_${user.user_id}_${role}`);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.user_id)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: "Role removed",
        description: `${role} role removed from ${user.display_name}.`,
      });
      await refreshData();
    } catch (err: any) {
      toast({
        title: "Failed to remove role",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (usersLoading || loading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Reset Card */}
      <QuickResetCard
        users={usersWithJourney}
        actionLoading={actionLoading}
        onResetOnboarding={handleResetFullOnboarding}
        onCreateOnboarding={handleCreateOnboarding}
      />

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
                      <div className="flex-1">
                        <h3 className="font-semibold">{selectedUser.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions Panel */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Create onboarding if missing */}
                        {!selectedUser.onboarding && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateOnboarding(selectedUser)}
                            disabled={actionLoading?.startsWith("create_onboarding")}
                            className="justify-start gap-2"
                          >
                            {actionLoading === `create_onboarding_${selectedUser.user_id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <PlusCircle className="w-3 h-3" />
                            )}
                            Create Onboarding
                          </Button>
                        )}

                        {/* Mark welcome seen */}
                        {selectedUser.onboarding && !selectedUser.onboarding.has_seen_welcome && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkWelcomeSeen(selectedUser)}
                            disabled={actionLoading?.startsWith("mark_welcome")}
                            className="justify-start gap-2"
                          >
                            {actionLoading === `mark_welcome_${selectedUser.user_id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            Mark Welcome Seen
                          </Button>
                        )}

                        {/* Mark journey complete */}
                        {selectedUser.onboarding && !selectedUser.onboarding.is_complete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoading?.startsWith("complete_journey")}
                                className="justify-start gap-2"
                              >
                                {actionLoading === `complete_journey_${selectedUser.user_id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                Complete Journey
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-background">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Complete User Journey?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark all onboarding steps as complete for {selectedUser.display_name}. 
                                  They will have full access to all features. This action should only be used 
                                  when the user is truly ready to use the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleMarkJourneyComplete(selectedUser)}>
                                  Complete Journey
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Add operator role if missing */}
                        {!selectedUser.roles.includes("operator") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddRole(selectedUser, "operator")}
                            disabled={actionLoading?.includes("add_role")}
                            className="justify-start gap-2"
                          >
                            {actionLoading === `add_role_${selectedUser.user_id}_operator` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserPlus className="w-3 h-3" />
                            )}
                            Add Operator Role
                          </Button>
                        )}

                        {/* Add supervisor role */}
                        {selectedUser.organization && !selectedUser.roles.includes("supervisor") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddRole(selectedUser, "supervisor")}
                            disabled={actionLoading?.includes("add_role")}
                            className="justify-start gap-2"
                          >
                            {actionLoading === `add_role_${selectedUser.user_id}_supervisor` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserCog className="w-3 h-3" />
                            )}
                            Add Supervisor Role
                          </Button>
                        )}
                      </div>

                      {/* Reset to specific step */}
                      {selectedUser.onboarding && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Reset journey to step:</p>
                          <div className="flex flex-wrap gap-1">
                            {ONBOARDING_STEPS.map((step) => (
                              <Button
                                key={step.id}
                                size="sm"
                                variant={selectedUser.onboarding?.current_step === step.id ? "default" : "outline"}
                                onClick={() => handleResetToStep(selectedUser, step.id)}
                                disabled={actionLoading?.startsWith("reset_step") || selectedUser.onboarding?.current_step === step.id}
                                className="text-xs h-7 px-2"
                              >
                                {actionLoading === `reset_step_${selectedUser.user_id}` && selectedUser.onboarding?.current_step !== step.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : null}
                                {step.id}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
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
                                <div className="flex-1">
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
                                <div className="flex items-center gap-2">
                                  <Badge variant={role === "admin" ? "destructive" : role === "developer" ? "default" : "secondary"}>
                                    {role}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    has_role('{role}'): ✅
                                  </span>
                                </div>
                                {/* Allow removing org-level roles only */}
                                {(role === "supervisor" || role === "operator" || role === "viewer") && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                        disabled={actionLoading?.includes("remove_role")}
                                      >
                                        {actionLoading === `remove_role_${selectedUser.user_id}_${role}` ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <XCircle className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-background">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Role?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Remove the "{role}" role from {selectedUser.display_name}? 
                                          This may affect their access to certain features.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleRemoveRole(selectedUser, role)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Remove Role
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
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
                        
                        {/* Add role buttons */}
                        <div className="flex flex-wrap gap-1 pt-2">
                          {(["operator", "supervisor", "viewer"] as const).filter(r => !selectedUser.roles.includes(r)).map((role) => (
                            <Button
                              key={role}
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddRole(selectedUser, role)}
                              disabled={actionLoading?.includes("add_role")}
                              className="h-7 text-xs gap-1"
                            >
                              {actionLoading === `add_role_${selectedUser.user_id}_${role}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <PlusCircle className="w-3 h-3" />
                              )}
                              Add {role}
                            </Button>
                          ))}
                        </div>
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
