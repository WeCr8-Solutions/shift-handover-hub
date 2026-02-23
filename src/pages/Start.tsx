import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { captureUtmParams, getUtmParams } from "@/lib/utm";
import {
  ClipboardList,
  ArrowRightLeft,
  Eye,
  Loader2,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/jobline-logo.png";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);

const QR_URL = "https://jobline.ai/start";

const benefits = [
  {
    icon: ClipboardList,
    title: "Track Work Orders",
    description: "Know exactly what's running, what's next, and what's behind.",
  },
  {
    icon: ArrowRightLeft,
    title: "Smart Shift Handoffs",
    description: "Never lose context between shifts again.",
  },
  {
    icon: Eye,
    title: "Real-Time Visibility",
    description: "See your entire shop floor at a glance.",
  },
];

export default function Start() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Apply default UTM params if none present
  useEffect(() => {
    const captured = captureUtmParams();
    const hasAny = Object.keys(captured).length > 0;

    if (!hasAny) {
      sessionStorage.setItem(
        "jobline_utm",
        JSON.stringify({
          utm_source: "qr_card",
          utm_medium: "offline",
          utm_campaign: "local_outreach",
        })
      );
    }

    trackEvent("qr_landing_view", {
      source_page: "start",
      ...getUtmParams(),
    });
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        source_page: "qr_start",
        lead_type: "qr_interest",
      });
      if (error) throw error;

      trackEvent("lead_captured", {
        source_page: "qr_start",
        lead_type: "qr_interest",
        ...getUtmParams(),
      });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Get Started with JobLine.ai"
        description="Scan. Sign up. Simplify your shop floor. Track work orders, manage shift handoffs, and gain real-time production visibility."
        noindex
        canonical="/start"
      />

      <main className="min-h-screen bg-background flex flex-col items-center px-4 py-8 sm:py-12">
        {/* Hero */}
        <section className="w-full max-w-md text-center space-y-4">
          <img
            src={logo}
            alt="JobLine.ai logo"
            className="h-10 mx-auto"
            loading="eager"
          />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Your Shop Floor, Simplified
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Digital expediting &amp; smart shift handoffs for CNC shops and
            manufacturing teams.
          </p>
        </section>

        {/* Benefits */}
        <section className="w-full max-w-md mt-8 space-y-3">
          {benefits.map((b) => (
            <Card key={b.title} className="border-border/60">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* CTAs */}
        <section className="w-full max-w-md mt-8 space-y-3">
          <Button
            size="lg"
            className="w-full text-base font-semibold h-12"
            onClick={() => {
              trackEvent("cta_click", { cta_id: "qr_get_started", section: "start" });
              navigate("/auth");
            }}
          >
            Get Started Free
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full text-base h-12"
            onClick={() => {
              trackEvent("cta_click", { cta_id: "qr_see_how", section: "start" });
              navigate("/");
            }}
          >
            See How It Works
          </Button>
        </section>

        {/* Email Capture */}
        <section className="w-full max-w-md mt-8">
          {submitted ? (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm font-medium text-foreground">
                You're on the list! We'll keep you posted.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/50 border border-border/60 space-y-2">
              <p className="text-sm font-medium text-foreground text-center">
                Not ready to sign up? Get updates instead.
              </p>
              <form
                onSubmit={handleEmailSubmit}
                className="flex gap-2"
              >
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="h-10 px-4 whitespace-nowrap"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
            </div>
          )}
        </section>

        {/* QR Code */}
        <section className="w-full max-w-md mt-10 flex flex-col items-center space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Share2 className="w-4 h-4" />
            <p className="text-xs font-medium">Share this page</p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <QRCodeSVG value={QR_URL} size={120} level="M" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            joblineai.lovable.app/start
          </p>
        </section>

        <footer className="mt-10 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} JobLine.ai — Built for the shop floor.
          </p>
        </footer>
      </main>
    </>
  );
}
