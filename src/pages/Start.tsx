import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { captureUtmParams, getUtmParams } from "@/lib/utm";
import {
  Loader2,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/jobline-logo.png";
import { SocialShareModal } from "@/components/SocialShareModal";
import { ShopTypeHandoffDemo } from "@/components/ShopTypeHandoffDemo";
import {
  type ShopType,
  parseShopType,
  SHOP_TYPE_SELECTOR,
  SHOP_TYPE_CONTENT,
} from "@/lib/shopTypes";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);

const QR_URL = "https://jobline.ai/start";



export default function Start() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demoRef = useRef<HTMLElement>(null);
  const secondaryCtaRef = useRef<HTMLElement>(null);
  const pageLoadTime = useRef<number>(Date.now());
  const firedScrollDepths = useRef<Set<number>>(new Set());
  const typeSwitchCount = useRef<number>(0);
  const selectedTypeRef = useRef<ShopType>(parseShopType(searchParams.get("type") ?? ""));

  const rawType = searchParams.get("type") ?? "";
  const src = searchParams.get("src") ?? "unknown";
  const initialType: ShopType = parseShopType(rawType);

  const [selectedType, setSelectedType] = useState<ShopType>(initialType);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Keep selectedTypeRef in sync so event-listener closures always read the latest type
  useEffect(() => {
    selectedTypeRef.current = selectedType;
  }, [selectedType]);

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

    // ── Scroll depth milestones (25 / 50 / 75 / 90) ───────────
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = Math.round((window.scrollY / total) * 100);
      ([25, 50, 75, 90] as const).forEach((depth) => {
        if (pct >= depth && !firedScrollDepths.current.has(depth)) {
          firedScrollDepths.current.add(depth);
          trackEvent(`scroll_${depth}`, {
            type: selectedTypeRef.current,
            src,
            path: "/start",
          });
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // ── Time-on-page engagement milestones (15 / 30 / 60 s) ───
    const engagementTimeouts = ([15, 30, 60] as const).map((sec) =>
      setTimeout(() => {
        trackEvent(`time_on_page_${sec}s`, {
          type: selectedTypeRef.current,
          src,
          path: "/start",
        });
      }, sec * 1000)
    );

    // ── Section visibility via IntersectionObserver ────────────
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = (entry.target as HTMLElement).dataset.trackSection;
          if (id) {
            trackEvent(`section_reached_${id}`, {
              type: selectedTypeRef.current,
              src,
              path: "/start",
            });
            sectionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    if (demoRef.current) sectionObserver.observe(demoRef.current);
    if (secondaryCtaRef.current) sectionObserver.observe(secondaryCtaRef.current);

    // ── Page-session end ───────────────────────────────────────
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - pageLoadTime.current) / 1000);
      const depths = Array.from(firedScrollDepths.current);
      const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
      trackEvent("page_session_end", {
        time_spent_seconds: timeSpent,
        max_scroll_depth: maxDepth,
        type: selectedTypeRef.current,
        src,
        path: "/start",
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      engagementTimeouts.forEach(clearTimeout);
      sectionObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTypeSelect = (type: ShopType) => {
    if (type !== selectedType) {
      typeSwitchCount.current += 1;
      trackEvent("type_switch", {
        from: selectedType,
        to: type,
        switch_count: typeSwitchCount.current,
        src,
        path: "/start",
      });
    }
    setSelectedType(type);
    selectedTypeRef.current = type;
    localStorage.setItem("jobline_start_type", type);
    trackEvent("type_selected", { type, src, path: "/start" });
    // Per-type event for per-vertical funnel analysis in GA4
    trackEvent(`type_selected_${type}`, { src, path: "/start" });
  };

  const handleCtaClick = () => {
    trackEvent("cta_click", { type: selectedType, src, path: "/start" });
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSignupClick = () => {
    trackEvent("signup_click", { type: selectedType, src, path: "/start" });
    navigate("/auth");
  };

  const handleShareClick = () => {
    trackEvent("share_button_click", { type: selectedType, src, path: "/start" });
    setShareOpen(true);
  };

  const handleEmailFocus = () => {
    trackEvent("email_input_focus", { type: selectedType, src, path: "/start" });
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

  const content = SHOP_TYPE_CONTENT[selectedType];

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

          {/* Logo + home button — gives visitors a clear way back to the main site */}
          <div className="text-center space-y-3">
            <Link
              to="/"
              aria-label="JobLine.ai home"
              className="inline-block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img
                src={logo}
                alt="JobLine.ai logo"
                className="h-12 sm:h-14 mx-auto"
                loading="eager"
              />
            </Link>
            <div>
              <Button asChild variant="outline" size="sm">
                <Link to="/">← Back to JobLine.ai</Link>
              </Button>
            </div>
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
              {SHOP_TYPE_SELECTOR.map(({ type, icon: Icon, label }) => {
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

        {/* ── Section 2: Interactive Demo ── */}
        <section ref={demoRef} data-track-section="demo" className="w-full max-w-md mt-12">
          <ShopTypeHandoffDemo shopType={selectedType} />
        </section>

        {/* ── Section 3: Credibility ── */}
        <section className="w-full max-w-md mt-10 text-center">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Built for small shops that need clearer job visibility and better handoffs.
          </p>
        </section>

        {/* ── Section 4: Secondary Conversion ── */}
        <section ref={secondaryCtaRef} data-track-section="secondary_cta" className="w-full max-w-md mt-8 space-y-4">
          <Button
            size="lg"
            className="w-full text-base font-semibold h-12"
            onClick={handleSignupClick}
          >
            Start Free 
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
                  onFocus={handleEmailFocus}
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
            onClick={handleShareClick}
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
