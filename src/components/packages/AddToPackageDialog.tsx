import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePackages } from "@/hooks/usePackages";
import { CreatePackageDialog } from "./CreatePackageDialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemIds: string[];
  onAdded?: () => void;
}

export function AddToPackageDialog({ open, onOpenChange, itemIds, onAdded }: Props) {
  const { packages, addItems, refresh } = usePackages();
  const [selected, setSelected] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await addItems(selected, itemIds);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Added ${itemIds.length} item${itemIds.length === 1 ? "" : "s"} to package`);
    onOpenChange(false);
    onAdded?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Package</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Choose existing package</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package…" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.package_number} — {p.title}
                      {p.required_ship_date ? ` (ship ${p.required_ship_date})` : ""}
                    </SelectItem>
                  ))}
                  {packages.length === 0 && (
                    <div className="px-2 py-3 text-sm text-muted-foreground">No open packages yet.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setCreateOpen(true)}>
              + Create new package
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!selected || saving}>
              Add to Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CreatePackageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async (pkg) => {
          await refresh();
          setSelected(pkg.id);
        }}
      />
    </>
  );
}
