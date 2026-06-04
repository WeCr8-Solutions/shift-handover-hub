import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, DollarSign, FileSignature, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Engagement } from "@/hooks/useOnboardingEngagements";

const METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  check: "Check",
  credit_card_offline: "Credit card (offline)",
  ach: "ACH",
  wire: "Wire transfer",
  po: "Purchase order",
  other: "Other",
  complimentary: "Complimentary",
};

const STATUS_VARIANTS: Record<string, { label: string; className: string }> = {
  unpaid:    { label: "Unpaid",    className: "border-destructive/40 text-destructive" },
  invoiced:  { label: "Invoiced",  className: "border-amber-500/40 text-amber-600" },
  paid:      { label: "Paid",      className: "border-status-ok/40 text-status-ok" },
  refunded:  { label: "Refunded",  className: "border-muted-foreground/40 text-muted-foreground" },
  waived:    { label: "Waived",    className: "border-primary/40 text-primary" },
};

type Engagement2 = Engagement & {
  payment_status: string;
  payment_method: string | null;
  payment_reference: string | null;
  payment_amount_cents: number;
  payment_received_at: string | null;
  payment_proof_path: string | null;
  contract_signed_at: string | null;
  contract_signer_name: string | null;
  contract_signer_title: string | null;
  contract_proof_path: string | null;
};

async function uploadProof(orgId: string, engagementId: string, kind: "payment" | "contract", file: File) {
  const ts = Date.now();
  const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const path = `${orgId}/${engagementId}/${kind}-${ts}-${safe}`;
  const { error } = await supabase.storage
    .from("concierge-contracts")
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

export function PaymentPanel({ engagement }: { engagement: Engagement2 }) {
  const qc = useQueryClient();
  const status = engagement.payment_status ?? "unpaid";
  const statusInfo = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.unpaid;

  const [payMethod, setPayMethod] = useState<string>("check");
  const [payRef, setPayRef] = useState("");
  const [payAmount, setPayAmount] = useState<string>(
    ((engagement.payment_amount_cents ?? 150000) / 100).toFixed(2),
  );
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payFile, setPayFile] = useState<File | null>(null);
  const [paySaving, setPaySaving] = useState(false);

  const [signerName, setSignerName] = useState(engagement.contract_signer_name ?? "");
  const [signerTitle, setSignerTitle] = useState(engagement.contract_signer_title ?? "");
  const [signedDate, setSignedDate] = useState<string>(
    engagement.contract_signed_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractSaving, setContractSaving] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["onboarding-engagement"] });
    qc.invalidateQueries({ queryKey: ["onboarding-engagements"] });
  };

  async function recordPayment() {
    setPaySaving(true);
    try {
      let proofPath: string | null = null;
      if (payFile) proofPath = await uploadProof(engagement.organization_id, engagement.id, "payment", payFile);

      const cents = Math.round(parseFloat(payAmount || "0") * 100);
      const { error } = await supabase.rpc("record_concierge_payment" as any, {
        p_engagement_id: engagement.id,
        p_method: payMethod,
        p_reference: payRef || null,
        p_amount_cents: cents,
        p_received_at: new Date(payDate).toISOString(),
        p_proof_path: proofPath,
        p_status: "paid",
      });
      if (error) throw error;
      toast.success("Payment recorded");
      setPayRef(""); setPayFile(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to record payment");
    } finally {
      setPaySaving(false);
    }
  }

  async function recordContract() {
    setContractSaving(true);
    try {
      let proofPath: string | null = null;
      if (contractFile) proofPath = await uploadProof(engagement.organization_id, engagement.id, "contract", contractFile);
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
      setContractSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Payment & Contract
              <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
              {engagement.contract_signed_at && (
                <Badge variant="outline" className="border-status-ok/40 text-status-ok gap-1">
                  <FileSignature className="w-3 h-3" /> Contract signed
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Production activation is blocked until payment is paid/waived and (for offline engagements) a signed contract is on file.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to={`/admin/concierge/print/${engagement.id}`} target="_blank" rel="noopener">
              <Printer className="w-4 h-4" /> Print sales pack
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 gap-6">
        {/* Record payment */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Record payment</h4>
          {engagement.payment_received_at && (
            <p className="text-xs text-muted-foreground">
              Last recorded: {METHOD_LABELS[engagement.payment_method ?? ""] ?? engagement.payment_method ?? "—"} ·{" "}
              ${((engagement.payment_amount_cents ?? 0) / 100).toFixed(2)} ·{" "}
              {new Date(engagement.payment_received_at).toLocaleDateString()}
              {engagement.payment_reference && <> · ref {engagement.payment_reference}</>}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card_offline">Credit card (offline)</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="wire">Wire transfer</SelectItem>
                  <SelectItem value="po">Purchase order</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Reference</Label>
              <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Check #, auth code…" />
            </div>
            <div>
              <Label className="text-xs">Amount (USD)</Label>
              <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Received date</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Proof (optional)</Label>
              <Input type="file" accept="image/*,application/pdf"
                onChange={(e) => setPayFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <Button onClick={recordPayment} disabled={paySaving} className="w-full">
            {paySaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Mark payment received
          </Button>
        </div>

        {/* Record contract */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Record signed contract</h4>
          {engagement.contract_signed_at && (
            <p className="text-xs text-muted-foreground">
              Signed by {engagement.contract_signer_name}
              {engagement.contract_signer_title && <> ({engagement.contract_signer_title})</>}
              {" · "}{new Date(engagement.contract_signed_at).toLocaleDateString()}
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
              <Label className="text-xs">Scan upload</Label>
              <Input type="file" accept="image/*,application/pdf"
                onChange={(e) => setContractFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <Button onClick={recordContract} disabled={contractSaving || !signerName.trim()} className="w-full">
            {contractSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save signature
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
