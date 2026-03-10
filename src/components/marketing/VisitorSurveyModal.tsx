import { useState, useEffect, useCallback } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, MessageSquare, ChevronRight } from "lucide-react";

const SURVEY_COMPLETED_KEY = "visitor_survey_completed";
const SURVEY_DISMISSED_KEY = "visitor_survey_dismissed";
export const SURVEY_MODAL_ACTIVE_KEY = "survey_modal_active";

const HEARD_OPTIONS = [
  "Google Search",
  "Social Media",
  "Referral / Word of Mouth",
  "Trade Show / Conference",
  "YouTube",
  "LinkedIn",
  "Other",
];

const LOOKING_FOR_OPTIONS = [
  "Shift Handoffs",
  "Work Order Tracking",
  "Machine Downtime",
  "Production Scheduling",
  "Quality / NCRs",
  "Team Communication",
  "Other",
];

export function VisitorSurveyModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [heardAbout, setHeardAbout] = useState("");
  const [otherHeard, setOtherHeard] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [otherLooking, setOtherLooking] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const shouldShow = useCallback(() => {
    if (user) return false;
    if (localStorage.getItem(SURVEY_COMPLETED_KEY)) return false;
    if (sessionStorage.getItem(SURVEY_DISMISSED_KEY)) return false;
    return true;
  }, [user]);

  useEffect(() => {
    if (!shouldShow()) return;
    const timer = setTimeout(() => {
      if (shouldShow()) {
        setOpen(true);
        sessionStorage.setItem(SURVEY_MODAL_ACTIVE_KEY, "1");
        trackEvent("survey_shown", { source_page: window.location.pathname });
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  const handleDismiss = () => {
    localStorage.setItem(SURVEY_DISMISSED_KEY, "1");
    sessionStorage.removeItem(SURVEY_MODAL_ACTIVE_KEY);
    setOpen(false);
    trackEvent("survey_dismissed", {});
  };

  const toggleLookingFor = (val: string) => {
    setLookingFor((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleSubmit = async () => {
    if (lookingFor.length === 0) {
      toast.error("Please select at least one option.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("visitor_surveys").insert({
        heard_about_us: heardAbout === "Other" ? otherHeard || "Other" : heardAbout,
        looking_for: lookingFor.filter((v) => v !== "Other"),
        other_heard_about: heardAbout === "Other" ? otherHeard : null,
        other_looking_for: lookingFor.includes("Other") ? otherLooking : null,
        source_page: window.location.pathname,
      });
      if (error) throw error;
      localStorage.setItem(SURVEY_COMPLETED_KEY, "1");
      sessionStorage.removeItem(SURVEY_MODAL_ACTIVE_KEY);
      trackEvent("survey_completed", {
        heard_about_us: heardAbout,
        looking_for_count: lookingFor.length,
      });
      toast.success("Thanks for your feedback!");
      setOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DrawerContent className="px-6 pb-8 pt-4 max-w-lg mx-auto">
        <DrawerTitle className="sr-only">Quick Survey</DrawerTitle>
        <div className="flex flex-col gap-5 py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                {step === 1 ? "How did you hear about us?" : "What are you looking to track?"}
              </h3>
              <p className="text-xs text-muted-foreground">Step {step} of 2</p>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-3">
              <RadioGroup value={heardAbout} onValueChange={setHeardAbout} className="gap-2.5">
                {HEARD_OPTIONS.map((opt) => (
                  <div key={opt} className="flex items-center gap-2.5">
                    <RadioGroupItem value={opt} id={`heard-${opt}`} />
                    <Label htmlFor={`heard-${opt}`} className="text-sm font-normal cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {heardAbout === "Other" && (
                <Input
                  placeholder="Please specify..."
                  value={otherHeard}
                  onChange={(e) => setOtherHeard(e.target.value)}
                  className="mt-1"
                />
              )}
              <Button
                className="w-full gap-1.5"
                disabled={!heardAbout}
                onClick={() => setStep(2)}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <div key={opt} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`look-${opt}`}
                    checked={lookingFor.includes(opt)}
                    onCheckedChange={() => toggleLookingFor(opt)}
                  />
                  <Label htmlFor={`look-${opt}`} className="text-sm font-normal cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
              {lookingFor.includes("Other") && (
                <Input
                  placeholder="Please specify..."
                  value={otherLooking}
                  onChange={(e) => setOtherLooking(e.target.value)}
                  className="mt-1"
                />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  disabled={loading || lookingFor.length === 0}
                  onClick={handleSubmit}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit
                </Button>
              </div>
            </div>
          )}

          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Skip survey
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
});
