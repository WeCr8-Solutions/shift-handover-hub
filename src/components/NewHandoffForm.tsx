import { useState, useEffect, useCallback, useRef, KeyboardEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getCurrentShift } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentTeam } from "@/contexts/TeamContext";
import { useStations, HandoffRecord } from "@/hooks/useStations";
import { useOrgContext } from "@/contexts/OrgContext";
import { JobState, TriState, WorkCenterType, Shift } from "@/types/handoff";
import { workCenterIcons, workCenterColors, getCategoryForType } from "@/lib/workCenterIcons";
import { X, Check, Minus, Save, ChevronRight, ChevronLeft, Loader2, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STORAGE_KEY = "handoff-form-draft";

export type HandoffType = "shift_end" | "station" | "operation";

const HANDOFF_TYPE_OPTIONS: { value: HandoffType; label: string; description: string }[] = [
  { value: "shift_end", label: "End of Shift", description: "Handing off to the next shift operator" },
  { value: "station", label: "Leaving Station", description: "Leaving this station (break, reassignment, etc.)" },
  { value: "operation", label: "Operation Complete", description: "Completed your operation — passing the job forward" },
];

const jobStates: JobState[] = [
  "Part Running",
  "Processing",
  "Setup in Progress",
  "First Article in Process",
  "Waiting on QA",
  "Waiting on Tooling",
  "Waiting on Material",
  "Machine Down / Issue",
  "Ready for Pickup",
  "On Hold",
];

// CNC-specific readiness items
const cncReadinessItems = [
  { key: "programLoaded", label: "Program Loaded" },
  { key: "programVerifiedAgainstSetup", label: "Program Verified Against Setup" },
  { key: "toolsInstalled", label: "Tools Installed" },
  { key: "toolsSetMeasured", label: "Tools Set/Measured" },
  { key: "toolListMatchesProgram", label: "Tool List Matches Program" },
  { key: "workOffsetsSet", label: "Work Offsets Set" },
  { key: "probingCompleted", label: "Probing Completed" },
  { key: "proveOutCompleted", label: "Prove Out Completed" },
];

// Generic equipment readiness items
const equipmentReadinessItems = [
  { key: "equipmentReady", label: "Equipment Ready" },
  { key: "safetyChecksComplete", label: "Safety Checks Complete" },
  { key: "toolsAvailable", label: "Tools/Consumables Available" },
  { key: "materialsStaged", label: "Materials Staged" },
  { key: "workInstructionsAvailable", label: "Work Instructions Available" },
  { key: "ppeVerified", label: "PPE Verified" },
];

const STEP_CONFIG = [
  { id: 1, label: "Job Info", shortLabel: "Job" },
  { id: 2, label: "Readiness", shortLabel: "Ready" },
  { id: 3, label: "Condition", shortLabel: "Cond" },
  { id: 4, label: "Summary", shortLabel: "Sum" },
];

function isCNCType(type: WorkCenterType): boolean {
  return type === "CNC Mill" || type === "CNC Lathe";
}

interface FormData {
  handoffType: HandoffType;
  stationId: string;
  stationDbId: string;
  workCenterType: WorkCenterType | "";
  workCenter: string;
  machineId: string;
  workOrder: string;
  partNumber: string;
  partRevision: string;
  operationNumber: string;
  outgoingOperator: string;
  incomingOperator: string;
  jobState: JobState | "";
  jobStateReason: string;
  cncReadiness: Record<string, TriState>;
  equipmentReadiness: Record<string, TriState>;
  readinessNotes: string;
  coolantLevel: string;
  airPressure: string;
  chipCondition: string;
  gasLevel: string;
  wireLevel: string;
  tipCondition: string;
  waterPressure: string;
  abrasiveLevel: string;
  activeAlarms: boolean;
  alarmNotes: string;
  partsCompleted: number;
  scrapCount: number;
  reworkCount: number;
  criticalDimsVerified: boolean;
  handoffSummary: string;
  /** Qty originally ordered on the active work order (display-only). */
  qtyOriginal: number;
  /** Qty still open / needed to be produced (display-only). */
  qtyOpen: number;
}

const getInitialFormData = (operatorName: string): FormData => ({
  handoffType: "shift_end",
  stationId: "",
  stationDbId: "",
  workCenterType: "",
  workCenter: "",
  machineId: "",
  workOrder: "",
  partNumber: "",
  partRevision: "",
  operationNumber: "",
  outgoingOperator: operatorName,
  incomingOperator: "",
  jobState: "",
  jobStateReason: "",
  cncReadiness: Object.fromEntries(cncReadinessItems.map((item) => [item.key, "N/A" as TriState])),
  equipmentReadiness: Object.fromEntries(equipmentReadinessItems.map((item) => [item.key, "N/A" as TriState])),
  readinessNotes: "",
  coolantLevel: "OK",
  airPressure: "OK",
  chipCondition: "Clear",
  gasLevel: "OK",
  wireLevel: "OK",
  tipCondition: "OK",
  waterPressure: "OK",
  abrasiveLevel: "OK",
  activeAlarms: false,
  alarmNotes: "",
  partsCompleted: 0,
  scrapCount: 0,
  reworkCount: 0,
  criticalDimsVerified: false,
  handoffSummary: "",
  qtyOriginal: 0,
  qtyOpen: 0,
});

interface NewHandoffFormProps {
  onClose: () => void;
  onSubmit?: (record: Omit<HandoffRecord, "id" | "created_at" | "updated_at" | "record_version">) => Promise<{ data: any; error: any }>;
  /** Pre-select a station by its database ID */
  initialStationId?: string;
  /** Pre-fill work order data from queue item */
  prefillData?: {
    work_order?: string;
    part_number?: string;
    operation_number?: string;
    station_id?: string;
    next_station_id?: string | null;
    next_station_name?: string | null;
    next_operation_name?: string | null;
    next_operation_number?: string | null;
  };
}

export function NewHandoffForm({ onClose, onSubmit, initialStationId, prefillData }: NewHandoffFormProps) {
  const { user, profile } = useAuth();
  const { currentTeam } = useCurrentTeam();
  const { organization } = useOrgContext();
  const { stations } = useStations(currentTeam?.id, organization?.id);
  
  const formRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [hasDraft, setHasDraft] = useState(false);
  
  const [formData, setFormData] = useState<FormData>(() => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasDraft(true);
        return { ...getInitialFormData(profile?.display_name || ""), ...parsed };
      }
    } catch (e) {
      console.error("Failed to restore draft:", e);
    }
    return getInitialFormData(profile?.display_name || "");
  });

  // Save draft to localStorage on form changes
  useEffect(() => {
    const hasContent = formData.stationDbId || formData.workOrder || formData.partNumber || formData.handoffSummary;
    if (hasContent) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // Clear draft on successful submit
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
  }, []);

  // Validation per step
  const validateStep = useCallback((stepNum: number): string[] => {
    const errors: string[] = [];
    
    if (stepNum === 1) {
      if (!formData.stationDbId) errors.push("Station is required");
      if (!formData.jobState) errors.push("Job State is required");
      if (!formData.partNumber) errors.push("Part Number is required");
      if (!formData.outgoingOperator) errors.push("Outgoing Operator is required");
    } else if (stepNum === 4) {
      if (!formData.handoffSummary.trim()) errors.push("Handoff Summary is required");
    }
    
    return errors;
  }, [formData]);

  // Check if step is valid
  const isStepValid = useCallback((stepNum: number): boolean => {
    return validateStep(stepNum).length === 0;
  }, [validateStep]);

  // Get step status for UI
  const getStepStatus = useCallback((stepNum: number): 'completed' | 'current' | 'incomplete' | 'error' => {
    if (stepNum === step) return 'current';
    if (completedSteps.has(stepNum)) return 'completed';
    if (stepNum < step && !isStepValid(stepNum)) return 'error';
    return 'incomplete';
  }, [step, completedSteps, isStepValid]);

  // Handle step navigation
  const goToStep = useCallback((targetStep: number) => {
    if (targetStep < 1 || targetStep > 4) return;
    
    // Validate current step before leaving
    const errors = validateStep(step);
    setValidationErrors(prev => ({ ...prev, [step]: errors }));
    
    // Mark current step as completed if valid
    if (errors.length === 0) {
      setCompletedSteps(prev => new Set([...prev, step]));
    }
    
    setStep(targetStep);
  }, [step, validateStep]);

  const handleNext = useCallback(() => {
    const errors = validateStep(step);
    setValidationErrors(prev => ({ ...prev, [step]: errors }));
    
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    
    setCompletedSteps(prev => new Set([...prev, step]));
    setStep(s => Math.min(4, s + 1));
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    setStep(s => Math.max(1, s - 1));
  }, []);

  // Handle close with unsaved changes warning
  const handleClose = useCallback(() => {
    const hasContent = formData.stationDbId || formData.workOrder || formData.partNumber || formData.handoffSummary;
    if (hasContent) {
      setShowCloseDialog(true);
    } else {
      onClose();
    }
  }, [formData, onClose]);

  const confirmClose = useCallback((saveDraft: boolean) => {
    if (!saveDraft) {
      clearDraft();
    }
    setShowCloseDialog(false);
    onClose();
  }, [clearDraft, onClose]);

  // Auto-select station when initialStationId is provided
  useEffect(() => {
    if (initialStationId && stations.length > 0 && !formData.stationDbId) {
      handleStationChange(initialStationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStationId, stations.length]);

  // Apply prefill data from queue item
  useEffect(() => {
    if (prefillData && stations.length > 0) {
      const updates: Partial<FormData> = {};
      if (prefillData.work_order) updates.workOrder = prefillData.work_order;
      if (prefillData.part_number) updates.partNumber = prefillData.part_number;
      if (prefillData.operation_number) updates.operationNumber = prefillData.operation_number;
      if (prefillData.station_id && !initialStationId) {
        // Station will be handled by initialStationId effect if both are set
        handleStationChange(prefillData.station_id);
      }
      if (prefillData.next_station_name || prefillData.next_operation_name) {
        const nextOpParts = [
          prefillData.next_operation_number ? `Op ${prefillData.next_operation_number}` : null,
          prefillData.next_operation_name,
        ].filter(Boolean).join(" — ");
        const nextStation = prefillData.next_station_name ? `Next station: ${prefillData.next_station_name}` : "";
        const nextOp = nextOpParts ? `Next operation: ${nextOpParts}` : "";
        const handoffNote = [nextStation, nextOp].filter(Boolean).join(". ");
        if (handoffNote) {
          updates.handoffSummary = `${handoffNote}.\n\n`;
        }
      }
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates, handoffSummary: updates.handoffSummary ? `${updates.handoffSummary}${prev.handoffSummary || ""}` : prev.handoffSummary }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillData, stations.length]);



  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStationChange = async (stationDbId: string) => {
    const station = stations.find((s) => s.id === stationDbId);
    if (station) {
      const updates: Partial<FormData> = {
        stationId: station.station_id,
        stationDbId: station.id,
        workCenterType: station.work_center_type,
        workCenter: station.work_center,
        machineId: station.station_id,
      };

      // Auto-fill from active queue item at this station
      const { data: activeItem } = await supabase
        .from("queue_items")
        .select("work_order, part_number, operation_number, quantity, qty_original, qty_completed, qty_open, parts_completed")
        .eq("station_id", stationDbId)
        .eq("status", "in_progress")
        .limit(1)
        .maybeSingle();

      // Also fetch current_station_status for operator/state info
      const { data: stationStatus } = await supabase
        .from("current_station_status")
        .select("*")
        .eq("station_id", stationDbId)
        .maybeSingle();

      if (activeItem) {
        if (activeItem.work_order) updates.workOrder = activeItem.work_order;
        if (activeItem.part_number) updates.partNumber = activeItem.part_number;
        if (activeItem.operation_number) updates.operationNumber = activeItem.operation_number;
        // Pre-fill parts completed from the work order's tracked count
        updates.partsCompleted = activeItem.qty_completed || activeItem.parts_completed || 0;
        // Show operator how many parts are still required for this WO.
        const original = activeItem.qty_original ?? activeItem.quantity ?? 0;
        const completed = activeItem.qty_completed ?? activeItem.parts_completed ?? 0;
        updates.qtyOriginal = original;
        updates.qtyOpen = activeItem.qty_open ?? Math.max(0, original - completed);
        toast.info(`Auto-filled from active work order: ${activeItem.work_order || activeItem.part_number}`);
      } else if (stationStatus) {
        if (stationStatus.current_job_work_order) updates.workOrder = stationStatus.current_job_work_order;
        if (stationStatus.current_job_part_number) updates.partNumber = stationStatus.current_job_part_number;
        if (stationStatus.parts_complete) updates.partsCompleted = stationStatus.parts_complete;
        if (stationStatus.parts_required != null) {
          updates.qtyOriginal = stationStatus.parts_required;
          updates.qtyOpen = Math.max(0, (stationStatus.parts_required ?? 0) - (stationStatus.parts_complete ?? 0));
        }
      }

      // Auto-fill job state from station status
      if (stationStatus?.current_job_state) {
        updates.jobState = stationStatus.current_job_state as JobState;
      }

      setFormData((prev) => ({ ...prev, ...updates }));
    }
  };

  const updateReadiness = (key: string, isCNC: boolean) => {
    const readinessKey = isCNC ? "cncReadiness" : "equipmentReadiness";
    const currentValue = formData[readinessKey][key];
    const nextValue: TriState = currentValue === "N/A" ? "Yes" : currentValue === "Yes" ? "No" : "N/A";
    setFormData((prev) => ({
      ...prev,
      [readinessKey]: { ...prev[readinessKey], [key]: nextValue },
    }));
  };

  const handleSubmit = async () => {
    // Validate final step
    const errors = validateStep(4);
    if (errors.length > 0) {
      setValidationErrors(prev => ({ ...prev, [4]: errors }));
      toast.error(errors[0]);
      return;
    }

    if (!user || !onSubmit) {
      clearDraft();
      toast.success("Handoff record created successfully!");
      onClose();
      return;
    }

    setIsSubmitting(true);

    const isCNCSubmit = formData.workCenterType && isCNCType(formData.workCenterType);
    const isWeldingSubmit = formData.workCenterType?.includes("Welding");
    const isWaterJetSubmit = formData.workCenterType === "Water Jet";

    const record: Omit<HandoffRecord, "id" | "created_at" | "updated_at" | "record_version"> = {
      team_id: currentTeam?.id || null,
      station_id: formData.stationDbId || null,
      date: new Date().toISOString().split("T")[0],
      shift: getCurrentShift() as Shift,
      work_order: formData.workOrder,
      work_center: formData.workCenter || formData.workCenterType,
      work_center_type: formData.workCenterType as WorkCenterType,
      machine_id: formData.machineId || formData.stationId,
      part_number: formData.partNumber,
      part_revision: formData.partRevision,
      operation_number: formData.operationNumber,
      outgoing_operator_id: user.id,
      incoming_operator_id: null,
      outgoing_operator_name: formData.outgoingOperator,
      incoming_operator_name: formData.incomingOperator,
      supervisor_name: null,
      primary_state: formData.jobState as JobState,
      state_reason: formData.jobStateReason || null,
      delay_code: "None",
      machine_readiness: isCNCSubmit ? formData.cncReadiness : null,
      equipment_readiness: !isCNCSubmit ? formData.equipmentReadiness : null,
      machine_condition: isCNCSubmit ? {
        coolantLevel: formData.coolantLevel,
        airPressure: formData.airPressure,
        chipCondition: formData.chipCondition,
        activeAlarms: formData.activeAlarms,
        alarmNotes: formData.alarmNotes,
      } : null,
      welding_condition: isWeldingSubmit ? {
        gasLevel: formData.gasLevel,
        wireLevel: formData.wireLevel,
        tipCondition: formData.tipCondition,
      } : null,
      water_jet_condition: isWaterJetSubmit ? {
        waterPressure: formData.waterPressure,
        abrasiveLevel: formData.abrasiveLevel,
      } : null,
      last_good_part_timestamp: new Date().toISOString(),
      parts_completed_this_shift: formData.partsCompleted,
      scrap_count: formData.scrapCount,
      rework_count: formData.reworkCount,
      critical_dims_verified: formData.criticalDimsVerified,
      qa_notified: "N/A",
      quality_notes: null,
      fixture_installed: "N/A",
      clamps_bolts_torqued: "N/A",
      fixture_orientation_verified: "N/A",
      special_instructions_followed: "N/A",
      process_notes_for_next_shift: null,
      raw_material_available: true,
      next_material_lot_ready: false,
      material_issues_noted: false,
      material_notes: null,
      handoff_summary: formData.handoffSummary,
      outgoing_time: new Date().toISOString(),
      incoming_time: null,
      supervisor_time: null,
      tooling_notes: [],
      issues_follow_ups: [],
    };

    const { error } = await onSubmit(record);
    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to create handoff: " + error.message);
    } else {
      // Sync station status based on handoff type
      if (formData.stationDbId) {
        const statusUpdate: Record<string, any> = {
          station_id: formData.stationDbId,
          organization_id: organization?.id || null,
          current_job_state: formData.jobState || null,
          current_job_work_order: formData.workOrder || null,
          current_job_part_number: formData.partNumber || null,
          parts_complete: formData.partsCompleted || 0,
        };

        if (formData.handoffType === "station") {
          // Leaving station — clear operator, keep job info
          statusUpdate.current_operator_name = null;
          statusUpdate.current_operator_id = null;
        } else if (formData.handoffType === "operation") {
          // Operation complete — mark ready for pickup, clear operator
          statusUpdate.current_job_state = "Ready for Pickup";
          statusUpdate.current_operator_name = null;
          statusUpdate.current_operator_id = null;
        } else {
          // Shift end — transfer to incoming operator
          statusUpdate.current_operator_name = formData.incomingOperator || null;
          statusUpdate.current_operator_id = null; // incoming's user_id isn't known yet
        }

        await supabase
          .from("current_station_status")
          .upsert(statusUpdate, { onConflict: "station_id" });
      }

      clearDraft();
      const typeLabel = formData.handoffType === "shift_end" ? "Shift handoff" :
                         formData.handoffType === "station" ? "Station handoff" : "Operation handoff";
      toast.success(`${typeLabel} submitted successfully!`);
      onClose();
    }
  };

  // Handle keyboard navigation (defined after handleSubmit to avoid forward reference)
  // Detect if user is on mobile/touch device
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toUpperCase();
    
    // Never intercept keyboard events in form inputs - let them behave naturally
    const isFormInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
    const isInteractiveElement = target.closest('[role="combobox"]') || 
                                  target.closest('[data-radix-select-trigger]') ||
                                  target.closest('[role="listbox"]') ||
                                  target.closest('[role="option"]') ||
                                  target.isContentEditable;
    
    // Allow all keyboard events in form inputs and interactive elements
    if (isFormInput || isInteractiveElement) {
      // Only handle Escape in inputs to close the form
      if (e.key === 'Escape') {
        e.preventDefault();
        target.blur(); // First blur the input
        handleClose();
      }
      return;
    }
    
    // Handle Enter only when NOT in any input (e.g., when focused on navigation buttons)
    if (e.key === 'Enter' && !e.shiftKey && tagName === 'BUTTON') {
      // Let buttons handle their own click events naturally
      return;
    }
    
    // Escape key closes the form when not in an input
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  }, [handleClose]);

  // Focus first input when step changes - disabled on touch devices to prevent keyboard popup
  useEffect(() => {
    // Skip auto-focus on touch devices to prevent virtual keyboard from opening unexpectedly
    if (isTouchDevice) return;
    
    const timer = setTimeout(() => {
      if (formRef.current) {
        const firstInput = formRef.current.querySelector<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="combobox"]:not([disabled])'
        );
        firstInput?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [step, isTouchDevice]);

  const totalSteps = 4;
  const isCNC = formData.workCenterType && isCNCType(formData.workCenterType);
  const isWelding = formData.workCenterType?.includes("Welding");
  const isWaterJet = formData.workCenterType === "Water Jet";
  const readinessItems = isCNC ? cncReadinessItems : equipmentReadinessItems;
  const currentStepErrors = validationErrors[step] || [];

  // Group stations by category
  const stationsByCategory = stations.reduce((acc, station) => {
    const category = getCategoryForType(station.work_center_type);
    if (!acc[category]) acc[category] = [];
    acc[category].push(station);
    return acc;
  }, {} as Record<string, typeof stations>);

  return (
    <>
    <div 
      ref={formRef}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {formData.handoffType === "shift_end" ? "End of Shift Handoff" : 
               formData.handoffType === "station" ? "Station Handoff" : 
               formData.handoffType === "operation" ? "Operation Handoff" : "New Shift Handoff"}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{getCurrentShift()} Shift • {new Date().toLocaleDateString()}</span>
              {formData.workCenterType && (
                <span className="text-primary">• {formData.workCenterType}</span>
              )}
              {hasDraft && (
                <span className="text-amber-500 font-medium">• Draft restored</span>
              )}
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Interactive Step Progress */}
        <TooltipProvider>
          <div className="px-4 pt-4">
            <div className="flex items-center gap-1">
              {STEP_CONFIG.map((stepConfig, index) => {
                const status = getStepStatus(stepConfig.id);
                const isClickable = stepConfig.id <= step || completedSteps.has(stepConfig.id);
                
                return (
                  <div key={stepConfig.id} className="flex items-center flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => isClickable && goToStep(stepConfig.id)}
                          disabled={!isClickable}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all w-full justify-center",
                            status === 'current' && "bg-primary text-primary-foreground",
                            status === 'completed' && "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer",
                            status === 'error' && "bg-destructive/20 text-destructive hover:bg-destructive/30 cursor-pointer",
                            status === 'incomplete' && "bg-secondary text-muted-foreground",
                            !isClickable && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {status === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{stepConfig.label}</span>
                          <span className="sm:hidden">{stepConfig.shortLabel}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{stepConfig.label}</p>
                        {status === 'completed' && <p className="text-green-500">Completed</p>}
                        {status === 'error' && <p className="text-destructive">Has errors</p>}
                      </TooltipContent>
                    </Tooltip>
                    {index < STEP_CONFIG.length - 1 && (
                      <div className={cn(
                        "h-0.5 w-2 mx-0.5",
                        stepConfig.id < step ? "bg-primary" : "bg-secondary"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Validation Errors Display */}
            {currentStepErrors.length > 0 && (
              <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{currentStepErrors.join(", ")}</span>
                </div>
              </div>
            )}
          </div>
        </TooltipProvider>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <div className="space-y-4">
              {/* Handoff Type Selector */}
              <div className="space-y-2">
                <Label>Handoff Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {HANDOFF_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField("handoffType", opt.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all text-sm",
                        formData.handoffType === opt.value
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:bg-secondary"
                      )}
                    >
                      <div className="font-medium text-foreground">{opt.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Station / Work Center <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.stationDbId} onValueChange={handleStationChange}>
                  <SelectTrigger className={cn(!formData.stationDbId && currentStepErrors.includes("Station is required") && "border-destructive")}>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {Object.entries(stationsByCategory).map(([category, stationList]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-secondary/50">
                          {category}
                        </div>
                        {stationList.map((s) => {
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
                      </div>
                    ))}
                    {stations.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No stations available. Create a team and add stations first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Label className="flex items-center gap-1">
                    Job State <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.jobState} onValueChange={(v) => updateField("jobState", v)}>
                    <SelectTrigger className={cn(!formData.jobState && currentStepErrors.includes("Job State is required") && "border-destructive")}>
                      <SelectValue placeholder="Select current state" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Part Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.partNumber}
                    onChange={(e) => updateField("partNumber", e.target.value)}
                    placeholder="Enter part number"
                    className={cn("font-mono", !formData.partNumber && currentStepErrors.includes("Part Number is required") && "border-destructive")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revision</Label>
                  <Input
                    value={formData.partRevision}
                    onChange={(e) => updateField("partRevision", e.target.value)}
                    placeholder="Enter revision"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Outgoing Operator <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.outgoingOperator}
                    onChange={(e) => updateField("outgoingOperator", e.target.value)}
                    placeholder="Your name"
                    className={cn(!formData.outgoingOperator && currentStepErrors.includes("Outgoing Operator is required") && "border-destructive")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {formData.handoffType === "shift_end" ? "Incoming Operator (Next Shift)" :
                     formData.handoffType === "operation" ? "Next Station Operator" : "Incoming Operator"}
                  </Label>
                  <Input
                    value={formData.incomingOperator}
                    onChange={(e) => updateField("incomingOperator", e.target.value)}
                    placeholder={
                      formData.handoffType === "shift_end" ? "Name of the next shift operator" :
                      formData.handoffType === "operation" ? "Next station operator (if known)" :
                      "Name of the relieving operator"
                    }
                  />
                  {formData.handoffType === "station" && !formData.incomingOperator && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank if no one is taking over the station
                    </p>
                  )}
                  {formData.incomingOperator && formData.incomingOperator === formData.outgoingOperator && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ Self-handoff — you're covering the next shift too
                    </p>
                  )}
                </div>
              </div>

              {(formData.jobState.includes("Waiting") || formData.jobState.includes("Down") || formData.jobState === "On Hold") && (
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    value={formData.jobStateReason}
                    onChange={(e) => updateField("jobStateReason", e.target.value)}
                    placeholder="Explain the current state..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click each item to cycle through: N/A → Yes → No
              </p>
              <div className="space-y-1">
                {readinessItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => updateReadiness(item.key, !!isCNC)}
                    className="w-full flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <span className="text-sm text-foreground">{item.label}</span>
                    <TriStateIcon value={isCNC ? formData.cncReadiness[item.key] : formData.equipmentReadiness[item.key]} />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Readiness Notes (Optional)</Label>
                <Textarea
                  value={formData.readinessNotes}
                  onChange={(e) => updateField("readinessNotes", e.target.value)}
                  placeholder="Any notes about equipment readiness..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="section-header">Equipment Condition</div>
              
              {/* CNC-specific conditions */}
              {isCNC && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coolant Level</Label>
                    <Select value={formData.coolantLevel} onValueChange={(v) => updateField("coolantLevel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Air Pressure</Label>
                    <Select value={formData.airPressure} onValueChange={(v) => updateField("airPressure", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chip Condition</Label>
                    <Select value={formData.chipCondition} onValueChange={(v) => updateField("chipCondition", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Clear">Clear</SelectItem>
                        <SelectItem value="Needs Cleaning">Needs Cleaning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Welding-specific conditions */}
              {isWelding && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gas Level</Label>
                    <Select value={formData.gasLevel} onValueChange={(v) => updateField("gasLevel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Wire Level</Label>
                    <Select value={formData.wireLevel} onValueChange={(v) => updateField("wireLevel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tip/Tungsten Condition</Label>
                    <Select value={formData.tipCondition} onValueChange={(v) => updateField("tipCondition", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Replace">Needs Replace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Water Jet-specific conditions */}
              {isWaterJet && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Water Pressure</Label>
                    <Select value={formData.waterPressure} onValueChange={(v) => updateField("waterPressure", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Abrasive Level</Label>
                    <Select value={formData.abrasiveLevel} onValueChange={(v) => updateField("abrasiveLevel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="alarms"
                    checked={formData.activeAlarms}
                    onCheckedChange={(v) => updateField("activeAlarms", v)}
                  />
                  <Label htmlFor="alarms" className="text-status-critical">Active Issues/Alarms</Label>
                </div>
              </div>

              {formData.activeAlarms && (
                <div className="space-y-2">
                  <Label>Issue/Alarm Notes</Label>
                  <Textarea
                    value={formData.alarmNotes}
                    onChange={(e) => updateField("alarmNotes", e.target.value)}
                    placeholder="Describe active issues or alarms..."
                    rows={2}
                  />
                </div>
              )}

              <div className="section-header mt-6">Quality Status</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Parts Completed</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.partsCompleted}
                    onChange={(e) => updateField("partsCompleted", parseInt(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scrap Count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.scrapCount}
                    onChange={(e) => updateField("scrapCount", parseInt(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rework Count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.reworkCount}
                    onChange={(e) => updateField("reworkCount", parseInt(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dims"
                  checked={formData.criticalDimsVerified}
                  onCheckedChange={(v) => updateField("criticalDimsVerified", v)}
                />
                <Label htmlFor="dims">Critical Dimensions Verified</Label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Handoff Summary <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={formData.handoffSummary}
                  onChange={(e) => updateField("handoffSummary", e.target.value)}
                  placeholder="Summarize the current state and any important notes for the incoming operator..."
                  rows={4}
                  className={cn(!formData.handoffSummary.trim() && currentStepErrors.includes("Handoff Summary is required") && "border-destructive")}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a clear summary of the job status and any critical information.
                </p>
              </div>

              {/* Summary Preview */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <h4 className="text-sm font-semibold mb-3">Handoff Preview</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Station: </span>
                    <span className="font-mono">{formData.stationId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    <span>{formData.workCenterType || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Work Order: </span>
                    <span className="font-mono">{formData.workOrder || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Part: </span>
                    <span className="font-mono">{formData.partNumber || "—"} {formData.partRevision}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">State: </span>
                    <span>{formData.jobState || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">From: </span>
                    <span>{formData.outgoingOperator || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To: </span>
                    <span>{formData.incomingOperator || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Parts: </span>
                    <span className="font-mono text-status-ok">{formData.partsCompleted}</span>
                    {formData.scrapCount > 0 && (
                      <span className="text-status-critical ml-2">({formData.scrapCount} scrap)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Submit Handoff
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* Close confirmation dialog */}
    <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save your progress?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Would you like to save your progress as a draft so you can continue later?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => confirmClose(false)}>
            Discard
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => confirmClose(true)}>
            Save Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function TriStateIcon({ value }: { value: TriState }) {
  if (value === "Yes") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-status-ok/20">
        <Check className="w-3.5 h-3.5 text-status-ok" />
        <span className="text-xs font-medium text-status-ok">Yes</span>
      </div>
    );
  }
  if (value === "No") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-status-critical/20">
        <X className="w-3.5 h-3.5 text-status-critical" />
        <span className="text-xs font-medium text-status-critical">No</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted">
      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">N/A</span>
    </div>
  );
}
