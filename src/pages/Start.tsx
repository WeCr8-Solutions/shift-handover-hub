import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Wrench,
  Factory,
  Car,
  Flame,
  LayoutGrid,
  FileText,
  RefreshCw,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/jobline-logo.png";
import { SocialShareModal } from "@/components/SocialShareModal";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);

const QR_URL = "https://jobline.ai/start";

type ShopType = "cnc" | "auto" | "body" | "weld" | "general";

const VALID_TYPES: ShopType[] = ["cnc", "auto", "body", "weld", "general"];

const SHOP_TYPES: { type: ShopType; icon: React.ElementType; label: string }[] = [
  { type: "cnc", icon: Factory, label: "CNC & Mfg" },
  { type: "auto", icon: Wrench, label: "Auto Repair" },
  { type: "body", icon: Car, label: "Body Shops" },
  { type: "weld", icon: Flame, label: "Welding / Fab" },
  { type: "general", icon: LayoutGrid, label: "General" },
];

const DEMO_JOBS: Record<ShopType, { label: string; status: string; color: string }[]> = {
  cnc: [
    { label: "Lathe #1 — Part #4412", status: "In Progress", color: "text-yellow-400" },
    { label: "Mill #2 — Rush Order", status: "Waiting on Material", color: "text-red-400" },
    { label: "QC Station", status: "Ready for Pickup", color: "text-green-400" },
  ],
  auto: [
    { label: "Bay 3 — 2019 Ford F-150", status: "In Progress", color: "text-yellow-400" },
    { label: "Bay 1 — Honda Civic Brakes", status: "Waiting on Parts", color: "text-red-400" },
    { label: "Bay 5 — Toyota Camry", status: "Ready for Pickup", color: "text-green-400" },
  ],
  body: [
    { label: "BMW M3 — Color Match", status: "In Teardown", color: "text-yellow-400" },
    { label: "Mustang — Panel Repair", status: "In Paint", color: "text-blue-400" },
    { label: "Toyota Camry", status: "Ready for Delivery", color: "text-green-400" },
  ],
  weld: [
    { label: "Frame Jig A — Custom Rack", status: "In Progress", color: "text-yellow-400" },
    { label: "Pipe Spool #7", status: "Waiting on Drawing", color: "text-red-400" },
    { label: "Finishing Station", status: "Complete", color: "text-green-400" },
  ],
  general: [
    { label: "Job #18 — Cabinet Set", status: "In Progress", color: "text-yellow-400" },
    { label: "Job #21 — Countertop", status: "On Hold", color: "text-red-400" },
    { label: "Pickup Counter", status: "Ready", color: "text-green-400" },
  ],
};

const SHOP_CONTENT = {
  cnc: {
    headline: "Still walking the shop floor to know what's running?",
    subheadline: "See every job, machine, and handoff instantly.",
    cta: "See CNC Shop Demo",
    demoLabel: "Live job board — CNC shop",
    features: [
      { icon: ClipboardList, title: "Track Every Job", description: "See status, priority, and what is next in real time." },
      { icon: ArrowRightLeft, title: "Better Shift Handoffs", description: "Keep operators, leads, and supervisors aligned." },
      { icon: Eye, title: "See What's Running Now", description: "Know machine and work order status without guessing." },
    ],
  },
  auto: {
    headline: "Know every vehicle status without asking your team",
    subheadline: "See every bay, repair, and handoff in one place.",
    cta: "See Auto Shop Demo",
    demoLabel: "Live job board — auto repair shop",
    features: [
      { icon: ClipboardList, title: "Track Every Vehicle", description: "See what is checked in, in progress, blocked, or ready." },
      { icon: RefreshCw, title: "Service Updates", description: "Keep advisors and techs aligned without repeated questions." },
      { icon: Eye, title: "Clear Job Status", description: "Reduce confusion on what is waiting, active, or complete." },
    ],
  },
  body: {
    headline: "Stop losing track of repairs and handoffs",
    subheadline: "See every stage from intake to delivery — no guessing.",
    cta: "See Body Shop Demo",
    demoLabel: "Live job board — body shop",
    features: [
      { icon: ClipboardList, title: "Track Repairs by Stage", description: "Follow progress from teardown to paint to delivery." },
      { icon: FileText, title: "No Missed Notes", description: "Keep repair notes visible across the team." },
      { icon: ArrowRightLeft, title: "Better Team Handoffs", description: "Reduce delays between departments and touchpoints." },
    ],
  },
  weld: {
    headline: "Missed notes causing rework?",
    subheadline: "See every job, station, and handoff before it slips through.",
    cta: "See Fabrication Demo",
    demoLabel: "Live job board — welding & fabrication",
    features: [
      { icon: ClipboardList, title: "Track Jobs Clearly", description: "Know where every job stands without chasing updates." },
      { icon: RefreshCw, title: "Reduce Rework", description: "Keep notes visible so details do not get lost." },
      { icon: ArrowRightLeft, title: "Improve Handoffs", description: "Make transitions between stations easier to manage." },
    ],
  },
  general: {
    headline: "Keep your shop moving with clear job visibility",
    subheadline: "See every job, status, and handoff — all in one place.",
    cta: "See Your Shop Live",
    demoLabel: "Live job board — small shop",
    features: [
      { icon: ClipboardList, title: "Track Every Job", description: "See work status in one place." },
      { icon: ArrowRightLeft, title: "Better Handoffs", description: "Keep your team aligned." },
      { icon: Eye, title: "Less Guessing", description: "Know what is running and what is next." },
    ],
  },
} as const;

