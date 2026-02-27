import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useStations } from "@/hooks/useStations";
import { useJobPerformanceUpdates, UpdateType, Priority } from "@/hooks/useJobPerformanceUpdates";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Settings, 
  Wrench, 
  Lightbulb, 
  AlertTriangle,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Send,
  Trash2,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const updateTypes: { value: UpdateType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: "setup_change", label: "Setup Change", icon: Settings, color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  { value: "adjustment", label: "Adjustment", icon: Wrench, color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  { value: "improvement", label: "Improvement", icon: Lightbulb, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  { value: "issue", label: "Issue/Problem", icon: AlertTriangle, color: "bg-red-500/10 text-red-500 border-red-500/30" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "bg-gray-500/10 text-gray-500 border-gray-500/30" },
];

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-gray-500/10 text-gray-500" },
  { value: "normal", label: "Normal", color: "bg-blue-500/10 text-blue-500" },
  { value: "high", label: "High", color: "bg-amber-500/10 text-amber-500" },
  { value: "critical", label: "Critical", color: "bg-red-500/10 text-red-500" },
];

const impactCheckboxes = [
  { key: "affects_cycle_time", label: "Affects Cycle Time" },
  { key: "affects_quality", label: "Affects Quality" },
  { key: "affects_safety", label: "Affects Safety" },
];

const requirementCheckboxes = [
  { key: "requires_tooling_change", label: "Requires Tooling Change" },
  { key: "requires_program_update", label: "Requires Program Update" },
  { key: "requires_fixture_modification", label: "Requires Fixture Modification" },
  { key: "requires_engineering_review", label: "Requires Engineering Review" },
  { key: "requires_qa_approval", label: "Requires QA Approval" },
];

interface JobPerformanceUpdateFormProps {
  onClose: () => void;
}

export function JobPerformanceUpdateForm({ onClose }: JobPerformanceUpdateFormProps) {
  const { currentTeam } = useCurrentTeam();
  const { stations } = useStations(currentTeam?.id);
  const { createUpdate, uploadImage } = useJobPerformanceUpdates(currentTeam?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    stationId: "",
    workOrder: "",
    partNumber: "",
    operationNumber: "",
    updateType: "" as UpdateType | "",
    priority: "normal" as Priority,
    title: "",
    description: "",
    proposedSolution: "",
    expectedBenefit: "",
    // Checkboxes
    affects_cycle_time: false,
    affects_quality: false,
    affects_safety: false,
    requires_tooling_change: false,
    requires_program_update: false,
    requires_fixture_modification: false,
    requires_engineering_review: false,
    requires_qa_approval: false,
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    const newUrls: string[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }

      const { url, error } = await uploadImage(file);
      
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
      } else if (url) {
        newUrls.push(url);
      }
    }

    setUploadedImages((prev) => [...prev, ...newUrls]);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.updateType || !formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    const station = stations.find((s) => s.id === formData.stationId);

    const { error } = await createUpdate({
      team_id: currentTeam?.id || null,
      station_id: formData.stationId || null,
      work_order: formData.workOrder || undefined,
      part_number: formData.partNumber || undefined,
      operation_number: formData.operationNumber || undefined,
      update_type: formData.updateType,
      priority: formData.priority,
      title: formData.title,
      description: formData.description,
      proposed_solution: formData.proposedSolution || undefined,
      expected_benefit: formData.expectedBenefit || undefined,
      affects_cycle_time: formData.affects_cycle_time,
      affects_quality: formData.affects_quality,
      affects_safety: formData.affects_safety,
      requires_tooling_change: formData.requires_tooling_change,
      requires_program_update: formData.requires_program_update,
      requires_fixture_modification: formData.requires_fixture_modification,
      requires_engineering_review: formData.requires_engineering_review,
      requires_qa_approval: formData.requires_qa_approval,
      image_urls: uploadedImages,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      toast.success("Performance update submitted successfully!");
      onClose();
    }
  };

  const totalSteps = 3;
  const selectedType = updateTypes.find((t) => t.value === formData.updateType);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Job Performance Update</h2>
            <p className="text-xs text-muted-foreground">
              Suggest setup changes, adjustments, or improvements
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-secondary"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {step} of {totalSteps}:{" "}
            {step === 1 && "Type & Context"}
            {step === 2 && "Details & Impact"}
            {step === 3 && "Attachments & Submit"}
          </p>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <div className="space-y-4">
              {/* Update Type Selection */}
              <div className="space-y-2">
                <Label>Update Type *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {updateTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.updateType === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => updateField("updateType", type.value)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                          isSelected ? type.color + " border-current" : "border-border hover:border-muted-foreground/50"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => updateField("priority", p.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                        formData.priority === p.value 
                          ? p.color + " border-current" 
                          : "bg-secondary/50 border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Station */}
              <div className="space-y-2">
                <Label>Station (Optional)</Label>
                <Select value={formData.stationId} onValueChange={(v) => updateField("stationId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => {
                      const Icon = workCenterIcons[s.work_center_type] || Circle;
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", workCenterColors[s.work_center_type])} />
                            <span className="font-mono">{s.station_id}</span>
                            <span className="text-muted-foreground">- {s.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Context */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Work Order</Label>
                  <Input
                    value={formData.workOrder}
                    onChange={(e) => updateField("workOrder", e.target.value)}
                    placeholder="Enter work order number"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Part Number</Label>
                  <Input
                    value={formData.partNumber}
                    onChange={(e) => updateField("partNumber", e.target.value)}
                    placeholder="Enter part number"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operation</Label>
                  <Input
                    value={formData.operationNumber}
                    onChange={(e) => updateField("operationNumber", e.target.value)}
                    placeholder="Enter operation"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Brief summary of the update"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the change, adjustment, or improvement in detail..."
                  rows={3}
                />
              </div>

              {/* Proposed Solution */}
              <div className="space-y-2">
                <Label>Proposed Solution</Label>
                <Textarea
                  value={formData.proposedSolution}
                  onChange={(e) => updateField("proposedSolution", e.target.value)}
                  placeholder="How should this be implemented?"
                  rows={2}
                />
              </div>

              {/* Expected Benefit */}
              <div className="space-y-2">
                <Label>Expected Benefit</Label>
                <Textarea
                  value={formData.expectedBenefit}
                  onChange={(e) => updateField("expectedBenefit", e.target.value)}
                  placeholder="What improvements are expected?"
                  rows={2}
                />
              </div>

              {/* Impact Checkboxes */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Impact Areas</Label>
                <div className="grid grid-cols-3 gap-2">
                  {impactCheckboxes.map((item) => (
                    <label
                      key={item.key}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                        formData[item.key as keyof typeof formData]
                          ? "bg-primary/10 border-primary/30"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <Checkbox
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onCheckedChange={(c) => updateField(item.key, c)}
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Requirements Checkboxes */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Requirements</Label>
                <div className="grid grid-cols-2 gap-2">
                  {requirementCheckboxes.map((item) => (
                    <label
                      key={item.key}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                        formData[item.key as keyof typeof formData]
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <Checkbox
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onCheckedChange={(c) => updateField(item.key, c)}
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Attach Images (Optional)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isUploading && "opacity-50 pointer-events-none"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        PNG, JPG up to 10MB each
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Images</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Type:</span>
                    {selectedType && (
                      <Badge className={selectedType.color}>
                        {selectedType.label}
                      </Badge>
                    )}
                    <Badge className={priorities.find((p) => p.value === formData.priority)?.color}>
                      {formData.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Title:</span>{" "}
                    <span className="font-medium">{formData.title || "—"}</span>
                  </div>
                  {formData.description && (
                    <div>
                      <span className="text-muted-foreground">Description:</span>{" "}
                      <span className="text-muted-foreground/80 line-clamp-2">
                        {formData.description}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {formData.affects_cycle_time && <Badge variant="outline">Cycle Time</Badge>}
                    {formData.affects_quality && <Badge variant="outline">Quality</Badge>}
                    {formData.affects_safety && <Badge variant="outline">Safety</Badge>}
                    {formData.requires_tooling_change && <Badge variant="outline">Tooling</Badge>}
                    {formData.requires_program_update && <Badge variant="outline">Program</Badge>}
                    {formData.requires_fixture_modification && <Badge variant="outline">Fixture</Badge>}
                    {formData.requires_engineering_review && <Badge variant="outline">Engineering</Badge>}
                    {formData.requires_qa_approval && <Badge variant="outline">QA</Badge>}
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                      <span>{uploadedImages.length} image(s) attached</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={() => setStep(Math.min(totalSteps, step + 1))}
              disabled={step === 1 && !formData.updateType}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title || !formData.description}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Update
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
