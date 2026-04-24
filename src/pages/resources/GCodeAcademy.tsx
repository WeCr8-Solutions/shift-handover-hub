import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChartColumn, ExternalLink, GraduationCap, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGcaAccess } from "@/hooks/useGcaAccess";

type GcaQuickStart = "lathe" | "mill" | "tests" | "metrology" | "progress";

export default function GCodeAcademy() {
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState("100dvh");
  const [pendingQuickStart, setPendingQuickStart] = useState<GcaQuickStart | null>(null);
  const { user, session, profile } = useAuth();
  const { gcaTier, hasProAccess, isDefinitelyFree } = useGcaAccess();

  const runQuickStart = useCallback((target: GcaQuickStart) => {
    const win = iframeRef.current?.contentWindow as (Window & {
      setView?: (view: string) => void;
      setTestCat?: (category: string) => void;
    }) | null;

    if (!win?.setView) return false;

    switch (target) {
      case "lathe":
        win.setView("lathe");
        return true;
      case "mill":
        win.setView("mill");
        return true;
      case "tests":
        win.setView("test");
        win.setTestCat?.("all");
        return true;
      case "metrology":
        win.setView("test");
        win.setTestCat?.("gdnt");
        return true;
      case "progress":
        win.setView("progress");
        return true;
      default:
        return false;
    }
  }, []);

  const queueQuickStart = useCallback((target: GcaQuickStart) => {
    if (!runQuickStart(target)) {
      setPendingQuickStart(target);
    }
  }, [runQuickStart]);

  // Send (or clear) the Supabase session inside the GCA iframe
  const syncAuthToGca = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    if (session && user) {
      win.postMessage(
        {
          type: "GCA_AUTH_INIT",
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
      win.postMessage({ type: "GCA_AUTH_SIGNOUT" }, window.location.origin);
    }
  }, [session, user, profile]);

  // Re-sync whenever auth state changes (login / logout / token refresh)
  useEffect(() => {
    syncAuthToGca();
  }, [syncAuthToGca]);

  useEffect(() => {
    if (pendingQuickStart && runQuickStart(pendingQuickStart)) {
      setPendingQuickStart(null);
    }
  }, [pendingQuickStart, runQuickStart]);

  useEffect(() => {
    const compute = () => {
      const navH = navRef.current?.offsetHeight ?? 56;
      const barH = barRef.current?.offsetHeight ?? 44;
      setIframeHeight(`calc(100dvh - ${navH + barH}px)`);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (navRef.current) ro.observe(navRef.current);
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      <SEOHead
        title="G-Code Academy | CNC Operator Training | JobLine.ai"
        description="Interactive G-Code Academy — learn CNC lathe and mill programming, GD&T, controller-specific syntax (Fanuc, Haas, Siemens, Heidenhain), and pass your CNC operator certification tests."
        canonical="https://jobline.ai/gcode-academy/app"
      />

      {/* Nav wrapper so we can measure its height */}
      <div ref={navRef}>
        <MarketingNav />
      </div>

      {/* Compact info bar */}
      <div
        ref={barRef}
        className="flex items-center justify-between gap-3 px-4 py-2 bg-card border-b border-border shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-sm font-semibold text-foreground truncate">G-Code Academy</h1>
          <Badge variant="secondary" className="text-[10px] shrink-0">v1.0.0</Badge>
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
              <Link to="/pricing">
                <Sparkles className="w-3 h-3" />
                Unlock Pro
              </Link>
            </Button>
          )}
          <a
            href="/gcode-academy/app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
            aria-label="Open G-Code Academy in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full screen</span>
          </a>
        </div>
      </div>

      <div className="border-b border-border bg-muted/20 px-4 py-3 shrink-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Start inside the right GCA section</p>
            <p className="text-xs text-muted-foreground">
              Stay on JobLine.ai and jump straight to lessons, test banks, metrology review, or your progress dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("lathe")}>
              <BookOpen className="w-3.5 h-3.5" />
              Start Lathe
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("mill")}>
              <BookOpen className="w-3.5 h-3.5" />
              Start Mill
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("tests")}>
              <ChartColumn className="w-3.5 h-3.5" />
              Open Test Center
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("metrology")}>
              <Ruler className="w-3.5 h-3.5" />
              GD&T and Metrology
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => queueQuickStart("progress")}>
              <GraduationCap className="w-3.5 h-3.5" />
              My Progress
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to="/gcode-academy/certificates/verify">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify Certificate
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Full-height iframe — fills remaining viewport exactly */}
      <iframe
        ref={iframeRef}
        src="/gcode-academy/index.html"
        title="G-Code Academy — CNC Operator Training by JobLine.ai"
        className="w-full border-0 shrink-0"
        style={{ height: iframeHeight }}
        allow="clipboard-write"
        onLoad={() => {
          syncAuthToGca();
          if (pendingQuickStart && runQuickStart(pendingQuickStart)) {
            setPendingQuickStart(null);
          }
        }}
      />
    </div>
  );
}
