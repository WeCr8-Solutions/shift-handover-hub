import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cookie } from "lucide-react";
import {
  COOKIE_PREFS_EVENT,
  initConsentDefaults,
  isGpcEnabled,
  readConsent,
  writeConsent,
} from "@/lib/consent";

/**
 * Google Consent Mode v2 banner.
 * - Default-deny: shows banner until user makes a choice.
 * - Honors Global Privacy Control (auto-rejects non-essential).
 * - Granular preferences dialog.
 */
export function CookieConsent() {
  const [bannerOpen, setBannerOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Initialise defaults + decide whether to show banner
  useEffect(() => {
    initConsentDefaults();
    const existing = readConsent();
    if (existing) {
      setFunctional(existing.functional);
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
      return;
    }
    if (isGpcEnabled()) {
      // Auto-record a deny-all decision; do not pester the user.
      writeConsent({ functional: false, analytics: false, marketing: false });
      return;
    }
    setBannerOpen(true);
  }, []);

  // Allow other components (footer link, cookies page) to reopen preferences
  useEffect(() => {
    const handler = () => {
      const existing = readConsent();
      setFunctional(existing?.functional ?? false);
      setAnalytics(existing?.analytics ?? false);
      setMarketing(existing?.marketing ?? false);
      setPrefsOpen(true);
    };
    window.addEventListener(COOKIE_PREFS_EVENT, handler);
    return () => window.removeEventListener(COOKIE_PREFS_EVENT, handler);
  }, []);

  const acceptAll = () => {
    writeConsent({ functional: true, analytics: true, marketing: true });
    setFunctional(true);
    setAnalytics(true);
    setMarketing(true);
    setBannerOpen(false);
    setPrefsOpen(false);
  };

  const rejectAll = () => {
    writeConsent({ functional: false, analytics: false, marketing: false });
    setFunctional(false);
    setAnalytics(false);
    setMarketing(false);
    setBannerOpen(false);
    setPrefsOpen(false);
  };

  const savePrefs = () => {
    writeConsent({ functional, analytics, marketing });
    setBannerOpen(false);
    setPrefsOpen(false);
  };

  return (
    <>
      {bannerOpen && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden />
              <p className="text-sm text-muted-foreground">
                We use cookies to run JobLine and—only with your consent—measure performance and improve
                our marketing. See our{" "}
                <Link to="/cookies" className="underline hover:text-foreground">
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setPrefsOpen(true)}>
                Preferences
              </Button>
              <Button variant="outline" size="sm" onClick={rejectAll}>
                Reject all
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept all
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Choose which categories of cookies JobLine.ai may use. You can change these any time from
              the <Link to="/cookies" className="underline">Cookie Policy</Link> page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <PrefRow
              title="Strictly necessary"
              description="Authentication, RLS context, security, and consent recording. Always on."
              checked
              disabled
            />
            <PrefRow
              title="Functional"
              description="UI preferences, onboarding state, dismissed banners."
              checked={functional}
              onCheckedChange={setFunctional}
            />
            <PrefRow
              title="Analytics"
              description="Google Analytics 4 in Consent Mode v2 — page views and feature usage."
              checked={analytics}
              onCheckedChange={setAnalytics}
            />
            <PrefRow
              title="Marketing"
              description="Conversion measurement on marketing pages only (Google Ads / Floodlight)."
              checked={marketing}
              onCheckedChange={setMarketing}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={rejectAll} className="sm:mr-auto">
              Reject all
            </Button>
            <Button variant="ghost" onClick={savePrefs}>
              Save choices
            </Button>
            <Button onClick={acceptAll}>Accept all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PrefRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
