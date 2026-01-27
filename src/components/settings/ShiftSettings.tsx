import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Clock, Trash2, Edit, Sun, Moon, Sunrise } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings, ShiftSchedule } from "@/hooks/useAppSettings";
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

const SHIFT_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
];

export function ShiftSettings() {
  const { toast } = useToast();
  const { shifts, createShift, updateShift, deleteShift, loading } = useAppSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    shift_name: "",
    shift_code: "",
    start_time: "06:00",
    end_time: "14:00",
    days_of_week: [1, 2, 3, 4, 5] as number[],
    is_active: true,
    color: "#3b82f6",
  });

  const resetForm = () => {
    setFormData({
      shift_name: "",
      shift_code: "",
      start_time: "06:00",
      end_time: "14:00",
      days_of_week: [1, 2, 3, 4, 5],
      is_active: true,
      color: "#3b82f6",
    });
    setEditingShift(null);
  };

  const handleOpenEdit = (shift: ShiftSchedule) => {
    setEditingShift(shift);
    setFormData({
      shift_name: shift.shift_name,
      shift_code: shift.shift_code,
      start_time: shift.start_time,
      end_time: shift.end_time,
      days_of_week: shift.days_of_week,
      is_active: shift.is_active,
      color: shift.color,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.shift_name || !formData.shift_code) {
      toast({ title: "Missing required fields", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    if (editingShift) {
      const { error } = await updateShift(editingShift.id, formData);
      if (error) {
        toast({ title: "Failed to update shift", description: error, variant: "destructive" });
      } else {
        toast({ title: "Shift updated" });
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await createShift(formData as Omit<ShiftSchedule, "id">);
      if (error) {
        toast({ title: "Failed to create shift", description: error, variant: "destructive" });
      } else {
        toast({ title: "Shift created" });
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteShift(id);
    if (error) {
      toast({ title: "Failed to delete shift", description: error, variant: "destructive" });
    } else {
      toast({ title: "Shift deleted" });
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  const getShiftIcon = (startTime: string) => {
    const hour = parseInt(startTime.split(":")[0]);
    if (hour >= 5 && hour < 12) return Sun;
    if (hour >= 12 && hour < 18) return Sunrise;
    return Moon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Shift Schedules
            </CardTitle>
            <CardDescription>
              Configure your manufacturing shift schedules
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Shift
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingShift ? "Edit Shift" : "Add New Shift"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shift Name</Label>
                    <Input
                      value={formData.shift_name}
                      onChange={(e) => setFormData(p => ({ ...p, shift_name: e.target.value }))}
                      placeholder="Day Shift"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shift Code</Label>
                    <Input
                      value={formData.shift_code}
                      onChange={(e) => setFormData(p => ({ ...p, shift_code: e.target.value.toUpperCase() }))}
                      placeholder="DAY"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(p => ({ ...p, start_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(p => ({ ...p, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex gap-2">
                    {DAYS.map(day => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={formData.days_of_week.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                        className="w-10 h-10 p-0"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {SHIFT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, color }))}
                        className={cn(
                          "w-8 h-8 rounded-full border-2",
                          formData.color === color ? "border-foreground" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingShift ? "Update Shift" : "Create Shift")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No shifts configured</p>
              <p className="text-sm">Add your first shift schedule to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shifts.map(shift => {
                const ShiftIcon = getShiftIcon(shift.start_time);
                return (
                  <div 
                    key={shift.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${shift.color}20` }}
                      >
                        <ShiftIcon className="w-5 h-5" style={{ color: shift.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{shift.shift_name}</span>
                          <Badge variant="outline">{shift.shift_code}</Badge>
                          {!shift.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {shift.start_time} - {shift.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {DAYS.map(day => (
                          <span
                            key={day.value}
                            className={cn(
                              "text-xs w-6 h-6 flex items-center justify-center rounded",
                              shift.days_of_week.includes(day.value)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {day.label[0]}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(shift)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
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
    </div>
  );
}
