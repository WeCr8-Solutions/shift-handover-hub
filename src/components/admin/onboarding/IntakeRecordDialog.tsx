import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { IntakeModuleConfig, FieldDef } from "@/lib/concierge/intakeModuleSchema";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: IntakeModuleConfig;
  record: Record<string, any> | null;
  /** Organization id used to scope dynamic select_from options. */
  orgId: string | null;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  busy?: boolean;
}

function buildInitial(config: IntakeModuleConfig, record: Record<string, any> | null) {
  const out: Record<string, any> = {};
  config.fields.forEach((f) => {
    const def = config.defaults?.[f.key];
    out[f.key] = record?.[f.key] ?? def ?? (f.type === "boolean" ? false : "");
  });
  return out;
}

const NULL_OPTION = "__null__";

function SelectFromField({
  field, orgId, value, onChange,
}: { field: FieldDef; orgId: string | null; value: any; onChange: (v: any) => void }) {
  const src = field.source!;
  const valueField = src.valueField ?? "id";
  const q = useQuery({
    queryKey: ["concierge-select-options", src.table, orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(src.table)
        .select(`${valueField}, ${src.labelField}`)
        .eq("organization_id", orgId!)
        .order(src.labelField, { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<Record<string, any>>;
    },
  });
  const rows = q.data ?? [];
  return (
    <Select
      value={value == null || value === "" ? (field.required ? "" : NULL_OPTION) : String(value)}
      onValueChange={(v) => onChange(v === NULL_OPTION ? null : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={q.isLoading ? "Loading…" : `Select ${field.label.toLowerCase()}…`} />
      </SelectTrigger>
      <SelectContent>
        {!field.required && <SelectItem value={NULL_OPTION}>— None —</SelectItem>}
        {rows.length === 0 && !q.isLoading && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No options yet.</div>
        )}
        {rows.map((r) => (
          <SelectItem key={String(r[valueField])} value={String(r[valueField])}>
            {String(r[src.labelField] ?? r[valueField])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function IntakeRecordDialog({ open, onOpenChange, config, record, orgId, onSubmit, busy }: Props) {
  const [values, setValues] = useState<Record<string, any>>(() => buildInitial(config, record));

  useEffect(() => {
    if (open) setValues(buildInitial(config, record));
  }, [open, config, record]);

  function setField(key: string, value: any) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit() {
    const payload: Record<string, any> = {};
    config.fields.forEach((f) => {
      const raw = values[f.key];
      if (f.type === "number") {
        payload[f.key] = raw === "" || raw == null ? null : Number(raw);
      } else if (f.type === "boolean") {
        payload[f.key] = !!raw;
      } else if (typeof raw === "string") {
        payload[f.key] = raw.trim() === "" ? null : raw.trim();
      } else {
        payload[f.key] = raw;
      }
    });
    await onSubmit(payload);
  }

  const isEditing = !!record?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit ${config.noun}` : `Add ${config.noun}`}</DialogTitle>
          <DialogDescription>
            Changes write directly to the live <span className="font-mono text-xs">{config.table}</span> table and apply immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {config.fields.map((f: FieldDef) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`field-${f.key}`} className="text-xs flex items-center gap-1">
                {f.label}
                {f.required && <span className="text-destructive">*</span>}
              </Label>
              {f.type === "textarea" && (
                <Textarea id={`field-${f.key}`} value={values[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)} rows={2} />
              )}
              {f.type === "select" && (
                <Select value={values[f.key] ?? ""} onValueChange={(v) => setField(f.key, v)}>
                  <SelectTrigger id={`field-${f.key}`}><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {f.type === "select_from" && (
                <SelectFromField field={f} orgId={orgId} value={values[f.key]} onChange={(v) => setField(f.key, v)} />
              )}
              {f.type === "boolean" && (
                <Switch checked={!!values[f.key]} onCheckedChange={(v) => setField(f.key, v)} />
              )}
              {(f.type === "text" || f.type === "email" || f.type === "number") && (
                <Input
                  id={`field-${f.key}`}
                  type={f.type === "email" ? "email" : f.type === "number" ? "number" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
              {f.help && <p className="text-[10px] text-muted-foreground">{f.help}</p>}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditing ? "Save changes" : `Add ${config.noun}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
