import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Engagement } from "@/hooks/useOnboardingEngagements";

type RefundEngagement = Engagement & {
  refunded_at?: string | null;
  refund_amount_cents?: number | null;
  refund_reason?: string | null;
  refund_method?: string | null;
  refund_reference?: string | null;
};

async function uploadRefundProof(orgId: string, engagementId: string, file: File) {
  const ts = Date.now();
  const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const path = `${orgId}/${engagementId}/refunds/${ts}-${safe}`;
  const { error } = await supabase.storage
    .from("concierge-contracts")
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

export function RefundPanel({ engagement }: { engagement: RefundEngagement }) {
  const qc = useQueryClient();
  const paid = engagement.payment_amount_cents ?? 0;
  const alreadyRefunded = engagement.refund_amount_cents ?? 0;
  const remaining = Math.max(0, paid - alreadyRefunded);
  const canRefund = ["paid"].includes(engagement.payment_status) && remaining > 0;

  const [amount, setAmount] = useState<string>((remaining / 100).toFixed(2));
  const [method, setMethod] = useState("stripe");
  const [reason, setReason] = useState("requested_by_customer");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const cents = Math.round(parseFloat(amount || "0") * 100);
      if (cents <= 0 || cents > remaining) {
        toast.error(`Amount must be between $0.01 and $${(remaining / 100).toFixed(2)}`);
        return;
      }
      let proofPath: string | null = null;
      if (file) proofPath = await uploadRefundProof(engagement.organization_id, engagement.id, file);
      const { error } = await supabase.rpc("record_concierge_refund" as any, {
        p_engagement_id: engagement.id,
        p_amount_cents: cents,
        p_reason: reason,
        p_method: method,
        p_reference: reference || null,
        p_proof_path: proofPath,
      });
      if (error) throw error;
      toast.success("Refund recorded");
      setFile(null); setReference("");
      qc.invalidateQueries({ queryKey: ["onboarding-engagement"] });
      qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to record refund");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Undo2 className="w-4 h-4" /> Refund
              {engagement.payment_status === "refunded" && (
                <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">
                  Refunded
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stripe refunds issued from the Stripe dashboard sync here automatically via webhook.
              Use this form to record an offline refund (check returned, ACH reversal, etc.).
            </CardDescription>
          </div>
          {alreadyRefunded > 0 && (
            <div className="text-right text-xs">
              <div className="text-muted-foreground">Refunded to date</div>
              <div className="font-semibold">${(alreadyRefunded / 100).toFixed(2)}</div>
              {engagement.refunded_at && (
                <div className="text-muted-foreground">
                  Last: {new Date(engagement.refunded_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!canRefund ? (
          <div className="text-sm text-muted-foreground">
            {engagement.payment_status !== "paid"
              ? `Refunds only available once payment_status is paid (currently ${engagement.payment_status}).`
              : "Engagement is fully refunded."}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Amount (USD)</Label>
                <Input type="number" step="0.01" min="0.01" max={(remaining / 100).toFixed(2)}
                  value={amount} onChange={(e) => setAmount(e.target.value)} />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Up to ${(remaining / 100).toFixed(2)} remaining
                </p>
              </div>
              <div>
                <Label className="text-xs">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe (already issued in dashboard)</SelectItem>
                    <SelectItem value="check">Check sent back</SelectItem>
                    <SelectItem value="ach">ACH reversal</SelectItem>
                    <SelectItem value="wire">Wire return</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Reference (check #, Stripe refund id…)</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="re_…" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Reason</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              </div>
              <div>
                <Label className="text-xs">Proof (optional)</Label>
                <Input type="file" accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <Button onClick={submit} disabled={saving} variant="destructive" className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Record refund {parseFloat(amount || "0") >= remaining / 100 ? "(full — deactivates org)" : "(partial)"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
