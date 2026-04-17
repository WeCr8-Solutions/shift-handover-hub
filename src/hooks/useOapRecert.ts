// supabase types are auto-generated; the new tables (oap_recert_events,
// oap_operator_credentials, oap_transfer_tokens) regenerate after publish.
// Until then we cast to `any` at the supabase boundary so the app builds.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RecertEventType =
  | "scheduled"
  | "rescheduled"
  | "reminder_sent"
  | "waived"
  | "suspended"
  | "reinstated"
  | "revoked"
  | "recertified"
  | "transferred";

export type LifecycleStatus =
  | "active"
  | "suspended"
  | "waived"
  | "revoked"
  | "transferred"
  | "departed";

export interface RecertEvent {
  id: string;
  enrollment_id: string;
  organization_id: string;
  operator_user_id: string;
  event_type: RecertEventType;
  previous_due: string | null;
  new_due: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  acted_by: string | null;
  acted_by_name: string | null;
  created_at: string;
}

export interface OperatorCredential {
  id: string;
  operator_user_id: string;
  issuing_organization_id: string | null;
  issuing_organization_name: string;
  cert_id: string | null;
  enrollment_id: string | null;
  role_program_name: string | null;
  machine_tags: string[];
  approved_operations: string[];
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  status: "active" | "expired" | "revoked" | "superseded";
  is_portable: boolean;
  notes: string | null;
}

const sb = supabase as any;

// ---------- Recert events (employer audit trail) ----------
export function useRecertEvents(enrollmentId: string | null) {
  return useQuery({
    queryKey: ["oap-recert-events", enrollmentId],
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("oap_recert_events")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RecertEvent[];
    },
  });
}

interface LifecycleArgs {
  enrollmentId: string;
  organizationId: string;
  operatorUserId: string;
  eventType: RecertEventType;
  previousDue?: string | null;
  newDue?: string | null;
  reason?: string;
  newLifecycleStatus?: LifecycleStatus;
  actorName?: string;
}

export function useRecordRecertEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: LifecycleArgs) => {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Insert audit event
      const { error: evtErr } = await sb.from("oap_recert_events").insert({
        enrollment_id: args.enrollmentId,
        organization_id: args.organizationId,
        operator_user_id: args.operatorUserId,
        event_type: args.eventType,
        previous_due: args.previousDue ?? null,
        new_due: args.newDue ?? null,
        reason: args.reason ?? null,
        acted_by: user?.id ?? null,
        acted_by_name: args.actorName ?? user?.email ?? null,
      });
      if (evtErr) throw evtErr;

      // 2. Mirror to enrollment row
      const patch: Record<string, unknown> = {
        lifecycle_changed_at: new Date().toISOString(),
        lifecycle_changed_by: user?.id ?? null,
      };
      if (args.newDue !== undefined) patch.next_recert_due = args.newDue;
      if (args.reason !== undefined) patch.lifecycle_reason = args.reason;
      if (args.newLifecycleStatus) patch.lifecycle_status = args.newLifecycleStatus;
      if (args.eventType === "recertified") {
        patch.completed_at = new Date().toISOString();
        patch.lifecycle_status = "active";
      }

      const { error: updErr } = await sb
        .from("oap_enrollments")
        .update(patch)
        .eq("id", args.enrollmentId);
      if (updErr) throw updErr;
    },
    onSuccess: (_, args) => {
      qc.invalidateQueries({ queryKey: ["oap-recert-events", args.enrollmentId] });
      qc.invalidateQueries({ queryKey: ["oap-enrollments"] });
      toast.success("Recert action recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------- Operator portable transcript ----------
export function useMyCredentials(userId: string | null) {
  return useQuery({
    queryKey: ["oap-my-credentials", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("oap_operator_credentials")
        .select("*")
        .eq("operator_user_id", userId)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OperatorCredential[];
    },
  });
}

export function useToggleCredentialPortability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPortable }: { id: string; isPortable: boolean }) => {
      const { error } = await sb
        .from("oap_operator_credentials")
        .update({ is_portable: isPortable })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oap-my-credentials"] });
      toast.success("Portability updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---------- Transfer tokens ----------
export interface TransferToken {
  id: string;
  token: string;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_by_org_id: string | null;
  created_at: string;
}

export function useMyTransferTokens(userId: string | null) {
  return useQuery({
    queryKey: ["oap-transfer-tokens", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("oap_transfer_tokens")
        .select("*")
        .eq("operator_user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TransferToken[];
    },
  });
}

export function useCreateTransferToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await sb
        .from("oap_transfer_tokens")
        .insert({ operator_user_id: userId })
        .select("*")
        .single();
      if (error) throw error;
      return data as TransferToken;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oap-transfer-tokens"] });
      toast.success("Transfer code generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRedeemTransferToken() {
  return useMutation({
    mutationFn: async ({ token, orgId }: { token: string; orgId: string }) => {
      const { data, error } = await sb.rpc("redeem_oap_transfer_token", {
        _token: token,
        _redeeming_org_id: orgId,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        credential_id: string;
        operator_user_id: string;
        issuing_organization_name: string;
        cert_id: string | null;
        role_program_name: string | null;
        machine_tags: string[];
        approved_operations: string[];
        issued_at: string;
        expires_at: string | null;
        status: string;
      }>;
    },
    onSuccess: (rows) => toast.success(`Imported ${rows.length} prior credentials`),
    onError: (e: Error) => toast.error(e.message),
  });
}
