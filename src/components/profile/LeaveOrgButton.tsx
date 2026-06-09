import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  organizationId: string;
  organizationName?: string;
  /** Show as outline (default) or destructive button. */
  variant?: "outline" | "destructive" | "ghost";
}

/**
 * Lets a user exit a specific organization while preserving their portable
 * operator profile and credentials (handled by the leave_organization RPC).
 * Employer-scoped data (work orders, handoffs, etc.) becomes invisible due
 * to RLS once the user is no longer a member.
 */
export function LeaveOrgButton({ organizationId, organizationName, variant = "outline" }: Props) {
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const handleLeave = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("leave_organization" as any, { p_org_id: organizationId } as any);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`You left ${organizationName ?? "the organization"}. Your talent profile and credentials remain on your account.`);
    await qc.invalidateQueries();
    window.location.assign("/profile");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1.5">
          <LogOut className="w-3.5 h-3.5" /> Leave organization
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave {organizationName ?? "this organization"}?</AlertDialogTitle>
          <AlertDialogDescription>
            You'll lose access to this shop's work orders, handoffs, and team data. Your operator
            talent profile, GCA test history, and OAP credentials stay on your account and travel
            with you to your next shop. You can re-join later from a new QR invite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeave} disabled={busy} className="bg-destructive hover:bg-destructive/90">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Leave organization
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
