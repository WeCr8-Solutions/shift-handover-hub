import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreateQueueItemInput, QueueItemType, QueuePriority } from "@/hooks/useQueue";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";

interface CreateQueueItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateQueueItemInput) => Promise<{ error: string | null }>;
}

const typeOptions: { value: QueueItemType; label: string; description: string }[] = [
  { value: "work_order", label: "Work Order", description: "Manufacturing work order queue item" },
  { value: "station_task", label: "Station Task", description: "Task assigned to a specific station" },
  { value: "team_task", label: "Team Task", description: "General task for team members" },
  { value: "support_ticket", label: "Support Ticket", description: "Support or issue ticket" },
];

const priorityOptions: { value: QueuePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
  { value: "critical", label: "Critical" },
];

export function CreateQueueItemDialog({ open, onOpenChange, onCreate }: CreateQueueItemDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateQueueItemInput>({
    item_type: "team_task",
    title: "",
    description: "",
    priority: "normal",
  });
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await onCreate({
      ...formData,
      due_date: dueDate?.toISOString(),
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Queue item created" });
      onOpenChange(false);
      // Reset form
      setFormData({
        item_type: "team_task",
        title: "",
        description: "",
        priority: "normal",
      });
      setDueDate(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Queue Item</DialogTitle>
          <DialogDescription>
            Add a new item to the queue for tracking and prioritization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.item_type}
                onValueChange={(value) => setFormData({ ...formData, item_type: value as QueueItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as QueuePriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter item title..."
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter item description..."
              rows={3}
            />
          </div>

          {formData.item_type === "work_order" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Work Order</Label>
                <Input
                  value={formData.work_order || ""}
                  onChange={(e) => setFormData({ ...formData, work_order: e.target.value })}
                  placeholder="WO-12345"
                />
              </div>
              <div className="space-y-2">
                <Label>Part Number</Label>
                <Input
                  value={formData.part_number || ""}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  placeholder="PN-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || undefined })}
                  placeholder="100"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Estimated Duration (min)</Label>
              <Input
                type="number"
                value={formData.estimated_duration || ""}
                onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || undefined })}
                placeholder="60"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
