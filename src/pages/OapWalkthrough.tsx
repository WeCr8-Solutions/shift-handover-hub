import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import {
  useWalkthroughCatalog,
  useWalkthroughSessions,
  useSessionCheckoffs,
  type CheckoffResult,
} from "@/hooks/useOapWalkthrough";
import { PermissionAwareEmpty } from "@/components/shared/PermissionAwareEmpty";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PlayCircle,
  Flag,
  FileDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import { exportWalkthroughPdf } from "@/lib/oapWalkthroughPdf";
import { HandbookCite } from "@/components/handbook/HandbookCite";

const RESULT_META: Record<CheckoffResult, { label: string; icon: any; tone: string }> = {
  pass: { label: "Pass", icon: CheckCircle2, tone: "text-success" },
  needs_practice: { label: "Needs Practice", icon: AlertCircle, tone: "text-warning" },
  fail: { label: "Fail", icon: XCircle, tone: "text-destructive" },
};

export default function OapWalkthrough() {
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { members } = useOrganizationMembers(organization?.id ?? null);
  const { sections, items, isLoading: catalogLoading } = useWalkthroughCatalog();
  const { sessions, start, complete } = useWalkthroughSessions();

  const [pickedOperator, setPickedOperator] = useState("");
  const activeSessionId = routeSessionId ?? null;
  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );
  const { checkoffs, checkoff } = useSessionCheckoffs(activeSessionId);

  const itemsBySection = useMemo(() => {
    const m: Record<string, typeof items> = {};
    for (const it of items) (m[it.section_id] ??= []).push(it);
    return m;
  }, [items]);

  const checkoffByItem = useMemo(() => {
    const m: Record<string, (typeof checkoffs)[number]> = {};
    for (const c of checkoffs) m[c.item_id] = c;
    return m;
  }, [checkoffs]);

  const requiredItemsCount = items.filter((i) => i.is_required).length;
  const requiredPassedCount = items.filter(
    (i) => i.is_required && checkoffByItem[i.id]?.result === "pass",
  ).length;

  const handleStart = () => {
    if (!pickedOperator) return;
    const m = members.find((x) => x.user_id === pickedOperator);
    const name = m?.profile?.display_name ?? m?.profile?.email ?? null;
    start.mutate(
      { operator_id: pickedOperator, operator_name: name },
      {
        onSuccess: (s) => navigate(`/oap/walkthrough/${s.id}`),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>OAP Walkthrough — Mentor Check-off</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold">OAP Mentor Walkthrough</h1>
        </div>

        {!activeSession && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Start a new walkthrough</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Operator</Label>
                  <Select value={pickedOperator} onValueChange={setPickedOperator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick an operator to evaluate" />
                    </SelectTrigger>
                    <SelectContent>
                      {(members ?? []).map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.profile?.display_name || m.profile?.email || m.user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleStart} disabled={!pickedOperator || start.isPending}>
                  <PlayCircle className="w-4 h-4 mr-1" /> Start walkthrough
                </Button>
              </div>

              {sessions.length > 0 && (
                <div className="border rounded-md divide-y mt-4">
                  <div className="px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
                    Recent sessions
                  </div>
                  {sessions.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/oap/walkthrough/${s.id}`)}
                      className="w-full text-left p-3 flex items-center justify-between hover:bg-muted/40 transition"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {s.operator_name ?? s.operator_id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(s.started_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={s.status === "completed" ? "default" : "secondary"}>
                        {s.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSession && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">
                    {activeSession.operator_name ?? "Operator"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Mentor: {activeSession.primary_mentor_name ?? "—"} · Started{" "}
                    {new Date(activeSession.started_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={activeSession.status === "completed" ? "default" : "secondary"}>
                    {activeSession.status}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {requiredPassedCount}/{requiredItemsCount} required passed
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate("/oap/walkthrough")}>
                  ← Back to sessions
                </Button>
                {activeSession.status !== "completed" && (
                  <Button
                    onClick={() => complete.mutate(activeSession.id)}
                    disabled={complete.isPending}
                  >
                    <Flag className="w-4 h-4 mr-1" /> Mark walkthrough complete
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    exportWalkthroughPdf({
                      organizationName: organization?.name ?? "Organization",
                      session: activeSession,
                      sections,
                      items,
                      checkoffs,
                    })
                  }
                >
                  <FileDown className="w-4 h-4 mr-1" /> Export compliance PDF
                </Button>
              </CardContent>
            </Card>

            {catalogLoading && (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">Loading…</CardContent>
              </Card>
            )}

            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                      {section.section_order}
                    </span>
                    {section.title}
                  </CardTitle>
                  {section.description && (
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <HandbookCite
                    entityType="oap_lesson"
                    entityId={section.id}
                    variant="card"
                  />
                  {(itemsBySection[section.id] ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No check-off items defined yet.
                    </p>
                  )}
                  {(itemsBySection[section.id] ?? []).map((item) => (
                    <CheckoffRow
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      isRequired={item.is_required}
                      existing={checkoffByItem[item.id]}
                      disabled={activeSession.status === "completed"}
                      onSubmit={(result, notes, sig) =>
                        checkoff.mutate({
                          section_id: section.id,
                          item_id: item.id,
                          result,
                          notes,
                          mentor_signature: sig,
                        })
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

function CheckoffRow({
  title,
  description,
  isRequired,
  existing,
  disabled,
  onSubmit,
}: {
  title: string;
  description: string | null;
  isRequired: boolean;
  existing?: { result: CheckoffResult; notes: string | null; mentor_name: string; signed_at: string };
  disabled?: boolean;
  onSubmit: (result: CheckoffResult, notes: string | null, signature: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [signature, setSignature] = useState("");

  const submit = (result: CheckoffResult) => {
    if (!signature.trim()) {
      alert("Type your name to sign the check-off");
      return;
    }
    onSubmit(result, notes || null, signature.trim());
    setExpanded(false);
  };

  const Meta = existing ? RESULT_META[existing.result] : null;

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium flex items-center gap-2">
            {title}
            {isRequired && <Badge variant="outline" className="text-[10px]">Required</Badge>}
          </div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
          {existing && Meta && (
            <div className={`text-xs flex items-center gap-1 ${Meta.tone}`}>
              <Meta.icon className="w-3.5 h-3.5" />
              {Meta.label} · {existing.mentor_name} ·{" "}
              {new Date(existing.signed_at).toLocaleDateString()}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant={existing ? "outline" : "default"}
          onClick={() => setExpanded((x) => !x)}
          disabled={disabled}
        >
          {existing ? "Update" : "Check off"}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 pt-2 border-t">
          <div className="space-y-1">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observations, coaching notes, follow-ups…"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mentor signature (type your name)</Label>
            <Input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => submit("pass")} variant="default">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Pass
            </Button>
            <Button size="sm" variant="outline" onClick={() => submit("needs_practice")}>
              <AlertCircle className="w-3.5 h-3.5 mr-1" /> Needs Practice
            </Button>
            <Button size="sm" variant="destructive" onClick={() => submit("fail")}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> Fail
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
