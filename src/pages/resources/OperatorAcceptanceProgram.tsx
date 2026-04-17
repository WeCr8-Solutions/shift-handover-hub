import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ExternalLink, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGcaAccess } from "@/hooks/useGcaAccess";

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
  const { user, session, profile } = useAuth();
  const { gcaTier, hasProAccess, isDefinitelyFree } = useGcaAccess();

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
        title="Operator Acceptance Program (OAP) | CNC Operator Onboarding | JobLine.ai"
        description="Operator Acceptance Program (OAP) — employer-driven CNC operator onboarding, safety, measuring, tooling, machine qualification, and certification. Standalone or employer mode."
        canonical="https://jobline.ai/resources/oap"
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
            href="/oap/index.html"
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

      <iframe
        ref={iframeRef}
        src="/oap/index.html"
        title="Operator Acceptance Program — CNC Onboarding by JobLine.ai"
        className="w-full border-0 shrink-0"
        style={{ height: iframeHeight }}
        allow="clipboard-write"
        onLoad={syncAuth}
      />
    </div>
  );
}
