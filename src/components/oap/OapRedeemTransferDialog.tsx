import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, Inbox, Building2 } from "lucide-react";
import { useRedeemTransferToken } from "@/hooks/useOapRecert";
import { useOrganization } from "@/hooks/useOrganization";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OapRedeemTransferDialog({ open, onOpenChange }: Props) {
  const { organization } = useOrganization();
  const redeem = useRedeemTransferToken();
  const [token, setToken] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>>>([]);

  async function handleRedeem() {
    if (!organization?.id || !token.trim()) return;
    const rows = await redeem.mutateAsync({ token: token.trim(), orgId: organization.id });
    setResults(rows);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setToken(""); setResults([]); } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-primary" /> Import operator transcript
          </DialogTitle>
          <DialogDescription>
            Paste the one-time transfer code the operator shared with you. You'll see their portable
            credentials from prior employers (machines, operations, cert IDs, dates). To certify them
            on your shop, enroll them in one of your role programs and run a fresh walkthrough.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="xfer-token">Transfer code</Label>
            <div className="flex gap-2">
              <Input
                id="xfer-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste transfer code…"
                className="font-mono"
              />
              <Button onClick={handleRedeem} disabled={!token.trim() || redeem.isPending}>
                Redeem
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Inbox className="w-4 h-4" /> {results.length} portable credential{results.length === 1 ? "" : "s"}
              </div>
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {results.map((r) => (
                  <li key={r.credential_id} className="border border-border rounded p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{r.issuing_organization_name}</span>
                      {r.role_program_name && <Badge variant="outline">{r.role_program_name}</Badge>}
                      <Badge variant="secondary" className="capitalize">{r.status}</Badge>
                    </div>
                    <div className="text-muted-foreground">
                      Issued {format(new Date(r.issued_at), "MMM d, yyyy")}
                      {r.expires_at && <> · expires {format(new Date(r.expires_at), "MMM d, yyyy")}</>}
                      {r.cert_id && <> · <code className="font-mono">{r.cert_id}</code></>}
                    </div>
                    {r.machine_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {r.machine_tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                      </div>
                    )}
                    {r.approved_operations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {r.approved_operations.map((o) => <Badge key={o} variant="secondary" className="text-[10px]">{o}</Badge>)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground italic">
                Prior history is read-only. To certify on your shop, enroll the operator in a role program
                and run your own walkthrough — your certificate will be issued at completion.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
