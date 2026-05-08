import { useMemo, useState } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyCredentials, useToggleCredentialPortability,
  useMyTransferTokens, useCreateTransferToken,
} from "@/hooks/useOapRecert";
import {
  GraduationCap, ShieldCheck, Building2, Copy, Check, Plus, Send, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionAwareEmpty } from "@/components/shared/PermissionAwareEmpty";

export default function OapMyTranscript() {
  const { user } = useAuth();
  const { data: credentials = [] } = useMyCredentials(user?.id ?? null);
  const { data: tokens = [] } = useMyTransferTokens(user?.id ?? null);
  const toggle = useToggleCredentialPortability();
  const createToken = useCreateTransferToken();

  const [tokenDialog, setTokenDialog] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const portableCount = useMemo(
    () => credentials.filter((c) => c.is_portable && c.status === "active").length,
    [credentials]
  );

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>My OAP Transcript — JobLine.ai</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">My OAP Transcript</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Your portable record of every machine, operation, and certification you've earned —
            across every employer. You decide what to share with prospective employers.
          </p>
        </div>

        {!user ? (
          <Card><CardContent className="py-6 text-sm text-muted-foreground">Sign in to view your transcript.</CardContent></Card>
        ) : (
          <>
            {/* Transfer code generator */}
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="w-4 h-4" /> Share with a prospective employer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generate a one-time code. The employer pastes it into their JobLine OAP console
                  and instantly sees your portable credentials ({portableCount} active). They cannot
                  see proprietary content from your prior employers — only machines, operations, dates,
                  and cert IDs you marked as portable. Codes expire in 14 days.
                </p>
                <Button onClick={() => createToken.mutate(user.id)} disabled={createToken.isPending} className="gap-2">
                  <Plus className="w-4 h-4" /> Generate transfer code
                </Button>

                {tokens.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs">Recent codes</Label>
                    {tokens.slice(0, 5).map((t) => {
                      const expired = isPast(new Date(t.expires_at));
                      return (
                        <div key={t.id} className="flex items-center gap-2 text-xs bg-background rounded px-2 py-1.5">
                          <code className="flex-1 font-mono truncate">{t.token}</code>
                          {t.redeemed_at ? (
                            <Badge variant="secondary">Redeemed {formatDistanceToNow(new Date(t.redeemed_at), { addSuffix: true })}</Badge>
                          ) : expired ? (
                            <Badge variant="outline">Expired</Badge>
                          ) : (
                            <>
                              <span className="text-muted-foreground">expires {formatDistanceToNow(new Date(t.expires_at), { addSuffix: true })}</span>
                              <Button size="sm" variant="ghost" onClick={() => copy(t.token)} className="h-7">
                                {copied === t.token ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Credentials list */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Earned credentials</h2>
              {credentials.length === 0 ? (
                <PermissionAwareEmpty
                  mode={user ? "empty" : "permission"}
                  title={user ? "No credentials yet" : "Sign in to view your transcript"}
                  description={
                    user
                      ? "Complete an OAP role program at an employer or buy a $12 self-cert."
                      : "Your earned OAP credentials are private to your account."
                  }
                />
              ) : (
                credentials.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{c.issuing_organization_name}</span>
                            {c.role_program_name && (
                              <Badge variant="outline">{c.role_program_name}</Badge>
                            )}
                            <Badge
                              variant={c.status === "active" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {c.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Issued {format(new Date(c.issued_at), "MMM d, yyyy")}
                            {c.expires_at && <> · expires {format(new Date(c.expires_at), "MMM d, yyyy")}</>}
                            {c.cert_id && <> · cert <code className="font-mono">{c.cert_id}</code></>}
                          </div>
                          {c.machine_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {c.machine_tags.map((t) => (
                                <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                              ))}
                            </div>
                          )}
                          {c.approved_operations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.approved_operations.map((o) => (
                                <Badge key={o} variant="secondary" className="text-[10px]">{o}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-2">
                            {c.is_portable ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                            <Switch
                              checked={c.is_portable}
                              onCheckedChange={(v) => toggle.mutate({ id: c.id, isPortable: v })}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {c.is_portable ? "Shareable" : "Private"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card>
              <CardContent className="py-4 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-primary" />
                <strong>Privacy & ITAR:</strong> Sharing your transcript only exposes employer name,
                machine tags, operation tags, cert IDs, and dates. Lesson content, walkthrough scores,
                and proprietary processes from prior employers stay confidential. Each new employer
                must run their own OAP program to issue you their certificate.
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
