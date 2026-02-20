import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { getUtmParams } from "@/lib/utm";
import { FileDown, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

const MODAL_DISMISSED_KEY = "lead_modal_dismissed";
const LEAD_SUBMITTED_KEY = "lead_submitted";

export function LeadCaptureModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  const shouldShow = useCallback(() => {
    if (user) return false;
    if (sessionStorage.getItem(MODAL_DISMISSED_KEY)) return false;
    if (sessionStorage.getItem(LEAD_SUBMITTED_KEY)) return false;
    return true;
  }, [user]);

  useEffect(() => {
    if (!shouldShow()) return;

    // Desktop: exit intent via mouseleave
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && shouldShow()) {
        setOpen(true);
        trackEvent("lead_modal_shown", { trigger: "exit_intent", ...getUtmParams() });
      }
    };

    // Mobile: 45-second timer
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isTouchDevice) {
      timer = setTimeout(() => {
        if (shouldShow()) {
          setOpen(true);
          trackEvent("lead_modal_shown", { trigger: "timeout", ...getUtmParams() });
        }
      }, 45000);
    } else {
      document.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (timer) clearTimeout(timer);
    };
  }, [shouldShow]);

  const handleDismiss = () => {
    sessionStorage.setItem(MODAL_DISMISSED_KEY, "1");
    setOpen(false);
    trackEvent("lead_modal_dismissed", {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("email_leads" as any).insert({
        email: result.data,
        source_page: "exit-intent-modal",
        lead_type: "template_download",
      });
      if (error) throw error;

      trackEvent("lead_captured", { source_page: "exit-intent-modal", lead_type: "template_download", ...getUtmParams() });
      sessionStorage.setItem(LEAD_SUBMITTED_KEY, "1");
      setSubmitted(true);

      const link = document.createElement("a");
      link.href = "/templates/JobLine_Setup_Template.xlsx";
      link.download = "JobLine_Setup_Template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Download Free Template</DialogTitle>
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <h3 className="text-xl font-bold">Your template is downloading!</h3>
            <p className="text-muted-foreground text-sm">Check your downloads folder. Good luck setting up your shop!</p>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <FileDown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight">Before you go — grab your free setup template</h3>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Plan your stations, teams, and work centers with our Excel template. Used by 500+ manufacturing teams.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={loading} className="gap-1.5 whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Download Free
              </Button>
            </form>
            <button
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center mt-1"
            >
              No thanks, I'll pass
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
