import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Clock, Trash2, Edit, Sun, Moon, Sunrise } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShiftSchedules, ShiftSchedule } from "@/hooks/useShiftSchedules";
import { cn } from "@/lib/utils";

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const SHIFT_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

type ShiftFormData = {
  shift_name: string;
  shift_code: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  is_active: boolean;
  color: string;
};

const DEFAULT_FORM: ShiftFormData = {
  shift_name: "",
  shift_code: "",
  start_time: "06:00",
  end_time: "14:00",
  days_of_week: [1, 2, 3, 4, 5],
  is_active: true,
  color: "#3b82f6",
};

export function ShiftSettings() {
  const { toast } = useToast();
  const { shifts = [], createShift, updateShift, deleteShift, loading } = useShiftSchedules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ShiftFormData>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ShiftSchedule | null>(null);

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditingShift(null);
  };

  const handleOpenEdit = (shift: ShiftSchedule) => {
    setEditingShift(shift);
    setFormData({
      shift_name: shift.shift_name ?? "",
      shift_code: shift.shift_code ?? "",
      start_time: shift.start_time ?? "06:00",
      end_time: shift.end_time ?? "14:00",
      days_of_week: Array.isArray(shift.days_of_week) ? shift.days_of_week : [1, 2, 3, 4, 5],
      is_active: shift.is_active ?? true,
      color: shift.color ?? "#3b82f6",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.shift_name.trim() || !formData.shift_code.trim()) {
      toast({
        title: "Missing required fields",
        description: "Shift name and shift code are required.",
        variant: "destructive",
      });
      return;
    }

    if (formData.days_of_week.length === 0) {
      toast({
        title: "No days selected",
        description: "Select at least one day for the shift.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const payload = {
      shift_name: formData.shift_name.trim(),
      shift_code: formData.shift_code.trim().toUpperCase(),
      start_time: formData.start_time,
      end_time: formData.end_time,
      days_of_week: formData.days_of_week,
      is_active: formData.is_active,
      color: formData.color,
    };

    try {
      if (editingShift) {
        const { error } = await updateShift(editingShift.id, payload);
        if (error) {
          toast({ title: "Failed to update shift", description: error, variant: "destructive" });
          return;
        }
        toast({ title: "Shift updated" });
      } else {
        const { error } = await createShift(payload as Omit<ShiftSchedule, "id">);
        if (error) {
          toast({ title: "Failed to create shift", description: error, variant: "destructive" });
          return;
        }
        toast({ title: "Shift created" });
      }

      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await deleteShift(deleteTarget.id);
    setDeleteTarget(null);

    if (error) {
      toast({ title: "Failed to delete shift", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Shift deleted" });
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b),
    }));
  };

  const getShiftIcon = (startTime: string) => {
    const hour = Number.parseInt(startTime.split(":")[0] ?? "0", 10);
    if (hour >= 5 && hour < 12) return Sun;
    if (hour >= 12 && hour < 18) return Sunrise;
    return Moon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Shift Schedules
            </CardTitle>
            <CardDescription>Configure your manufacturing shift schedules</CardDescription>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Shift
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingShift ? "Edit Shift" : "Add New Shift"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shift Name</Label>
                    <Input
                      value={formData.shift_name}
                      onChange={(e) => setFormData((p) => ({ ...p, shift_name: e.target.value }))}
                      placeholder="Day Shift"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shift Code</Label>
                    <Input
                      value={formData.shift_code}
                      onChange={(e) => setFormData((p) => ({ ...p, shift_code: e.target.value.toUpperCase() }))}
                      placeholder="DAY"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={formData.start_time} onChange={(e) => setFormData((p) => ({ ...p, start_time: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={formData.end_time} onChange={(e) => setFormData((p) => ({ ...p, end_time: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex gap-2">
                    {DAYS.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={formData.days_of_week.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                        className="h-10 w-10 p-0"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {SHIFT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, color }))}
                        className={cn(
                          "h-8 w-8 rounded-full border-2",
                          formData.color === color ? "border-foreground" : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))} />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingShift ? (
                    "Update Shift"
                  ) : (
                    "Create Shift"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {shifts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No shifts configured</p>
              <p className="text-sm">Add your first shift schedule to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => {
                const ShiftIcon = getShiftIcon(shift.start_time);

                return (
                  <div key={shift.id} className="flex items-center justify-between rounded-lg border bg-background p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${shift.color}20` }}
                      >
                        <ShiftIcon className="h-5 w-5" style={{ color: shift.color }} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{shift.shift_name}</span>
                          <Badge variant="outline">{shift.shift_code}</Badge>
                          {!shift.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {shift.start_time} - {shift.end_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {DAYS.map((day) => (
                          <span
                            key={day.value}
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded text-xs",
                              shift.days_of_week.includes(day.value)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {day.label[0]}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(shift)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(shift)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.shift_name}</strong> ({deleteTarget?.shift_code})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
