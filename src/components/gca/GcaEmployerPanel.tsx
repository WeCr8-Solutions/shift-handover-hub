import { useState } from "react";
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
import { useGcaAssignments, useGcaBanks } from "@/hooks/useGcaAssignments";
import { CertificateIssuancePanel } from "@/components/certificates/CertificateIssuancePanel";
import { GraduationCap, UserPlus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Employer-facing G-Code Academy assignment console.
 * Lives at /gca/employer (org admin / supervisor only).
 */
export function GcaEmployerPanel() {
  const { organization } = useOrganization();
  const { members } = useOrganizationMembers(organization?.id ?? null);
  const { data: banks = [] } = useGcaBanks();
  const { assignments, isLoading, assign, updateStatus, remove } = useGcaAssignments();

  const [userId, setUserId] = useState("");
  const [bankId, setBankId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");

  const memberById = (id: string) => (members ?? []).find((m: any) => m.user_id === id);
  const bankById = (id: string) => banks.find((b) => b.id === id);

  const submit = () => {
    if (!userId || !bankId) {
      toast.error("Pick an operator and a GCA bank");
      return;
    }
    assign.mutate(
      {
        user_id: userId,
        bank_id: bankId,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setUserId("");
          setBankId("");
          setDueAt("");
          setNotes("");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Assign GCA Coursework
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Pick an operator, choose a G-Code Academy question bank, and set a
            due date. Operators see their assigned banks in their dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Operator</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick operator" />
                </SelectTrigger>
                <SelectContent>
                  {(members ?? []).map((m: any) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.display_name || m.profile?.email || m.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">GCA Question Bank</Label>
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title}{" "}
                      <span className="text-muted-foreground text-xs">({b.difficulty})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due date (optional)</Label>
              <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                rows={1}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Required before mill cell qualification"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button onClick={submit} disabled={assign.isPending}>
              <UserPlus className="w-4 h-4 mr-1" /> Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Active Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md divide-y">
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            )}
            {!isLoading && assignments.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No GCA assignments yet.
              </div>
            )}
            {assignments.map((a) => {
              const m = memberById(a.user_id);
              const b = bankById(a.bank_id);
              const overdue =
                a.due_at && !a.completed_at && new Date(a.due_at) < new Date();
              return (
                <div
                  key={a.id}
                  className="p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {m?.profile?.display_name || m?.profile?.email || a.user_id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {b?.title ?? "—"}
                      {a.due_at && (
                        <> · due {new Date(a.due_at).toLocaleDateString()}</>
                      )}
                      {a.notes && <> · {a.notes}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        a.status === "completed"
                          ? "default"
                          : overdue
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {a.status === "completed"
                        ? "Completed"
                        : overdue
                          ? "Overdue"
                          : a.status}
                    </Badge>
                    {a.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStatus.mutate({ id: a.id, status: "completed" })
                        }
                        title="Mark complete"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove.mutate(a.id)}
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Free issuance for org admins/supervisors */}
      {organization?.id && (
        <CertificateIssuancePanel defaultOrgId={organization.id} />
      )}
    </div>
  );
}
