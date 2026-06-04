import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileSignature, Loader2, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Engagement } from "@/hooks/useOnboardingEngagements";

async function uploadProof(orgId: string, engagementId: string, file: File) {
  const ts = Date.now();
  const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const path = `${orgId}/${engagementId}/contract-${ts}-${safe}`;
  const { error } = await supabase.storage
    .from("concierge-contracts")
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

/**
 * Wet-signature contract panel. Records signed MSA upload and allows admins to
 * VOID a wrong contract (clears signer + proof) with a reason captured in the
 * admin audit log via the `void_concierge_contract` RPC.
 */
export function ContractPanel({ engagement }: { engagement: Engagement }) {
  const qc = useQueryClient();
  const [signerName, setSignerName] = useState(engagement.contract_signer_name ?? "");
  const [signerTitle, setSignerTitle] = useState(engagement.contract_signer_title ?? "");
  const [signedDate, setSignedDate] = useState<string>(
    engagement.contract_signed_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["onboarding-engagement"] });
    qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
  };

  async function recordContract() {
    setSaving(true);
    try {
      let proofPath: string | null = null;
      if (contractFile) proofPath = await uploadProof(engagement.organization_id, engagement.id, contractFile);
      const { error } = await supabase.rpc("record_concierge_contract_signature" as any, {
        p_engagement_id: engagement.id,
        p_signer_name: signerName,
        p_signer_title: signerTitle || null,
        p_signed_at: new Date(signedDate).toISOString(),
        p_contract_proof_path: proofPath,
      });
      if (error) throw error;
      toast.success("Signed contract recorded");
      setContractFile(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to record signature");
    } finally {
      setSaving(false);
    }
  }

  async function voidContract() {
    if (!voidReason.trim()) {
      toast.error("Reason required to void contract");
      return;
    }
    setVoiding(true);
    try {
      const { error } = await supabase.rpc("void_concierge_contract" as any, {
        p_engagement_id: engagement.id,
        p_reason: voidReason.trim(),
      });
      if (error) throw error;
      toast.success("Contract voided — re-upload the correct signed PDF");
      setVoidReason("");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to void contract");
    } finally {
      setVoiding(false);
    }
  }

  const hasContract = !!engagement.contract_signed_at;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-4 h-4" /> Wet-signature contract
              {hasContract ? (
                <Badge variant="outline" className="border-status-ok/40 text-status-ok">On file</Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-600">Not on file</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Upload the customer's signed Master Services Agreement scan. Required for offline (non-Stripe) engagements.
            </CardDescription>
          </div>
          {hasContract && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Undo2 className="w-3.5 h-3.5" /> Void contract
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Void signed contract?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Clears the signer name, signed date, and proof path so the correct scan can be re-uploaded. The action is recorded in the admin audit log with the reason below.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label className="text-xs">Reason</Label>
                  <Textarea
                    rows={3}
                    placeholder="Wrong PDF uploaded, missing initials on page 4, etc."
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={voidContract} disabled={voiding || !voidReason.trim()}>
                    {voiding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Void contract
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasContract && (
          <p className="text-xs text-muted-foreground">
            Signed by <b>{engagement.contract_signer_name}</b>
            {engagement.contract_signer_title && <> ({engagement.contract_signer_title})</>}
            {" · "}{new Date(engagement.contract_signed_at!).toLocaleDateString()}
            {engagement.contract_proof_path && <> · proof on file</>}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Signer name</Label>
            <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)} placeholder="VP Operations" />
          </div>
          <div>
            <Label className="text-xs">Signed date</Label>
            <Input type="date" value={signedDate} onChange={(e) => setSignedDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Scan upload (PDF / image)</Label>
            <Input type="file" accept="image/*,application/pdf"
              onChange={(e) => setContractFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <Button onClick={recordContract} disabled={saving || !signerName.trim()} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save signature
        </Button>
      </CardContent>
    </Card>
  );
}
