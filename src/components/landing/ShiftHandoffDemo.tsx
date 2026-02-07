import { useState } from "react";
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
  Camera,
  Gauge,
  Shield,
  Timer,
  Package,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type HandoffType = 'shift' | 'operation';
type DemoStep = 'idle' | 'type_select' | 'job_info' | 'status' | 'performance' | 'summary' | 'complete';

interface HandoffData {
  handoffType: HandoffType | null;
  operator: string;
  workOrder: string;
  partNumber: string;
  operationNumber: string;
  partsCompleted: number;
  machineStatus: string;
  // Performance update fields
  hasImprovement: boolean;
  improvementType: string;
  impactAreas: string[];
  improvementNote: string;
}

const defaultHandoffData: HandoffData = {
  handoffType: null,
  operator: "",
  workOrder: "WO-2024-1847",
  partNumber: "PN-4521-REV-C",
  operationNumber: "Op 20",
  partsCompleted: 0,
  machineStatus: "",
  hasImprovement: false,
  improvementType: "",
  impactAreas: [],
  improvementNote: "",
};

export function ShiftHandoffDemo() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('idle');
  const [handoffData, setHandoffData] = useState<HandoffData>(defaultHandoffData);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleStartDemo = () => {
    if (!hasInteracted) {
      trackEvent('landing_handoff_demo_started', {
        section: 'shift_handoff_demo',
        action: 'start_demo'
      });
      setHasInteracted(true);
    }
    setCurrentStep('type_select');
  };

  const handleSelectType = (type: HandoffType) => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'type_select',
      handoff_type: type
    });
    setHandoffData(prev => ({ 
      ...prev, 
      handoffType: type,
      operator: "Mike R."
    }));
    setTimeout(() => setCurrentStep('job_info'), 300);
  };

  const handleConfirmJobInfo = () => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'job_info_confirmed',
      handoff_type: handoffData.handoffType || 'unknown'
    });
    setTimeout(() => setCurrentStep('status'), 300);
  };

  const handleSetStatus = (status: string, parts: number) => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'status_set',
      machine_status: status,
      parts_completed: parts.toString()
    });
    setHandoffData(prev => ({ 
      ...prev, 
      machineStatus: status,
      partsCompleted: parts
    }));
    setTimeout(() => setCurrentStep('performance'), 300);
  };

  const handlePerformanceUpdate = (hasImprovement: boolean, type?: string, impacts?: string[], note?: string) => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'performance_update',
      has_improvement: hasImprovement,
      improvement_type: type || 'none'
    });
    setHandoffData(prev => ({ 
      ...prev, 
      hasImprovement,
      improvementType: type || "",
      impactAreas: impacts || [],
      improvementNote: note || ""
    }));
    setTimeout(() => setCurrentStep('summary'), 300);
  };

  const handleSubmit = () => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'submitted',
      handoff_type: handoffData.handoffType || 'unknown'
    });
    setTimeout(() => setCurrentStep('complete'), 300);
  };

  const handleCompleteDemo = () => {
    trackEvent('landing_handoff_demo_completed', {
      section: 'shift_handoff_demo',
      handoff_type: handoffData.handoffType || 'unknown',
      had_improvement: handoffData.hasImprovement
    });
  };

  const handleReset = () => {
    trackEvent('landing_handoff_demo_reset', {
      section: 'shift_handoff_demo'
    });
    setCurrentStep('idle');
    setHandoffData(defaultHandoffData);
  };

  const getSteps = () => {
    return [
      { id: 'type_select', label: 'Type' },
      { id: 'job_info', label: 'Job Info' },
      { id: 'status', label: 'Status' },
      { id: 'performance', label: 'Feedback' },
      { id: 'summary', label: 'Submit' },
    ];
  };

  const getStepIndex = (step: DemoStep) => {
    const stepOrder: DemoStep[] = ['type_select', 'job_info', 'status', 'performance', 'summary', 'complete'];
    return stepOrder.indexOf(step);
  };

  const steps = getSteps();

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm border-primary/30 bg-primary/5">
            <Play className="w-3 h-3 mr-1.5 text-primary" />
            Interactive Demo
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
            Try a Digital Handoff
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Experience how operators capture job status and submit performance feedback
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          {currentStep !== 'idle' && currentStep !== 'complete' && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 overflow-x-auto pb-2">
              {steps.map((step, i) => {
                const currentIndex = getStepIndex(currentStep);
                const stepIndex = getStepIndex(step.id as DemoStep);
                const isCompleted = stepIndex < currentIndex;
                const isCurrent = step.id === currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={cn(
                      "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap",
                      isCompleted ? "bg-green-500/20 text-green-400" :
                      isCurrent ? "bg-primary/20 text-primary border border-primary/30" :
                      "bg-secondary/50 text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <span className="w-4 h-4 flex items-center justify-center rounded-full bg-current/20 text-[9px]">
                          {i + 1}
                        </span>
                      )}
                      <span className="hidden sm:inline">{step.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 mx-0.5 sm:mx-1 text-muted-foreground/30" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Demo Card */}
          <Card className="border-2 border-dashed border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">
                      {currentStep === 'idle' ? 'CNC-01 Station' : 
                       handoffData.handoffType === 'shift' ? 'End of Shift Handoff' : 'Operation Completion'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {currentStep === 'idle' ? 'Interactive demo' : `${handoffData.workOrder} • ${handoffData.partNumber}`}
                    </p>
                  </div>
                </div>
                {currentStep !== 'idle' && (
                  <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Idle State */}
              {currentStep === 'idle' && (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Ready to try?</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Walk through a complete handoff—capture job status, parts completed, and submit improvement ideas
                  </p>
                  <Button onClick={handleStartDemo} size="lg" className="gap-2">
                    Start Demo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Type Selection */}
              {currentStep === 'type_select' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <User className="w-4 h-4" />
                    <span>You are: <strong className="text-foreground">Mike R.</strong> (Operator)</span>
                  </div>
                  <p className="text-sm mb-4">What type of handoff are you completing?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex-col gap-2 hover:bg-primary/10 hover:border-primary/30"
                      onClick={() => handleSelectType('shift')}
                    >
                      <Clock className="w-6 h-6 text-primary" />
                      <span className="font-semibold">End of Shift</span>
                      <span className="text-[10px] text-muted-foreground">Hand off to incoming operator</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex-col gap-2 hover:bg-blue-500/10 hover:border-blue-500/30"
                      onClick={() => handleSelectType('operation')}
                    >
                      <Package className="w-6 h-6 text-blue-400" />
                      <span className="font-semibold">Operation Complete</span>
                      <span className="text-[10px] text-muted-foreground">Move job to next routing step</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Job Info Confirmation */}
              {currentStep === 'job_info' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-primary" />
                      Current Job Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Work Order</span>
                        <p className="font-mono font-medium">{handoffData.workOrder}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Part Number</span>
                        <p className="font-mono font-medium">{handoffData.partNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Operation</span>
                        <p className="font-medium">{handoffData.operationNumber} - CNC Milling</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Station</span>
                        <p className="font-medium">CNC-01</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Confirm this is the correct job you're working on:</p>
                  <Button onClick={handleConfirmJobInfo} className="w-full gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Job Info
                  </Button>
                </div>
              )}

              {/* Status & Parts */}
              {currentStep === 'status' && (
                <div className="space-y-4">
                  <p className="text-sm mb-2">
                    {handoffData.handoffType === 'shift' 
                      ? "What's the machine status and parts completed this shift?"
                      : "How many parts did you complete for this operation?"}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { status: 'Running - 24 parts', parts: 24, icon: CheckCircle2, color: 'text-green-400 bg-green-500/10 border-green-500/30 hover:bg-green-500/20' },
                      { status: 'Running - 36 parts', parts: 36, icon: CheckCircle2, color: 'text-green-400 bg-green-500/10 border-green-500/30 hover:bg-green-500/20' },
                      { status: 'Setup mode - 12 parts', parts: 12, icon: Wrench, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' },
                      { status: 'Complete - 48 parts', parts: 48, icon: Package, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20' },
                    ].map(({ status, parts, icon: Icon, color }) => (
                      <Button
                        key={status}
                        variant="outline"
                        className={cn("h-auto py-3 justify-start gap-3 transition-all", color)}
                        onClick={() => handleSetStatus(status.split(' - ')[0], parts)}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <div className="text-left">
                          <span className="block text-sm font-medium">{status.split(' - ')[0]}</span>
                          <span className="block text-xs opacity-70">{parts} parts completed</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Update */}
              {currentStep === 'performance' && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {handoffData.machineStatus}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                      <Package className="w-3 h-3 mr-1" />
                      {handoffData.partsCompleted} parts
                    </Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      Job Performance Feedback
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Did you notice anything about this part that could be improved?
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3 hover:bg-amber-500/10 hover:border-amber-500/30"
                        onClick={() => handlePerformanceUpdate(true, 'tool_adjustment', ['cycle_time', 'quality'], 'Offset adjustment improved surface finish')}
                      >
                        <Gauge className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div className="text-left flex-1">
                          <span className="block text-sm">Tool offset tweak for better finish</span>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1 py-0">cycle time</Badge>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">quality</Badge>
                          </div>
                        </div>
                        <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3 hover:bg-blue-500/10 hover:border-blue-500/30"
                        onClick={() => handlePerformanceUpdate(true, 'setup_change', ['safety'], 'Fixture clamp position more secure')}
                      >
                        <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div className="text-left flex-1">
                          <span className="block text-sm">Fixture clamp position change</span>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1 py-0">safety</Badge>
                          </div>
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-auto py-3 justify-start gap-3 hover:bg-green-500/10 hover:border-green-500/30"
                        onClick={() => handlePerformanceUpdate(true, 'cycle_improvement', ['cycle_time'], 'Reduced rapid moves saved 8 seconds')}
                      >
                        <Timer className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <div className="text-left flex-1">
                          <span className="block text-sm">Cycle time optimization found</span>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1 py-0">-8 sec/part</Badge>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="ghost"
                        className="h-auto py-3 justify-center text-muted-foreground hover:text-foreground"
                        onClick={() => handlePerformanceUpdate(false)}
                      >
                        No feedback - Continue
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {currentStep === 'summary' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <h4 className="text-sm font-semibold mb-3">
                      {handoffData.handoffType === 'shift' ? 'Shift Handoff Summary' : 'Operation Completion Summary'}
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground text-xs">Work Order</span>
                          <p className="font-mono font-medium">{handoffData.workOrder}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Part Number</span>
                          <p className="font-mono font-medium">{handoffData.partNumber}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground text-xs">Status</span>
                          <p className="font-medium text-green-400">{handoffData.machineStatus}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Parts Completed</span>
                          <p className="font-medium">{handoffData.partsCompleted}</p>
                        </div>
                      </div>
                      {handoffData.hasImprovement && (
                        <div className="pt-2 border-t border-border">
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-400" />
                            Performance Feedback
                          </span>
                          <p className="font-medium text-amber-400">{handoffData.improvementNote}</p>
                          <div className="flex gap-1 mt-1">
                            {handoffData.impactAreas.map(area => (
                              <Badge key={area} variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                                {area.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button onClick={handleSubmit} className="w-full gap-2" size="lg">
                    <ThumbsUp className="w-4 h-4" />
                    {handoffData.handoffType === 'shift' ? 'Submit Handoff' : 'Complete Operation'}
                  </Button>
                </div>
              )}

              {/* Complete State */}
              {currentStep === 'complete' && (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-green-400">
                    {handoffData.handoffType === 'shift' ? 'Handoff Complete!' : 'Operation Logged!'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {handoffData.hasImprovement 
                      ? "Your feedback has been submitted for supervisor review. Improvements like this help the whole team!"
                      : "All information captured and logged. The next operator or supervisor can see everything."}
                  </p>
                  <div className="p-4 rounded-lg bg-card border border-border mb-6 max-w-sm mx-auto">
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Operator:</span>
                        <span className="font-medium">Mike R.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Station:</span>
                        <span className="font-medium">CNC-01</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parts:</span>
                        <span className="font-medium">{handoffData.partsCompleted} completed</span>
                      </div>
                      {handoffData.hasImprovement && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Feedback:</span>
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                            Submitted
                          </Badge>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-border">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                          Verified
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" onClick={handleReset} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Try Again
                    </Button>
                    <Button onClick={() => {
                      handleCompleteDemo();
                      window.location.href = '/auth';
                    }} className="gap-2">
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
