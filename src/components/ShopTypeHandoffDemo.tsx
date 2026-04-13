import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  CheckCircle2,
  ArrowRight,
  Clock,
  User,
  Wrench,
  AlertTriangle,
  ThumbsUp,
  RotateCcw,
  Lightbulb,
  Gauge,
  Shield,
  Timer,
  Package,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { type ShopType, SHOP_TYPE_CONTENT } from "@/lib/shopTypes";

type HandoffType = "shift" | "operation";
type DemoStep =
  | "idle"
  | "type_select"
  | "job_info"
  | "status"
  | "performance"
  | "summary"
  | "complete";

interface HandoffState {
  handoffType: HandoffType | null;
  machineStatus: string;
  partsCompleted: number;
  hasImprovement: boolean;
  improvementType: string;
  impactAreas: string[];
  improvementNote: string;
}

const DEFAULT_HANDOFF: HandoffState = {
  handoffType: null,
  machineStatus: "",
  partsCompleted: 0,
  hasImprovement: false,
  improvementType: "",
  impactAreas: [],
  improvementNote: "",
};

const STATUS_ICON_MAP = {
  check: CheckCircle2,
  wrench: Wrench,
  package: Package,
  alert: AlertTriangle,
} as const;

const STATUS_COLOR_MAP = {
  green: "text-green-400 bg-green-500/10 border-green-500/30 hover:bg-green-500/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
  blue: "text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
  red: "text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
} as const;

const FEEDBACK_ICON_MAP = {
  gauge: Gauge,
  shield: Shield,
  timer: Timer,
  wrench: Wrench,
} as const;

const STEP_ORDER: DemoStep[] = [
  "type_select",
  "job_info",
  "status",
  "performance",
  "summary",
  "complete",
];

const STEPS = [
  { id: "type_select" as DemoStep, label: "Type" },
  { id: "job_info" as DemoStep, label: "Job Info" },
  { id: "status" as DemoStep, label: "Status" },
  { id: "performance" as DemoStep, label: "Feedback" },
  { id: "summary" as DemoStep, label: "Submit" },
];

interface ShopTypeHandoffDemoProps {
  shopType: ShopType;
  className?: string;
}

