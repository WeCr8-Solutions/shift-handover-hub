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
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type DemoStep = 'idle' | 'outgoing' | 'status' | 'notes' | 'incoming' | 'complete';

interface HandoffData {
  outgoingOperator: string;
  machineStatus: string;
  partsCompleted: number;
  qualityNotes: string;
  incomingOperator: string;
}

const defaultHandoffData: HandoffData = {
  outgoingOperator: "",
  machineStatus: "",
  partsCompleted: 0,
  qualityNotes: "",
  incomingOperator: "",
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
    setCurrentStep('outgoing');
    setHandoffData({ ...defaultHandoffData, outgoingOperator: "Mike R." });
  };

  const handleSelectMachineStatus = (status: string) => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'machine_status',
      selected_value: status
    });
    setHandoffData(prev => ({ ...prev, machineStatus: status }));
    setTimeout(() => setCurrentStep('status'), 300);
  };

  const handleSetPartsCompleted = (count: number) => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'parts_completed',
      selected_value: count.toString()
    });
    setHandoffData(prev => ({ ...prev, partsCompleted: count }));
    setTimeout(() => setCurrentStep('notes'), 300);
  };

  const handleAddQualityNotes = (note: string) => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'quality_notes',
      has_notes: note.length > 0
    });
    setHandoffData(prev => ({ ...prev, qualityNotes: note }));
    setTimeout(() => setCurrentStep('incoming'), 300);
  };

  const handleIncomingAcknowledge = (operator: string) => {
    trackEvent('landing_handoff_demo_interaction', {
      step: 'incoming_acknowledge',
      operator: operator
    });
    setHandoffData(prev => ({ ...prev, incomingOperator: operator }));
    setTimeout(() => setCurrentStep('complete'), 300);
  };

  const handleCompleteDemo = () => {
    trackEvent('landing_handoff_demo_completed', {
      section: 'shift_handoff_demo',
      all_steps_completed: true
    });
  };

  const handleReset = () => {
    trackEvent('landing_handoff_demo_reset', {
      section: 'shift_handoff_demo'
    });
    setCurrentStep('idle');
    setHandoffData(defaultHandoffData);
  };

  const steps = [
    { id: 'outgoing', label: 'Outgoing Operator' },
    { id: 'status', label: 'Machine Status' },
    { id: 'notes', label: 'Quality Notes' },
    { id: 'incoming', label: 'Incoming Operator' },
  ];

  const getStepIndex = (step: DemoStep) => {
    const stepOrder: DemoStep[] = ['outgoing', 'status', 'notes', 'incoming', 'complete'];
    return stepOrder.indexOf(step);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm border-primary/30 bg-primary/5">
            <Play className="w-3 h-3 mr-1.5 text-primary" />
            Interactive Demo
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
            Try a Shift Handoff
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Experience how operators seamlessly transfer job information between shifts
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          {currentStep !== 'idle' && (
            <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto pb-2">
              {steps.map((step, i) => {
                const currentIndex = getStepIndex(currentStep);
                const stepIndex = getStepIndex(step.id as DemoStep);
                const isCompleted = stepIndex < currentIndex;
                const isCurrent = step.id === currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap",
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
                      <ArrowRight className="w-3 h-3 mx-1 text-muted-foreground/30" />
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
                    <CardTitle className="text-base sm:text-lg">CNC-01 Handoff</CardTitle>
                    <p className="text-xs text-muted-foreground">Day Shift → Night Shift</p>
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
                    Click below to walk through a complete shift handoff as both the outgoing and incoming operator
                  </p>
                  <Button onClick={handleStartDemo} size="lg" className="gap-2">
                    Start Demo Handoff
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Outgoing Operator Step */}
              {currentStep === 'outgoing' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <User className="w-4 h-4" />
                    <span>You are: <strong className="text-foreground">Mike R.</strong> (Outgoing Operator)</span>
                  </div>
                  <p className="text-sm mb-4">What is the current machine status?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { status: 'Running', icon: CheckCircle2, color: 'text-green-400 bg-green-500/10 border-green-500/30 hover:bg-green-500/20' },
                      { status: 'Setup', icon: Wrench, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' },
                      { status: 'Down', icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20' },
                    ].map(({ status, icon: Icon, color }) => (
                      <Button
                        key={status}
                        variant="outline"
                        className={cn("h-auto py-4 flex-col gap-2 transition-all", color)}
                        onClick={() => handleSelectMachineStatus(status)}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{status}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts Completed Step */}
              {currentStep === 'status' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>Machine Status: <strong className="text-green-400">{handoffData.machineStatus}</strong></span>
                    </div>
                  </div>
                  <p className="text-sm mb-4">How many parts were completed this shift?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[12, 24, 36, 48].map((count) => (
                      <Button
                        key={count}
                        variant="outline"
                        className="h-auto py-3 flex-col hover:bg-primary/10 hover:border-primary/30"
                        onClick={() => handleSetPartsCompleted(count)}
                      >
                        <span className="text-lg font-bold">{count}</span>
                        <span className="text-[10px] text-muted-foreground">parts</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Notes Step */}
              {currentStep === 'notes' && (
                <div className="space-y-4">
                  <div className="flex gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      {handoffData.machineStatus}
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {handoffData.partsCompleted} parts
                    </div>
                  </div>
                  <p className="text-sm mb-4">Any quality notes for the next shift?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { note: "All dimensions within spec", type: "positive" },
                      { note: "Tool wear noticed on Op 10", type: "caution" },
                      { note: "Material lot change at 2pm", type: "info" },
                      { note: "No issues to report", type: "positive" },
                    ].map(({ note, type }) => (
                      <Button
                        key={note}
                        variant="outline"
                        className={cn(
                          "h-auto py-3 px-4 justify-start text-left text-sm",
                          type === "positive" ? "hover:bg-green-500/10 hover:border-green-500/30" :
                          type === "caution" ? "hover:bg-amber-500/10 hover:border-amber-500/30" :
                          "hover:bg-blue-500/10 hover:border-blue-500/30"
                        )}
                        onClick={() => handleAddQualityNotes(note)}
                      >
                        {note}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Operator Step */}
              {currentStep === 'incoming' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border mb-4">
                    <h4 className="text-sm font-semibold mb-3">Handoff Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Machine:</span>
                        <span className="ml-2 font-medium">{handoffData.machineStatus}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Parts:</span>
                        <span className="ml-2 font-medium">{handoffData.partsCompleted}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Notes:</span>
                        <span className="ml-2 font-medium">{handoffData.qualityNotes}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <User className="w-4 h-4" />
                    <span>Now you are: <strong className="text-foreground">Sarah C.</strong> (Incoming Operator)</span>
                  </div>
                  <p className="text-sm mb-4">Acknowledge the handoff to take over the station:</p>
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={() => handleIncomingAcknowledge("Sarah C.")}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Acknowledge & Accept Handoff
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
                    Handoff Complete!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    That's how easy it is. All information is captured, logged, and ready for supervisors to review.
                  </p>
                  <div className="p-4 rounded-lg bg-card border border-border mb-6 max-w-sm mx-auto">
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium">Mike R. (Day Shift)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">To:</span>
                        <span className="font-medium">Sarah C. (Night Shift)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Station:</span>
                        <span className="font-medium">CNC-01</span>
                      </div>
                      <div className="flex justify-between">
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
