import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, LayoutGrid, Loader2 } from "lucide-react";
import { useIntakeModule } from "@/hooks/useIntakeModule";
import { INTAKE_MODULE_CONFIGS, hasTileGridConfig } from "@/lib/concierge/intakeModuleSchema";
import type { IntakeWorksheetKey } from "@/lib/concierge/intakeColumns";
import { IntakeRecordDialog } from "./IntakeRecordDialog";

interface Props {
  module: IntakeWorksheetKey;
  orgId: string | null;
  title?: string;
  description?: string;
}

export function IntakeTileGrid({ module, orgId, title, description }: Props) {
  const config = INTAKE_MODULE_CONFIGS[module];
  const { list, create, update, remove } = useIntakeModule(module, orgId);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!hasTileGridConfig(module) || !config) {
    return (
      <Card>
        <CardContent className="py-6 text-xs text-muted-foreground text-center">
          Tile grid not configured for this module.
        </CardContent>
      </Card>
    );
  }

  const records = list.data ?? [];

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(r: Record<string, any>) {
    setEditing(r);
    setDialogOpen(true);
  }

  async function handleSubmit(values: Record<string, any>) {
    if (editing?.id) {
      await update.mutateAsync({ id: editing.id, values });
    } else {
      await create.mutateAsync(values);
    }
    setDialogOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="w-4 h-4" />
              {title ?? `${config.noun}s`}
              <Badge variant="secondary" className="text-[10px]">{records.length}</Badge>
            </CardTitle>
            <CardDescription>
              {description ?? `Manage ${config.noun.toLowerCase()}s directly. Edits write to the live ${config.table} table.`}
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreate} disabled={!orgId} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add {config.noun}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {list.isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</div>
        )}
        {!list.isLoading && records.length === 0 && (
          <div className="border border-dashed rounded-md p-6 text-center text-xs text-muted-foreground">
            No {config.noun.toLowerCase()}s yet.
            {orgId ? <> Click <span className="font-medium">Add {config.noun}</span> or bulk-upload via the worksheet template.</> : " Pick an engagement to begin."}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => {
            const tileTitle = String(r[config.titleField] ?? "Untitled");
            const subs = config.subtitleFields
              .map((f) => r[f])
              .filter((v) => v !== null && v !== undefined && v !== "")
              .map((v) => String(v));
            return (
              <div key={r.id} className="border rounded-md p-3 text-xs hover:bg-muted/30 transition-colors space-y-2">
                <div className="font-medium text-sm truncate">{tileTitle}</div>
                {subs.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {subs.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-normal">{s}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-1 pt-1 border-t">
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={() => openEdit(r)}>
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{tileTitle}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the row from <span className="font-mono">{config.table}</span> and any linked production data may be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove.mutate(r.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <IntakeRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={config}
        record={editing}
        orgId={orgId}
        onSubmit={handleSubmit}
        busy={create.isPending || update.isPending}
      />
    </Card>
  );
}
