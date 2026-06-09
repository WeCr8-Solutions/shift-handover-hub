import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { IntakeModuleConfig, FieldDef } from "@/lib/concierge/intakeModuleSchema";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: IntakeModuleConfig;
  record: Record<string, any> | null;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  busy?: boolean;
}

function buildInitial(config: IntakeModuleConfig, record: Record<string, any> | null) {
  const out: Record<string, any> = {};
  config.fields.forEach((f) => {
    out[f.key] = record?.[f.key] ?? (config.defaults?.[f.key] ?? (f.type === "boolean" ? false : ""));
  });
  return out;
}

export function IntakeRecordDialog({ open, onOpenChange, config, record, onSubmit, busy }: Props) {
  const [values, setValues] = useState<Record<string, any>>(() => buildInitial(config, record));

  useEffect(() => {
    if (open) setValues(buildInitial(config, record));
  }, [open, config, record]);

  function setField(key: string, value: any) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit() {
    // Coerce empty strings to null for nullable fields and numbers
    const payload: Record<string, any> = {};
    config.fields.forEach((f) => {
      const raw = values[f.key];
      if (f.type === "number") {
        payload[f.key] = raw === "" || raw == null ? null : Number(raw);
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
