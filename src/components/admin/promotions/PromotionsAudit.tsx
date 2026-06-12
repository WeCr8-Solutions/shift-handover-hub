import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info, Pencil } from "lucide-react";

interface AuditCampaign {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  campaign_type: "event" | "promo";
  location_name: string | null;
  location_address: string | null;
  starts_at: string | null;
  ends_at: string | null;
  qr_target_url: string | null;
  cta_label: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  attachment_urls: string[] | null;
  promo_copy: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface SocialProfile {
  id: string;
  platform: string;
  is_active: boolean;
  profile_url: string;
}

type Severity = "error" | "warn" | "info";
interface Finding {
  campaignId: string;
  severity: Severity;
  message: string;
}

const HTTPS_RE = /^https:\/\//i;

function auditCampaign(c: AuditCampaign): Finding[] {
  const out: Finding[] = [];
  const push = (severity: Severity, message: string) => out.push({ campaignId: c.id, severity, message });

  if (!c.name?.trim()) push("error", "Missing name.");
  if (!c.qr_target_url) push("error", "No QR/CTA destination URL — share buttons and QR codes will fail.");
  else if (!HTTPS_RE.test(c.qr_target_url)) push("warn", "Destination URL is not https — social platforms may downrank or block.");

  if (!c.cover_image_url) push("warn", "No cover image — link previews on LinkedIn/X/email will be blank.");
  if (!c.description?.trim()) push("warn", "No short description — empty cards on the public site.");
  if (!c.promo_copy?.trim()) push("warn", "No long-form promo copy — quick-post buttons will publish thin content.");
  if (!c.cta_label?.trim()) push("info", "No CTA label set — defaults to 'Learn more'.");

  if (c.campaign_type === "event") {
    if (!c.starts_at) push("error", "Event missing start date/time.");
    if (c.starts_at && c.ends_at && new Date(c.ends_at) < new Date(c.starts_at)) {
      push("error", "Event end date is before start date.");
    }
    if (c.starts_at && new Date(c.starts_at) < new Date()) push("warn", "Event start date is in the past.");
    if (!c.location_name?.trim() && !c.location_address?.trim()) push("warn", "No location set on an event.");
  }

  const draftAgeDays = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
  if (!c.is_published && draftAgeDays > 30) {
    push("warn", `Draft has been sitting for ${draftAgeDays} days — publish or archive.`);
  }
  if (c.is_published && c.starts_at && new Date(c.starts_at) < new Date(Date.now() - 30 * 86_400_000)) {
    push("info", "Published promotion is more than 30 days past its start — consider unpublishing.");
  }

  if ((c.gallery_urls?.length ?? 0) === 0 && c.campaign_type === "event") {
    push("info", "No gallery images — events do better with 2–4 supporting photos.");
  }

  return out;
}

const SEVERITY_META: Record<Severity, { label: string; icon: typeof AlertTriangle; tone: string }> = {
  error: { label: "Blocker", icon: AlertTriangle, tone: "text-destructive" },
  warn: { label: "Warning", icon: AlertTriangle, tone: "text-amber-600 dark:text-amber-400" },
  info: { label: "Suggestion", icon: Info, tone: "text-muted-foreground" },
};

export function PromotionsAudit({
  campaigns,
  socialProfiles,
  onEdit,
}: {
  campaigns: AuditCampaign[];
  socialProfiles: SocialProfile[];
  onEdit: (c: AuditCampaign) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, { campaign: AuditCampaign; findings: Finding[] }>();
    for (const c of campaigns) {
      const findings = auditCampaign(c);
      if (findings.length) map.set(c.id, { campaign: c, findings });
    }
    return Array.from(map.values()).sort((a, b) => {
      const score = (f: Finding[]) => f.reduce((s, x) => s + (x.severity === "error" ? 100 : x.severity === "warn" ? 10 : 1), 0);
      return score(b.findings) - score(a.findings);
    });
  }, [campaigns]);

  const totals = useMemo(() => {
    const all = grouped.flatMap((g) => g.findings);
    return {
      errors: all.filter((f) => f.severity === "error").length,
      warns: all.filter((f) => f.severity === "warn").length,
      infos: all.filter((f) => f.severity === "info").length,
      clean: campaigns.length - grouped.length,
    };
  }, [grouped, campaigns.length]);

  const profileChecks = useMemo(() => {
    const active = socialProfiles.filter((p) => p.is_active);
    const missing: string[] = [];
    for (const platform of ["linkedin", "twitter", "facebook"]) {
      if (!active.some((p) => p.platform === platform)) missing.push(platform);
    }
    return { active, missing };
  }, [socialProfiles]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Clean", value: totals.clean, tone: "text-green-600 dark:text-green-400" },
          { label: "Blockers", value: totals.errors, tone: "text-destructive" },
          { label: "Warnings", value: totals.warns, tone: "text-amber-600 dark:text-amber-400" },
          { label: "Suggestions", value: totals.infos, tone: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.tone}`}>{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Distribution readiness</CardTitle>
          <CardDescription>Quick-post buttons only fire when these company profiles are active.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Active company profiles: <strong>{profileChecks.active.length}</strong></p>
          {profileChecks.missing.length > 0 ? (
            <p className="text-amber-600 dark:text-amber-400">
              Missing: {profileChecks.missing.join(", ")} — add these under Company Profiles for one-click launches.
            </p>
          ) : (
            <p className="text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> LinkedIn, X, and Facebook are all wired up.</p>
          )}
        </CardContent>
      </Card>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            No issues found across {campaigns.length} promotion(s).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ campaign, findings }) => (
            <Card key={campaign.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <CardDescription className="font-mono">/{campaign.slug}</CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant={campaign.is_published ? "default" : "outline"}>{campaign.is_published ? "Published" : "Draft"}</Badge>
                    <Badge variant="secondary" className="capitalize">{campaign.campaign_type}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => onEdit(campaign)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {findings.map((f, i) => {
                    const meta = SEVERITY_META[f.severity];
                    const Icon = meta.icon;
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.tone}`} />
                        <span><span className={`font-medium ${meta.tone}`}>{meta.label}:</span> {f.message}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
