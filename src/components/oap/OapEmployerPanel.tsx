import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useOapCourses,
  useOapRolePrograms,
  useRoleProgramCourses,
  useOapEnrollments,
  type OapRoleProgram,
} from "@/hooks/useOapProgram";
import { useOrganization } from "@/hooks/useOrganization";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { Pencil, Plus, Trash2, Users, Briefcase, UserPlus } from "lucide-react";
import { toast } from "sonner";

/**
 * Employer-facing role program builder + bulk enroller.
 * Lives at /oap/employer (org admin / supervisor only).
 */
export function OapEmployerPanel() {
  const { organization } = useOrganization();
  const { members } = useOrganizationMembers(organization?.id ?? null);
  const { programs, upsert, remove } = useOapRolePrograms();
  const { enrollments, enroll } = useOapEnrollments();
  const [editing, setEditing] = useState<OapRoleProgram | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> OAP Role Programs
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Define what an "OAP Floor-Certified" operator looks like for each
              role at your shop — required courses, machines, tools, and
              operations.
            </p>
          </div>
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> New role program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create role program</DialogTitle>
              </DialogHeader>
              <RoleProgramForm
                onSave={(input) => {
                  upsert.mutate(input, { onSuccess: () => setCreating(false) });
                }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-2">
          {programs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No role programs yet. Create one for "Mill Operator", "Lathe Setter",
              etc.
            </p>
          )}
          {programs.map((p) => (
            <div key={p.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-sm">{p.name}</div>
                {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(p.required_machine_tags ?? []).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Dialog open={editing?.id === p.id} onOpenChange={(o) => !o && setEditing(null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit role program</DialogTitle>
                    </DialogHeader>
                    {editing && (
                      <RoleProgramForm
                        existing={editing}
                        onSave={(input) => {
                          upsert.mutate(
                            { ...input, id: editing.id },
                            { onSuccess: () => setEditing(null) },
                          );
                        }}
                      />
                    )}
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Operator Enrollments
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Assign operators to a role program with an expected completion date.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <EnrollOperatorRow
            members={members}
            programs={programs}
            onEnroll={(p) => enroll.mutate(p)}
          />

          <div className="border rounded-md divide-y">
            {enrollments.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No enrollments yet.</div>
            )}
            {enrollments.map((e) => {
              const m = (members ?? []).find((x) => x.user_id === e.user_id);
              const prog = programs.find((p) => p.id === e.role_program_id);
              const overdue =
                e.expected_completion_at &&
                !e.completed_at &&
                new Date(e.expected_completion_at) < new Date();
              return (
                <div key={e.id} className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {m?.profile?.display_name || m?.profile?.email || e.user_id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {prog?.name ?? "—"} · started{" "}
                      {e.started_at ? new Date(e.started_at).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <Badge
                    variant={
                      e.completed_at ? "default" : overdue ? "destructive" : "secondary"
                    }
                  >
                    {e.completed_at ? "Completed" : overdue ? "Overdue" : e.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RoleProgramForm({
  existing,
  onSave,
}: {
  existing?: OapRoleProgram;
  onSave: (input: {
    name: string;
    description?: string | null;
    required_machine_tags?: string[];
    required_inspection_tool_slugs?: string[];
    required_machining_operation_slugs?: string[];
    course_ids: string[];
  }) => void;
}) {
  const { data: courses = [] } = useOapCourses();
  const { data: existingCourses = [] } = useRoleProgramCourses(existing?.id ?? null);
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [machineTags, setMachineTags] = useState((existing?.required_machine_tags ?? []).join(", "));
  const [tools, setTools] = useState((existing?.required_inspection_tool_slugs ?? []).join(", "));
  const [ops, setOps] = useState((existing?.required_machining_operation_slugs ?? []).join(", "));
  const [courseIds, setCourseIds] = useState<Set<string>>(
    new Set(existingCourses.map((c) => c.course_id)),
  );

  // sync when existing courses load
  if (existing && existingCourses.length > 0 && courseIds.size === 0) {
    setCourseIds(new Set(existingCourses.map((c) => c.course_id)));
  }

  const toggle = (id: string) => {
    setCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      required_machine_tags: machineTags.split(",").map((t) => t.trim()).filter(Boolean),
      required_inspection_tool_slugs: tools.split(",").map((t) => t.trim()).filter(Boolean),
      required_machining_operation_slugs: ops.split(",").map((t) => t.trim()).filter(Boolean),
      course_ids: Array.from(courseIds),
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Role name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mill Operator" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Required courses</Label>
        <div className="border rounded-md p-2 space-y-1 max-h-56 overflow-auto">
          {courses.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={courseIds.has(c.id)} onCheckedChange={() => toggle(c.id)} />
              <span>
                {c.section_number}. {c.title}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Machine tags (CSV)</Label>
          <Input value={machineTags} onChange={(e) => setMachineTags(e.target.value)} placeholder="haas-vf2, fanuc-mill" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tool slugs (CSV)</Label>
          <Input value={tools} onChange={(e) => setTools(e.target.value)} placeholder="caliper-6in, mic-1in" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Op slugs (CSV)</Label>
          <Input value={ops} onChange={(e) => setOps(e.target.value)} placeholder="face-milling, drilling" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={submit}>Save role program</Button>
      </div>
    </div>
  );
}

function EnrollOperatorRow({
  members,
  programs,
  onEnroll,
}: {
  members: any[];
  programs: OapRoleProgram[];
  onEnroll: (p: { user_id: string; role_program_id: string; expected_days?: number }) => void;
}) {
  const [user, setUser] = useState("");
  const [prog, setProg] = useState("");
  const [days, setDays] = useState("30");

  const submit = () => {
    if (!user || !prog) {
      toast.error("Pick an operator and a role program");
      return;
    }
    onEnroll({ user_id: user, role_program_id: prog, expected_days: Number(days) || undefined });
    setUser("");
    setProg("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-2 items-end">
      <div className="space-y-1">
        <Label className="text-xs">Operator</Label>
        <Select value={user} onValueChange={setUser}>
          <SelectTrigger><SelectValue placeholder="Pick operator" /></SelectTrigger>
          <SelectContent>
            {(members ?? []).map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.profile?.display_name || m.profile?.email || m.user_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Role program</Label>
        <Select value={prog} onValueChange={setProg}>
          <SelectTrigger><SelectValue placeholder="Pick program" /></SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Due (days)</Label>
        <Input value={days} onChange={(e) => setDays(e.target.value)} type="number" min="1" />
      </div>
      <Button onClick={submit}>
        <UserPlus className="w-4 h-4 mr-1" /> Enroll
      </Button>
    </div>
  );
}