export function ShopTypeHandoffDemo({
  shopType,
  className,
}: ShopTypeHandoffDemoProps) {
  const config = SHOP_TYPE_CONTENT[shopType].demoConfig;

  const [currentStep, setCurrentStep] = useState<DemoStep>("idle");
  const [handoff, setHandoff] = useState<HandoffState>(DEFAULT_HANDOFF);

  // Reset demo when shop type changes
  useEffect(() => {
    setCurrentStep("idle");
    setHandoff(DEFAULT_HANDOFF);
  }, [shopType]);

  const stepIndex = (step: DemoStep) => STEP_ORDER.indexOf(step);

  const handleStart = () => {
    trackEvent("demo_start_button_clicked", {
      section: "start_page_demo",
      shop_type: shopType,
    });
    setCurrentStep("type_select");
  };

  const handleSelectType = (type: HandoffType) => {
    trackEvent("demo_handoff_type_selected", {
      handoff_type: type,
      section: "start_page_demo",
      shop_type: shopType,
    });
    setHandoff((prev) => ({ ...prev, handoffType: type }));
    setTimeout(() => setCurrentStep("job_info"), 300);
  };

  const handleConfirmJob = () => {
    trackEvent("demo_job_info_confirmed", {
      section: "start_page_demo",
      shop_type: shopType,
    });
    setTimeout(() => setCurrentStep("status"), 300);
  };

  const handleSetStatus = (statusLabel: string, partsCount: number) => {
    trackEvent("demo_status_selected", {
      machine_status: statusLabel,
      parts_completed: partsCount,
      section: "start_page_demo",
      shop_type: shopType,
    });
    setHandoff((prev) => ({
      ...prev,
      machineStatus: statusLabel,
      partsCompleted: partsCount,
    }));
    setTimeout(() => setCurrentStep("performance"), 300);
  };

  const handleFeedback = (
    hasImprovement: boolean,
    type?: string,
    impacts?: string[],
    note?: string
  ) => {
    trackEvent(
      hasImprovement ? "demo_performance_feedback_clicked" : "demo_performance_skipped",
      {
        improvement_type: type ?? "none",
        section: "start_page_demo",
        shop_type: shopType,
      }
    );
    setHandoff((prev) => ({
      ...prev,
      hasImprovement,
      improvementType: type ?? "",
      impactAreas: impacts ?? [],
      improvementNote: note ?? "",
    }));
    setTimeout(() => setCurrentStep("summary"), 300);
  };

  const handleSubmit = () => {
    trackEvent("demo_handoff_submitted", {
      handoff_type: handoff.handoffType ?? "unknown",
      parts_completed: handoff.partsCompleted,
      machine_status: handoff.machineStatus,
      has_improvement: handoff.hasImprovement,
      section: "start_page_demo",
      shop_type: shopType,
    });
    setTimeout(() => setCurrentStep("complete"), 300);
  };

  const handleReset = () => {
    trackEvent("demo_reset_clicked", {
      section: "start_page_demo",
      shop_type: shopType,
    });
    setCurrentStep("idle");
    setHandoff(DEFAULT_HANDOFF);
  };

  const cardTitle =
    currentStep === "idle"
      ? config.stationLabel
      : handoff.handoffType === "shift"
      ? config.shiftHandoffLabel
      : config.operationHandoffLabel;

  const cardSub =
    currentStep === "idle"
      ? "Interactive demo"
      : `${config.workOrder} \u2022 ${config.itemValue}`;

  return (
    <div className={cn("w-full max-w-md", className)}>
      {/* Section header */}
      <div className="text-center mb-4">
        <Badge
          variant="outline"
          className="mb-2 text-xs border-primary/30 bg-primary/5"
        >
          <Play className="w-3 h-3 mr-1.5 text-primary" />
          Interactive Demo
        </Badge>
        <h3 className="text-base font-bold mb-1">Try a Digital Handoff</h3>
        <p className="text-xs text-muted-foreground">
          See how operators capture job status and submit feedback
        </p>
      </div>

      {/* Progress steps */}
      {currentStep !== "idle" && currentStep !== "complete" && (
        <div className="flex items-center justify-center gap-1 mb-4 overflow-x-auto pb-1">
          {STEPS.map((step, i) => {
            const curIdx = stepIndex(currentStep);
            const sIdx = stepIndex(step.id);
            const done = sIdx < curIdx;
            const active = step.id === currentStep;
            return (
              <div key={step.id} className="flex items-center shrink-0">
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap",
                    done
                      ? "bg-green-500/20 text-green-400"
                      : active
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary/50 text-muted-foreground"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center rounded-full bg-current/20 text-[9px]">
                      {i + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="w-3 h-3 mx-0.5 text-muted-foreground/30 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Demo card */}
      <Card className="border-2 border-dashed border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold leading-tight">
                  {cardTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{cardSub}</p>
              </div>
            </div>
            {currentStep !== "idle" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1 h-7 text-xs shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          {/* ── idle ── */}
          {currentStep === "idle" && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Play className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1.5">Ready to try?</h3>
              <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
                Walk through a complete handoff — capture job status,{" "}
                {config.unitLabel} completed, and submit improvement ideas
              </p>
              <Button onClick={handleStart} className="gap-2">
                Start Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ── type_select ── */}
          {currentStep === "type_select" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span>
                  You are:{" "}
                  <strong className="text-foreground">
                    {config.operatorName}
                  </strong>{" "}
                  (Operator)
                </span>
              </div>
              <p className="text-sm">What type of handoff are you completing?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-1.5 hover:bg-primary/10 hover:border-primary/30"
                  onClick={() => handleSelectType("shift")}
                >
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-xs">
                    {config.shiftHandoffLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Hand off to incoming operator
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-1.5 hover:bg-blue-500/10 hover:border-blue-500/30"
                  onClick={() => handleSelectType("operation")}
                >
                  <Package className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-xs">
                    {config.operationHandoffLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Move job to next step
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* ── job_info ── */}
          {currentStep === "job_info" && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <h4 className="text-xs font-semibold mb-2.5 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                  Current Job Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px]">
                      Work Order
                    </span>
                    <p className="font-mono font-medium">{config.workOrder}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">
                      {config.itemLabel}
                    </span>
                    <p className="font-medium text-[11px] leading-tight">
                      {config.itemValue}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">
                      Operation
                    </span>
                    <p className="font-medium">{config.operationLabel}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">
                      Station
                    </span>
                    <p className="font-medium">{config.stationShortName}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Confirm this is the correct job:
              </p>
              <Button onClick={handleConfirmJob} className="w-full gap-2 h-9">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Job Info
              </Button>
            </div>
          )}

          {/* ── status ── */}
          {currentStep === "status" && (
            <div className="space-y-3">
              <p className="text-sm">
                {handoff.handoffType === "shift"
                  ? `What's the status and ${config.unitLabel} completed this shift?`
                  : `How many ${config.unitLabel} did you complete?`}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {config.statusOptions.map((opt) => {
                  const Icon = STATUS_ICON_MAP[opt.iconKey];
                  return (
                    <Button
                      key={`${opt.statusLabel}-${opt.partsCount}`}
                      variant="outline"
                      className={cn(
                        "h-auto py-2.5 justify-start gap-2.5 transition-all",
                        STATUS_COLOR_MAP[opt.colorVariant]
                      )}
                      onClick={() =>
                        handleSetStatus(opt.statusLabel, opt.partsCount)
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="text-left">
                        <span className="block text-xs font-medium">
                          {opt.statusLabel}
                        </span>
                        <span className="block text-[10px] opacity-70">
                          {opt.detailLabel}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── performance ── */}
          {currentStep === "performance" && (
            <div className="space-y-3">
              <div className="flex gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="bg-green-500/10 border-green-500/30 text-green-400 text-[10px]"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  {handoff.machineStatus}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-[10px]"
                >
                  <Package className="w-2.5 h-2.5 mr-1" />
                  {handoff.partsCompleted} {config.unitLabel}
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Job Performance Feedback
                </h4>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Did you notice anything about this job that could be improved?
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {config.feedbackOptions.map((opt) => {
                    const Icon = FEEDBACK_ICON_MAP[opt.iconKey];
                    return (
                      <Button
                        key={opt.type}
                        variant="outline"
                        className="h-auto py-2.5 justify-start gap-2.5 hover:bg-amber-500/10 hover:border-amber-500/30"
                        onClick={() =>
                          handleFeedback(true, opt.type, opt.impacts, opt.note)
                        }
                      >
                        <Icon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <div className="text-left flex-1">
                          <span className="block text-xs">{opt.label}</span>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {opt.impacts.map((impact) => (
                              <Badge
                                key={impact}
                                variant="outline"
                                className="text-[9px] px-1 py-0"
                              >
                                {impact.replace("_", " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    className="h-auto py-2 justify-center text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => handleFeedback(false)}
                  >
                    No feedback — Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── summary ── */}
          {currentStep === "summary" && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <h4 className="text-xs font-semibold mb-2.5">
                  {handoff.handoffType === "shift"
                    ? "Shift Handoff Summary"
                    : "Completion Summary"}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground text-[10px]">
                        Work Order
                      </span>
                      <p className="font-mono font-medium">{config.workOrder}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">
                        {config.itemLabel}
                      </span>
                      <p className="font-medium text-[11px] leading-tight">
                        {config.itemValue}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground text-[10px]">
                        Status
                      </span>
                      <p className="font-medium text-green-400">
                        {handoff.machineStatus}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">
                        Completed
                      </span>
                      <p className="font-medium">
                        {handoff.partsCompleted} {config.unitLabel}
                      </p>
                    </div>
                  </div>
                  {handoff.hasImprovement && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                        <Lightbulb className="w-2.5 h-2.5 text-amber-400" />
                        Performance Feedback
                      </span>
                      <p className="font-medium text-amber-400 text-[11px]">
                        {handoff.improvementNote}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {handoff.impactAreas.map((area) => (
                          <Badge
                            key={area}
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400"
                          >
                            {area.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full gap-2 h-10">
                <ThumbsUp className="w-3.5 h-3.5" />
                {handoff.handoffType === "shift"
                  ? "Submit Handoff"
                  : "Complete & Submit"}
              </Button>
            </div>
          )}

          {/* ── complete ── */}
          {currentStep === "complete" && (
            <div className="text-center py-5">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-base font-semibold mb-1.5 text-green-400">
                {handoff.handoffType === "shift"
                  ? "Handoff Complete!"
                  : "Operation Logged!"}
              </h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                {handoff.hasImprovement
                  ? "Your feedback has been submitted for review. Improvements like this help the whole team!"
                  : "All information captured. The next operator or supervisor can see everything instantly."}
              </p>
              <div className="p-3 rounded-lg bg-card border border-border mb-4 max-w-xs mx-auto text-left">
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operator:</span>
                    <span className="font-medium">{config.operatorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Station:</span>
                    <span className="font-medium">{config.stationShortName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium">
                      {handoff.partsCompleted} {config.unitLabel}
                    </span>
                  </div>
                  {handoff.hasImprovement && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Feedback:</span>
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                        Submitted
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    trackEvent("demo_get_started_clicked", {
                      section: "start_page_demo",
                      shop_type: shopType,
                      had_improvement: handoff.hasImprovement,
                    });
                    window.location.href = "/auth";
                  }}
                  className="gap-1.5"
                >
                  Get Started Free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
