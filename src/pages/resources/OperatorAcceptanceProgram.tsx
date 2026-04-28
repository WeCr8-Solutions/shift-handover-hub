import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ClipboardCheck, ExternalLink, FolderKanban, ShieldCheck, Sparkles, UserCheck, Users, Video, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useGcaAccess } from "@/hooks/useGcaAccess";

type OapQuickStart = "certify" | "employer" | "programs" | "operators" | "mentors";

const OAP_QUICKSTART_LABEL: Record<OapQuickStart, string> = {
  certify: "Get Certified",
  employer: "Employer Setup",
  programs: "Role Programs",
  operators: "Active Operators",
  mentors: "Mentors",
};

/**
 * Operator Acceptance Program (OAP)
 *
 * Same iframe-wrapper pattern as GCodeAcademy. The OAP HTML is deployed at
 * /public/oap/index.html and is fully self-contained. We sync auth via
 * postMessage so the OAP can store progress against the user's account.
 */
export default function OperatorAcceptanceProgram() {
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState("100dvh");
  const [pendingQuickStart, setPendingQuickStart] = useState<OapQuickStart | null>(null);
  const { user, session, profile } = useAuth();
  const { gcaTier, hasProAccess, isDefinitelyFree } = useGcaAccess();

  const focusIframe = useCallback(() => {
    const el = iframeRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      try { el.focus({ preventScroll: true }); } catch { /* noop */ }
    }, 250);
  }, []);

  const runQuickStart = useCallback((target: OapQuickStart) => {
    const win = iframeRef.current?.contentWindow as (Window & {
      oapSetView?: (view: string, subView?: string) => void;
    }) | null;

    if (!win?.oapSetView) return false;

    switch (target) {
      case "certify":
        win.oapSetView("standalone");
        return true;
      case "employer":
        win.oapSetView("employer", "setup");
        return true;
      case "programs":
        win.oapSetView("program", "list");
        return true;
      case "operators":
        win.oapSetView("mentee", "list");
        return true;
      case "mentors":
        win.oapSetView("mentor", "list");
        return true;
      default:
        return false;
    }
  }, []);

  const queueQuickStart = useCallback((target: OapQuickStart) => {
    const ok = runQuickStart(target);
    focusIframe();
    if (!ok) {
      setPendingQuickStart(target);
      toast.message(`Opening ${OAP_QUICKSTART_LABEL[target]}…`, {
        description: "Loading the OAP workspace.",
      });
    }
  }, [runQuickStart, focusIframe]);

  const syncAuth = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    if (session && user) {
      win.postMessage(
        {
          type: "OAP_AUTH_INIT",
          token: session.access_token,
          user: {
            id: user.id,
            email: user.email ?? "",
            name: profile?.display_name ?? user.user_metadata?.display_name ?? user.email ?? "",
            tier: gcaTier,
            createdAt: user.created_at,
          },
        },
        window.location.origin
      );
    } else {
      win.postMessage({ type: "OAP_AUTH_SIGNOUT" }, window.location.origin);
    }
  }, [session, user, profile, gcaTier]);

  useEffect(() => {
    syncAuth();
  }, [syncAuth]);

  useEffect(() => {
    if (pendingQuickStart && runQuickStart(pendingQuickStart)) {
      setPendingQuickStart(null);
    }
  }, [pendingQuickStart, runQuickStart]);

  useEffect(() => {
    const compute = () => {
      const navH = navRef.current?.offsetHeight ?? 56;
      const barH = barRef.current?.offsetHeight ?? 44;
      // Match the visible viewport on mobile (still scrollable inside the iframe)
      // and grow naturally on desktop. 480px floor keeps usable height on
      // tiny viewports without forcing 760px on phones.
      const minH = 480;
      const target = Math.max(minH, window.innerHeight - (navH + barH));
      setIframeHeight(`${target}px`);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (navRef.current) ro.observe(navRef.current);
    if (barRef.current) ro.observe(barRef.current);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead
        title="Operator Acceptance Program (OAP) | CNC Operator Onboarding | JobLine.ai"
        description="Operator Acceptance Program (OAP) — employer-driven CNC operator onboarding, safety, measuring, tooling, machine qualification, and certification. Standalone or employer mode."
        canonical="https://jobline.ai/oap/app"
      />

      <div ref={navRef}>
        <MarketingNav />
      </div>

      <div
        ref={barRef}
        className="flex items-center justify-between gap-3 px-4 py-2 bg-card border-b border-border shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
            <ClipboardCheck className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-sm font-semibold text-foreground truncate">Operator Acceptance Program</h1>
          <Badge variant="secondary" className="text-[10px] shrink-0">v1.1.0</Badge>
          {hasProAccess ? (
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0 hidden sm:inline-flex">
              Pro
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline-flex">
              Free
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDefinitelyFree && (
            <Button asChild size="sm" className="h-7 text-xs px-3 gap-1">
              <Link to="/pricing?from=oap">
                <Sparkles className="w-3 h-3" />
                Unlock Pro
              </Link>
            </Button>
          )}
          <a
            href="/oap/app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
            aria-label="Open OAP in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full screen</span>
          </a>
        </div>
      </div>

      <div className="border-b border-border bg-muted/20 px-4 py-3 shrink-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Start with the OAP path that matches the visitor</p>
            <p className="text-xs text-muted-foreground">
              Keep the experience on JobLine.ai while sending employers and operators straight to setup, programs, active operators, or certification.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("certify")}>
              <ClipboardCheck className="w-3.5 h-3.5" />
              Get Certified
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("employer")}>
              <Building2 className="w-3.5 h-3.5" />
              Employer Setup
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("programs")}>
              <FolderKanban className="w-3.5 h-3.5" />
              Role Programs
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("operators")}>
              <Users className="w-3.5 h-3.5" />
              Active Operators
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("mentors")}>
              <UserCheck className="w-3.5 h-3.5" />
              Mentors
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to="/verify">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify Certificate
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background/95 px-4 py-4 shrink-0">
        <div className="grid gap-4 xl:grid-cols-[1.3fr,1fr]">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid gap-0 md:grid-cols-[1.1fr,0.9fr]">
              <div className="bg-[hsl(222_47%_8%)] flex items-center justify-center">
                <img
                  src="/oap-og.jpg"
                  alt="Operator Acceptance Program onboarding preview"
                  loading="lazy"
                  className="w-full h-auto object-contain aspect-[1200/630]"
                />
              </div>
              <div className="flex flex-col gap-3 p-5">
                <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-[0.18em]">Onboarding and Certification</Badge>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Land on OAP first, then send visitors into setup, programs, or certification</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Employers can move into setup and role programs, while operators can go directly to learning checkpoints and standalone certification from the same OAP landing page.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="gap-2" onClick={() => queueQuickStart("employer")}>
                    <Building2 className="w-3.5 h-3.5" />
                    Open Employer Setup
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("certify")}>
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Open Certification
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FolderKanban className="w-4 h-4 text-primary" />
                Role Program Builder
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Take supervisors straight from the landing page into role-based onboarding plans and operator qualification paths.
              </p>
              <Button size="sm" variant="ghost" className="mt-3 h-8 px-0 text-xs" onClick={() => queueQuickStart("programs")}>
                Open Program Builder
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Video className="w-4 h-4 text-primary" />
                Learning and Helper Media
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Use the embedded OAP learning flow together with helper media, measurement refreshers, and course-linked review before launching exams.
              </p>
              <Button asChild size="sm" variant="ghost" className="mt-3 h-8 px-0 text-xs">
                <Link to="/handbook">Open Helper Library</Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Wrench className="w-4 h-4 text-primary" />
                Certificate and Operator Support
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Verify portable certificates, then move back into operator dashboards and qualification checkpoints without leaving JobLine.ai.
              </p>
              <Button asChild size="sm" variant="ghost" className="mt-3 h-8 px-0 text-xs">
                <Link to="/verify">Verify OAP Certificate</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src="/oap/index.html"
        title="Operator Acceptance Program — CNC Onboarding by JobLine.ai"
        className="w-full border-0 shrink-0"
        style={{ height: iframeHeight }}
        allow="clipboard-write"
        onLoad={() => {
          syncAuth();
          if (pendingQuickStart && runQuickStart(pendingQuickStart)) {
            setPendingQuickStart(null);
            focusIframe();
          }
        }}
      />
    </div>
  );
}