export default function Start() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demoRef = useRef<HTMLElement>(null);

  const rawType = searchParams.get("type") ?? "";
  const src = searchParams.get("src") ?? "unknown";
  const initialType: ShopType = VALID_TYPES.includes(rawType as ShopType)
    ? (rawType as ShopType)
    : "cnc";

  const [selectedType, setSelectedType] = useState<ShopType>(initialType);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("jobline_start_type", selectedType);
    localStorage.setItem("jobline_start_src", src);

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

    trackEvent("start_page_view", {
      type: selectedType,
      src,
      path: "/start",
      ...getUtmParams(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTypeSelect = (type: ShopType) => {
    setSelectedType(type);
    localStorage.setItem("jobline_start_type", type);
    trackEvent("type_selected", { type, src, path: "/start" });
  };

  const handleCtaClick = () => {
    trackEvent("cta_click", { type: selectedType, src, path: "/start" });
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDemoClick = () => {
    trackEvent("demo_click", { type: selectedType, src, path: "/start" });
    navigate("/demo");
  };

  const handleSignupClick = () => {
    trackEvent("signup_click", { type: selectedType, src, path: "/start" });
    navigate("/auth");
  };

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
      trackEvent("email_capture_submit", {
        type: selectedType,
        src,
        path: "/start",
        ...getUtmParams(),
      });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const content = SHOP_CONTENT[selectedType];

  return (
    <>
      <SEOHead
        title="JobLine.ai — Job Tracking Built for Your Shop"
        description="Real-time job tracking for CNC shops, auto repair, body shops, fabrication, and more. Scan. See your shop live in seconds."
        noindex
        canonical="/start"
      />

      <main className="min-h-screen bg-background flex flex-col items-center px-4 py-8 sm:py-12">

        {/* ── Section 1: Top Conversion Block ── */}
        <section className="w-full max-w-md space-y-5">

          {/* Logo */}
          <div className="text-center">
            <img
              src={logo}
              alt="JobLine.ai logo"
              className="h-12 sm:h-14 mx-auto"
              loading="eager"
            />
          </div>

          {/* Dynamic Headline */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
              {content.headline}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {content.subheadline}
            </p>
            <p className="text-sm font-semibold text-foreground/80">
              No more chasing operators. No more guessing.
            </p>
          </div>

          {/* Shop Type Selector */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground text-center">
              What kind of shop are you running?
            </p>
            <div className="flex justify-between gap-1.5">
              {SHOP_TYPES.map(({ type, icon: Icon, label }) => {
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className={[
                      "flex flex-col items-center gap-2 flex-1 py-3 px-1 rounded-xl border-2 cursor-pointer",
                      "transition-all duration-100 min-h-[72px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "active:scale-95",
                      isSelected
                        ? "bg-primary/20 border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                        : "bg-muted/40 border-border/40 hover:bg-muted/80 hover:border-border hover:scale-[1.02]",
                    ].join(" ")}
                    aria-pressed={isSelected}
                  >
                    <Icon
                      className={[
                        "w-6 h-6 transition-all duration-100",
                        isSelected
                          ? "text-primary scale-110 drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]"
                          : "text-muted-foreground",
                      ].join(" ")}
                    />
                    <span
                      className={[
                        "text-[10px] font-bold leading-tight text-center",
                        isSelected ? "text-primary" : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary CTA */}
          <Button
            size="lg"
            className="w-full text-base font-semibold h-12"
            onClick={handleCtaClick}
          >
            {content.cta}
          </Button>

          {/* Dynamic Feature Cards */}
          <div className="space-y-2.5">
            {content.features.map((f) => (
              <Card key={f.title} className="border-border/60">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Section 2: Demo Block ── */}
        <section ref={demoRef} className="w-full max-w-md mt-12 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              See how it works in a real shop
            </h2>
            <p className="text-xs text-muted-foreground">{content.demoLabel}</p>
          </div>

          {/* Demo preview cards — dynamic by shop type */}
          <div className="rounded-xl border border-primary/20 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Live Job Board</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Live</span>
              </span>
            </div>
            {DEMO_JOBS[selectedType].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/70 border border-border/40"
              >
                <span className="text-xs font-medium text-foreground">{item.label}</span>
                <span className={`text-[11px] font-bold ${item.color}`}>{item.status}</span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
              Your board looks like this — updates in real time
            </p>
          </div>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 text-base font-semibold gap-2"
            onClick={handleDemoClick}
          >
            <PlayCircle className="w-5 h-5" />
            Try Live Demo (No Login)
          </Button>
        </section>

        {/* ── Section 3: Credibility ── */}
        <section className="w-full max-w-md mt-10 text-center">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Built for small shops that need clearer job visibility and better handoffs.
          </p>
        </section>

        {/* ── Section 4: Secondary Conversion ── */}
        <section className="w-full max-w-md mt-8 space-y-4">
          <Button
            size="lg"
            className="w-full text-base font-semibold h-12"
            onClick={handleSignupClick}
          >
            Start Free — No Credit Card
          </Button>

          {/* Email Capture */}
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
                Not ready yet? Get product updates.
              </p>
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
                </Button>
              </form>
            </div>
          )}
        </section>

        {/* ── Section 5: Footer ── */}
        <section className="w-full max-w-md mt-10 flex flex-col items-center space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="w-4 h-4" />
            Share this page
          </Button>
          <div className="bg-card p-3 rounded-xl shadow-sm border border-border">
            <QRCodeSVG value={QR_URL} size={100} level="M" />
          </div>
          <p className="text-[10px] text-muted-foreground/60">jobline.ai/start</p>
        </section>

        <SocialShareModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          url={QR_URL}
        />

        <footer className="mt-8 text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Built for small shops. Big impact.
          </p>
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} JobLine.ai
          </p>
        </footer>
      </main>
    </>
  );
}
