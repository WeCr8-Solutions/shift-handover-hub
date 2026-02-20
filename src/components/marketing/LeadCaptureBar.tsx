import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { FileDown, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

interface LeadCaptureBarProps {
  sourcePage?: string;
  className?: string;
}

export function LeadCaptureBar({ sourcePage = "landing", className = "" }: LeadCaptureBarProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        source_page: sourcePage,
        lead_type: "template_download",
      });

      if (error) throw error;

      trackEvent("lead_captured", { source_page: sourcePage, lead_type: "template_download" });
      setSubmitted(true);

      // Trigger download
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

  if (submitted) {
    return (
      <div className={`w-full ${className}`}>
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm font-medium">Your template is downloading! Check your downloads folder.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="p-6 sm:p-8 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-blue-500/10 border border-primary/20">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <FileDown className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-tight">Free Shop Floor Setup Template</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Excel template to plan your stations, teams & work centers.
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-sm min-w-[180px]"
                required
              />
              <Button type="submit" size="sm" disabled={loading} className="gap-1.5 whitespace-nowrap">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                Download
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
