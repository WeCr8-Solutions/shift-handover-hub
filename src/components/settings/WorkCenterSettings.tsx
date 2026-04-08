import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Wrench, Settings, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkCenterConfigs, WorkCenterConfig } from "@/hooks/useWorkCenterConfigs";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { WorkCenterType } from "@/types/handoff";
import { cn } from "@/lib/utils";
import { WorkCenterTypeCombobox } from "@/components/ui/WorkCenterTypeCombobox";

const WORK_CENTER_TYPES: WorkCenterType[] = [
  "CNC Mill", "CNC Lathe", "Water Jet", "Press Brake",
  "TIG Welding", "MIG Welding", "Punch Press",
  "Hardware Installation", "Shipping", "Tool Crib",
];

type WorkCenterFormData = {
  work_center_type: string;
  display_name: string;
  default_cycle_time: number;
  default_setup_time: number;
  requires_first_article: boolean;
  requires_qa_signoff: boolean;
  track_scrap: boolean;
  track_rework: boolean;
  is_active: boolean;
  sort_order: number;
};

export function WorkCenterSettings() {
  const { toast } = useToast();
  const { workCenterConfigs = [], createWorkCenterConfig, updateWorkCenterConfig, loading } = useWorkCenterConfigs();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WorkCenterConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<WorkCenterFormData>({
    work_center_type: "",
    display_name: "",
    default_cycle_time: 60,
    default_setup_time: 30,
    requires_first_article: true,
    requires_qa_signoff: false,
    track_scrap: true,
    track_rework: true,
    is_active: true,
    sort_order: 0,
  });

  const resetForm = () => {
    setFormData({
      work_center_type: "", display_name: "", default_cycle_time: 60, default_setup_time: 30,
      requires_first_article: true, requires_qa_signoff: false, track_scrap: true, track_rework: true,
      is_active: true, sort_order: workCenterConfigs.length,
    });
    setEditingConfig(null);
  };

  const handleOpenEdit = (config: WorkCenterConfig) => {
    setEditingConfig(config);
    setFormData({
      work_center_type: config.work_center_type,
      display_name: config.display_name,
      default_cycle_time: config.default_cycle_time || 60,
      default_setup_time: config.default_setup_time || 30,
      requires_first_article: config.requires_first_article,
      requires_qa_signoff: config.requires_qa_signoff,
      track_scrap: config.track_scrap,
      track_rework: config.track_rework,
      is_active: config.is_active,
      sort_order: config.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.work_center_type || !formData.display_name.trim()) {
      toast({ title: "Missing required fields", description: "Work center type and display name are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const payload = {
      ...formData,
      display_name: formData.display_name.trim(),
      default_cycle_time: Math.max(1, formData.default_cycle_time || 60),
      default_setup_time: Math.max(1, formData.default_setup_time || 30),
      sort_order: Number.isFinite(formData.sort_order) ? formData.sort_order : 0,
    };

    try {
      if (editingConfig) {
        const { error } = await updateWorkCenterConfig(editingConfig.id, payload);
        if (error) { toast({ title: "Failed to update config", description: error, variant: "destructive" }); return; }
        toast({ title: "Work center config updated" });
      } else {
        const { error } = await createWorkCenterConfig(payload as Omit<WorkCenterConfig, "id">);
        if (error) { toast({ title: "Failed to create config", description: error, variant: "destructive" }); return; }
        toast({ title: "Work center config created" });
      }
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (config: WorkCenterConfig) => {
    const { error } = await updateWorkCenterConfig(config.id, { is_active: !config.is_active });
    if (error) { toast({ title: "Failed to update work center", description: error, variant: "destructive" }); }
  };

  const configuredTypes = workCenterConfigs.map((c) => c.work_center_type);
  const availableTypes = WORK_CENTER_TYPES.filter((t) => !configuredTypes.includes(t));

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="py-4 space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-48" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Work Center Configuration</CardTitle>
            <CardDescription>Configure defaults and settings for each work center type</CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!editingConfig && availableTypes.length === 0}>
                <Plus className="h-4 w-4" />Add Work Center
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingConfig ? "Edit Work Center" : "Add Work Center Config"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Work Center Type</Label>
                    <WorkCenterTypeCombobox
                      value={formData.work_center_type}
                      onValueChange={(v) => { setFormData((p) => ({ ...p, work_center_type: v, display_name: p.display_name || v })); }}
                      disabled={!!editingConfig}
                      excludeTypes={editingConfig ? [] : configuredTypes}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={formData.display_name} onChange={(e) => setFormData((p) => ({ ...p, display_name: e.target.value }))} placeholder="Custom name" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Cycle Time (min)</Label>
                    <Input type="number" min={1} value={formData.default_cycle_time} onChange={(e) => setFormData((p) => ({ ...p, default_cycle_time: parseInt(e.target.value, 10) || 60 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Setup Time (min)</Label>
                    <Input type="number" min={1} value={formData.default_setup_time} onChange={(e) => setFormData((p) => ({ ...p, default_setup_time: parseInt(e.target.value, 10) || 30 }))} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Requirements</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between rounded border p-2">
                      <span className="text-sm">First Article</span>
                      <Switch checked={formData.requires_first_article} onCheckedChange={(v) => setFormData((p) => ({ ...p, requires_first_article: v }))} />
                    </div>
                    <div className="flex items-center justify-between rounded border p-2">
                      <span className="text-sm">QA Sign-off</span>
                      <Switch checked={formData.requires_qa_signoff} onCheckedChange={(v) => setFormData((p) => ({ ...p, requires_qa_signoff: v }))} />
                    </div>
                    <div className="flex items-center justify-between rounded border p-2">
                      <span className="text-sm">Track Scrap</span>
                      <Switch checked={formData.track_scrap} onCheckedChange={(v) => setFormData((p) => ({ ...p, track_scrap: v }))} />
                    </div>
                    <div className="flex items-center justify-between rounded border p-2">
                      <span className="text-sm">Track Rework</span>
                      <Switch checked={formData.track_rework} onCheckedChange={(v) => setFormData((p) => ({ ...p, track_rework: v }))} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))} />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : editingConfig ? "Update Config" : "Create Config"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {workCenterConfigs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Wrench className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No work centers configured</p>
              <p className="text-sm">Add work center configurations to set defaults</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workCenterConfigs.map((config) => {
                const Icon = workCenterIcons[config.work_center_type as WorkCenterType] || Wrench;
                const iconColor = workCenterColors[config.work_center_type as WorkCenterType] || "text-muted-foreground";

                return (
                  <div key={config.id} className={cn("flex items-center justify-between rounded-lg border bg-background p-4", !config.is_active && "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                      <div className={cn("rounded-lg bg-secondary p-2", iconColor)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{config.display_name}</span>
                          <Badge variant="outline">{config.work_center_type}</Badge>
                          {!config.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                          <span>Cycle: {config.default_cycle_time}min</span>
                          <span>Setup: {config.default_setup_time}min</span>
                          {config.requires_first_article && <Badge variant="outline" className="text-[10px]">FAI</Badge>}
                          {config.requires_qa_signoff && <Badge variant="outline" className="text-[10px]">QA</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={config.is_active} onCheckedChange={() => handleToggleActive(config)} />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(config)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {availableTypes.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Available Work Center Types</CardTitle>
            <CardDescription>These types haven't been configured yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map((type) => {
                const Icon = workCenterIcons[type] || Wrench;
                return (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      setEditingConfig(null);
                      setFormData({
                        work_center_type: type, display_name: type, default_cycle_time: 60, default_setup_time: 30,
                        requires_first_article: true, requires_qa_signoff: false, track_scrap: true, track_rework: true,
                        is_active: true, sort_order: workCenterConfigs.length,
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Icon className="mr-1 h-3 w-3" />{type}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
