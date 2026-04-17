import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Loader2, ExternalLink } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

/**
 * Admin-facing certificate issuance form. Shared by OAP and GCA.
 * Use inside platform admin or org admin training panels.
 */
export function CertificateIssuancePanel({ defaultOrgId }: { defaultOrgId?: string }) {
  const { issueCertificate, issuing } = useCertificates();
  const { toast } = useToast();

  const [program, setProgram] = useState<"OAP" | "GCA">("OAP");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [programName, setProgramName] = useState("");
  const [issuedCertId, setIssuedCertId] = useState<string | null>(null);

  const handleIssue = async () => {
    if (!recipientName || !recipientEmail || !programName) {
      toast({ title: "Missing fields", description: "Fill in recipient and program name.", variant: "destructive" });
      return;
    }
    try {
      const res = await issueCertificate({
        program,
        recipientName,
        recipientEmail,
        programName,
        organizationId: defaultOrgId ?? null,
      });
      setIssuedCertId(res.certId);
      toast({ title: "Certificate issued", description: `${res.certId} sent to ${recipientEmail}` });
    } catch (e) {
      toast({
        title: "Issue failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-2">
          <Award className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <CardTitle className="text-base">Issue certificate</CardTitle>
            <CardDescription>
              Generate a portable, publicly verifiable certificate for an operator. Sends an email and stores a permanent record.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Program</Label>
            <Select value={program} onValueChange={(v) => setProgram(v as "OAP" | "GCA")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OAP">OAP — Operator Acceptance</SelectItem>
                <SelectItem value="GCA">GCA — G-Code Academy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Program / role name</Label>
            <Input value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="e.g. CNC Lathe Operator" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recipient name</Label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Recipient email</Label>
            <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleIssue} disabled={issuing} className="w-full">
          {issuing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
          Issue {program} certificate
        </Button>

        {issuedCertId && (
          <div className="p-3 rounded-md border bg-muted/30 text-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Issued</div>
              <div className="font-mono font-semibold">{issuedCertId}</div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to={`/verify/${issuedCertId}`} target="_blank">
                View <ExternalLink className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
