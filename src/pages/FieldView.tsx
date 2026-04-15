/**
 * FieldView.tsx
 *
 * Auth-required field page for the San Diego flyer drop campaign.
 *
 * Routes:
 *   /field          — platform admin/developer: all 22 zones
 *   /field/:token   — authenticated helper with a valid invite token: assigned zones only
 *
 * Non-authenticated users are redirected to /auth?redirect=/field[/:token].
 * Authenticated users without flyer access see an "access denied" message.
 *
 * Access roles: admin, developer, flyer_worker
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FieldChecklist } from "@/components/admin/FieldChecklist";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, LogOut } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbZone {
  id: string;
  zone_number: number;
  zone_name: string;
  city: string;
  status: string;
}

interface Assignment {
  id: string;
  assignee_name: string;
  zone_numbers: number[];
  is_active: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FieldView() {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [dbZones, setDbZones] = useState<DbZone[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      const redirect = token ? `/field/${token}` : "/field";
      navigate(`/auth?redirect=${encodeURIComponent(redirect)}`, {
        replace: true,
      });
    }
  }, [user, isReady, token, navigate]);

  // Check access + load data
  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      setChecking(true);

      // 1. Check role
      const { data: roleRows } = await supabase
        .from("user_roles" as never)
        .select("role")
        .eq("user_id" as never, user!.id as never);

      const roles: string[] = ((roleRows as unknown) as { role: string }[] ?? []).map(r => r.role);
      const isPlatformAdmin = roles.some(r => r === "admin" || r === "developer");
      const isFlyerWorker = roles.some(r => r === "flyer_worker");

      if (!isPlatformAdmin && !isFlyerWorker) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      setHasAccess(true);

      // 2. Load campaign
      const { data: campaigns } = await supabase
        .from("flyer_campaigns" as never)
        .select("id")
        .eq("slug" as never, "san_diego_drop" as never)
        .limit(1 as never);

      const cid = ((campaigns as unknown) as { id: string }[] ?? [])[0]?.id;
      if (!cid) {
        toast.error("Campaign not found");
        setChecking(false);
        return;
      }
      setCampaignId(cid);

      // 3. Load zones
      const { data: zones } = await supabase
        .from("flyer_zones" as never)
        .select("id, zone_number, zone_name, city, status")
        .eq("campaign_id" as never, cid as never)
        .order("zone_number" as never);

      setDbZones(((zones as unknown) as DbZone[]) ?? []);

      // 4. If token provided, look up assignment + claim it to this user
      if (token) {
        const { data: asgRows } = await supabase
          .from("flyer_zone_assignments" as never)
          .select("id, assignee_name, zone_numbers, is_active")
          .eq("invite_token" as never, token as never)
          .limit(1 as never);

        const asg = ((asgRows as unknown) as Assignment[])?.[0];
        if (asg && asg.is_active) {
          setAssignment(asg);
          // Claim the assignment to this user if not already claimed
          await supabase
            .from("flyer_zone_assignments" as never)
            .update({ assigned_to_user_id: user!.id } as never)
            .eq("id" as never, asg.id as never)
            .is("assigned_to_user_id" as never, null as never);
        } else if (asg && !asg.is_active) {
          toast.error("This assignment link is no longer active.");
        }
      }

      setChecking(false);
    }

    load();
  }, [user, authLoading, token]);

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null; // redirect handled in effect

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Access Required</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          You don't have access to the field checklist. Contact your team lead
          to receive a flyer worker invite.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  if (!campaignId) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground text-sm">
        Campaign data unavailable.
      </div>
    );
  }

  const displayName =
    assignment?.assignee_name ??
    profile?.display_name ??
    user.email ??
    "Field Worker";

  const assignedZones = assignment?.zone_numbers;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background border-b flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold leading-none">Jobline.ai</p>
            <p className="text-xs text-muted-foreground">Flyer Drop</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {displayName && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {displayName}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Subheader for assigned helpers */}
      {assignment && (
        <div className="bg-primary/5 border-b px-4 py-2 text-sm text-center text-primary font-medium">
          Assigned zones:{" "}
          {(assignment.zone_numbers ?? [])
            .sort((a, b) => a - b)
            .map(n => `Z${n}`)
            .join(", ")}
        </div>
      )}

      {/* Checklist */}
      <main className="flex-1 overflow-auto">
        <FieldChecklist
          campaignId={campaignId}
          dbZones={dbZones}
          assignedZones={assignedZones}
          assignmentId={assignment?.id}
          currentUserId={user.id}
          displayName={displayName}
        />
      </main>
    </div>
  );
}
