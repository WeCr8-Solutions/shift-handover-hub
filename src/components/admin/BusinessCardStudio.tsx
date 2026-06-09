import { useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, Printer, Save, FileImage, FileText } from "lucide-react";
import { useCampaignMarketingAssets } from "@/hooks/useCampaignMarketingAssets";

/**
 * Printable double-sided business cards (3.5" × 2" US standard).
 *
 * Front: contact / rep / talent info + QR (linking to a JobLine /card/:slug,
 *        /talent/:username, or any URL the rep provides).
 * Back:  generic JobLine.ai branding + QR to https://jobline.ai.
 *
 * Output: PNG (per side, 1050×600 px at 300dpi-ish) + combined PDF for printers.
 * Optional: archive both sides into the active campaign's marketing gallery as
 * `business_card` assets so reps can pull them back later in the ZIP package.
 */

// US standard business card with VistaPrint-grade bleed/trim/safety zones.
// See docs/marketing/business-cards/README.md for source templates + spec.
const TRIM_W_IN = 3.5;
const TRIM_H_IN = 2.0;
const BLEED_IN = 0.125;            // 0.125" bleed on all sides
const SAFETY_IN = 0.125;           // keep content 0.125" inside trim
const BLEED_W_IN = TRIM_W_IN + BLEED_IN * 2;   // 3.625"
const BLEED_H_IN = TRIM_H_IN + BLEED_IN * 2;   // 2.125"
const PX_PER_IN = 300;             // 300 dpi print-ready
const CARD_W_PX = BLEED_W_IN * PX_PER_IN;      // 1087.5 → rendered 1088
const CARD_H_PX = BLEED_H_IN * PX_PER_IN;      // 637.5  → rendered 638
const BLEED_PX = BLEED_IN * PX_PER_IN;         // 37.5
const SAFETY_PX = (BLEED_IN + SAFETY_IN) * PX_PER_IN; // 75 from outer edge

type CardKind = "rep" | "talent";

interface BusinessCardStudioProps {
  /** Optional campaign — when set, "Save to gallery" archives the rendered cards. */
  campaignId?: string | null;
  /** Optional initial talent slug, e.g. from a profile page. */
  initialTalentSlug?: string;
}

export function BusinessCardStudio({
  campaignId = null,
  initialTalentSlug = "",
}: BusinessCardStudioProps) {
  const [kind, setKind] = useState<CardKind>("rep");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("JobLine.ai");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("https://jobline.ai");
  const [talentSlug, setTalentSlug] = useState(initialTalentSlug);
  const [tagline, setTagline] = useState("Digital Expeditor for Job Shops");
  const [accent, setAccent] = useState("#0F62FE");
  const [busy, setBusy] = useState(false);

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const gallery = useCampaignMarketingAssets(campaignId);

  const frontUrl = useMemo(() => {
    if (kind === "talent" && talentSlug.trim()) {
      const s = talentSlug.trim().replace(/^\/+/, "");
      return s.startsWith("http") ? s : `https://jobline.ai/talent/${s}`;
    }
    if (talentSlug.trim()) {
      const s = talentSlug.trim();
      return s.startsWith("http") ? s : `https://jobline.ai/card/${s}`;
    }
    return website || "https://jobline.ai";
  }, [kind, talentSlug, website]);

  const backUrl = "https://jobline.ai";

  async function renderSidePng(el: HTMLDivElement | null): Promise<Blob | null> {
    if (!el) return null;
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png", 1),
    );
  }

  async function downloadPngs() {
    setBusy(true);
    try {
      const [front, back] = await Promise.all([
        renderSidePng(frontRef.current),
        renderSidePng(backRef.current),
      ]);
      if (!front || !back) throw new Error("Render failed");
      triggerDownload(front, `business-card-front-${slugify(fullName || "jobline")}.png`);
      triggerDownload(back, `business-card-back-jobline.png`);
      toast.success("Card images downloaded");
    } catch (e) {
      toast.error("Failed to render card");
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      const [front, back] = await Promise.all([
        renderSidePng(frontRef.current),
        renderSidePng(backRef.current),
      ]);
      if (!front || !back) throw new Error("Render failed");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "in",
        format: [BLEED_W_IN, BLEED_H_IN],
      });
      pdf.addImage(await blobToDataUrl(front), "PNG", 0, 0, BLEED_W_IN, BLEED_H_IN);
      pdf.addPage([BLEED_W_IN, BLEED_H_IN], "landscape");
      pdf.addImage(await blobToDataUrl(back), "PNG", 0, 0, BLEED_W_IN, BLEED_H_IN);
      pdf.save(`business-card-${slugify(fullName || "jobline")}-print-ready.pdf`);
      toast.success("Print-ready PDF saved (3.625″×2.125″ with bleed)");
    } catch {
      toast.error("Failed to build PDF");
    } finally {
      setBusy(false);
    }
  }

  async function saveToGallery() {
    if (!campaignId) {
      toast.error("Select a campaign to archive cards");
      return;
    }
    setBusy(true);
    try {
      const [front, back] = await Promise.all([
        renderSidePng(frontRef.current),
        renderSidePng(backRef.current),
      ]);
      if (!front || !back) throw new Error("Render failed");
      const baseName = slugify(fullName || (kind === "talent" ? "talent" : "jobline-rep"));
      await gallery.uploadAsset({
        file: front,
        filename: `business-card-${baseName}-front.png`,
        kind: "business_card",
        title: `${fullName || "Card"} — Front`,
        notes: `${kind === "talent" ? "Talent" : "Rep"} side. QR → ${frontUrl}`,
        utmContent: `bizcard_${kind}_front`,
        utmTargetUrl: frontUrl,
      });
      await gallery.uploadAsset({
        file: back,
        filename: `business-card-${baseName}-back.png`,
        kind: "business_card",
        title: `${fullName || "Card"} — Back (JobLine.ai)`,
        notes: `Generic JobLine.ai brand side. QR → ${backUrl}`,
        utmContent: "bizcard_jobline_back",
        utmTargetUrl: backUrl,
      });
      toast.success("Saved both sides to gallery");
    } catch (e) {
      toast.error("Failed to save to gallery");
    } finally {
      setBusy(false);
    }
  }

  function printCard() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Card Studio</CardTitle>
          <p className="text-xs text-muted-foreground">
            Double-sided 3.5″ × 2″ cards. Front carries the rep or talent QR; back
            carries the generic JobLine.ai QR for the site.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Card type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as CardKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rep">JobLine.ai Representative</SelectItem>
                  <SelectItem value="talent">Talent / Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Full name" v={fullName} on={setFullName} placeholder="Jane Doe" />
            <Field label="Title" v={title} on={setTitle} placeholder={kind === "rep" ? "Account Executive" : "CNC Machinist"} />
            <Field label="Company" v={company} on={setCompany} />
            <Field label="Email" v={email} on={setEmail} type="email" placeholder="jane@jobline.ai" />
            <Field label="Phone" v={phone} on={setPhone} placeholder="(555) 555-5555" />
            <Field label="Website (optional fallback)" v={website} on={setWebsite} />
            <Field
              label={kind === "talent" ? "Talent username or full URL" : "Card slug, talent username, or full URL"}
              v={talentSlug}
              on={setTalentSlug}
              placeholder={kind === "talent" ? "jane-doe" : "jdoe-card"}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Tagline</Label>
              <Textarea
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-9 w-12 rounded border bg-transparent"
                  aria-label="Accent color"
                />
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Tabs defaultValue="front">
              <TabsList className="w-full">
                <TabsTrigger value="front" className="flex-1">Front (Contact)</TabsTrigger>
                <TabsTrigger value="back" className="flex-1">Back (JobLine.ai)</TabsTrigger>
                <TabsTrigger value="both" className="flex-1">Both</TabsTrigger>
              </TabsList>
              <TabsContent value="front" className="pt-3">
                <CardPreview innerRef={frontRef}>
                  <FrontFace
                    fullName={fullName}
                    title={title}
                    company={company}
                    email={email}
                    phone={phone}
                    tagline={tagline}
                    accent={accent}
                    qrUrl={frontUrl}
                    kind={kind}
                  />
                </CardPreview>
              </TabsContent>
              <TabsContent value="back" className="pt-3">
                <CardPreview innerRef={backRef}>
                  <BackFace tagline={tagline} accent={accent} qrUrl={backUrl} />
                </CardPreview>
              </TabsContent>
              <TabsContent value="both" className="pt-3 space-y-3">
                <CardPreview innerRef={frontRef}>
                  <FrontFace
                    fullName={fullName}
                    title={title}
                    company={company}
                    email={email}
                    phone={phone}
                    tagline={tagline}
                    accent={accent}
                    qrUrl={frontUrl}
                    kind={kind}
                  />
                </CardPreview>
                <CardPreview innerRef={backRef}>
                  <BackFace tagline={tagline} accent={accent} qrUrl={backUrl} />
                </CardPreview>
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadPngs} disabled={busy} size="sm" variant="secondary">
                <FileImage className="w-3.5 h-3.5 mr-1.5" /> PNG (front + back)
              </Button>
              <Button onClick={downloadPdf} disabled={busy} size="sm" variant="secondary">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
              </Button>
              <Button onClick={printCard} disabled={busy} size="sm" variant="outline">
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
              </Button>
              <Button onClick={saveToGallery} disabled={busy || !campaignId} size="sm">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {campaignId ? "Save to gallery" : "Save (pick campaign)"}
              </Button>
            </div>
            {!campaignId && (
              <p className="text-[11px] text-muted-foreground">
                Open this from a campaign's tab to archive the rendered cards into its
                gallery (downloadable later inside the ZIP package).
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Subcomponents ───────────────────────────────────────────────────────── */

function Field({
  label,
  v,
  on,
  placeholder,
  type = "text",
}: {
  label: string;
  v: string;
  on: (s: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={v}
        onChange={(e) => on(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="text-sm"
      />
    </div>
  );
}

function CardPreview({
  innerRef,
  children,
  showGuides = true,
}: {
  innerRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  showGuides?: boolean;
}) {
  // Render at true bleed size (3.625"x2.125") but downscale visually so it fits the panel.
  const scale = 0.32;
  return (
    <div className="overflow-hidden rounded-md border bg-muted/30 p-2">
      <div
        className="origin-top-left relative"
        style={{ transform: `scale(${scale})`, width: CARD_W_PX, height: CARD_H_PX }}
      >
        {/* Exported node: bleed-size, no on-screen guides baked in */}
        <div
          ref={innerRef}
          style={{ width: CARD_W_PX, height: CARD_H_PX }}
          className="bg-white"
        >
          {children}
        </div>
        {showGuides && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            {/* Trim line (3.5"x2") */}
            <div
              style={{
                position: "absolute",
                top: BLEED_PX,
                left: BLEED_PX,
                width: CARD_W_PX - BLEED_PX * 2,
                height: CARD_H_PX - BLEED_PX * 2,
                outline: "3px solid rgba(29,68,184,0.8)",
              }}
            />
            {/* Safety line (3.25"x1.75") */}
            <div
              style={{
                position: "absolute",
                top: SAFETY_PX,
                left: SAFETY_PX,
                width: CARD_W_PX - SAFETY_PX * 2,
                height: CARD_H_PX - SAFETY_PX * 2,
                outline: "3px dashed rgba(23,230,0,0.8)",
              }}
            />
          </div>
        )}
      </div>
      <div style={{ height: CARD_H_PX * scale - CARD_H_PX, marginTop: -8 }} />
    </div>
  );
}

function FrontFace({
  fullName,
  title,
  company,
  email,
  phone,
  tagline,
  accent,
  qrUrl,
  kind,
}: {
  fullName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  tagline: string;
  accent: string;
  qrUrl: string;
  kind: CardKind;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#0F172A",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 18,
          background: `linear-gradient(180deg, ${accent}, ${shade(accent, -25)})`,
        }}
      />
      <div style={{ flex: 1, padding: 36, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, letterSpacing: 2, color: accent, fontWeight: 700, textTransform: "uppercase" }}>
            {kind === "talent" ? "JobLine Talent" : "JobLine.ai"}
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, marginTop: 18, lineHeight: 1.05 }}>
            {fullName || "Your Name"}
          </div>
          {title && (
            <div style={{ fontSize: 20, color: "#475569", marginTop: 6 }}>{title}</div>
          )}
          {company && (
            <div style={{ fontSize: 16, color: "#64748B", marginTop: 2 }}>{company}</div>
          )}
        </div>
        <div style={{ fontSize: 15, color: "#334155", lineHeight: 1.4 }}>
          {email && <div>{email}</div>}
          {phone && <div>{phone}</div>}
        </div>
      </div>
      <div style={{ width: 200, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ background: "#fff", padding: 6, border: `2px solid ${accent}`, borderRadius: 8 }}>
          <QRCodeSVG value={qrUrl} size={140} level="M" fgColor="#0F172A" bgColor="#ffffff" />
        </div>
        <div style={{ fontSize: 10, color: "#64748B", textAlign: "center", maxWidth: 160, wordBreak: "break-all" }}>
          {tagline}
        </div>
      </div>
    </div>
  );
}

function BackFace({ tagline, accent, qrUrl }: { tagline: string; accent: string; qrUrl: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: `linear-gradient(135deg, ${shade(accent, -10)}, ${shade(accent, -45)})`,
        color: "#F8FAFC",
        fontFamily: "Inter, system-ui, sans-serif",
        boxSizing: "border-box",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -1 }}>
        JobLine<span style={{ opacity: 0.7 }}>.ai</span>
      </div>
      <div style={{ background: "#fff", padding: 8, borderRadius: 10 }}>
        <QRCodeSVG value={qrUrl} size={160} level="M" fgColor="#0F172A" bgColor="#ffffff" />
      </div>
      <div style={{ fontSize: 14, opacity: 0.9, textAlign: "center", maxWidth: 460 }}>
        {tagline || "Digital Expeditor for Job Shops"}
      </div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>jobline.ai</div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "card";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Lighten (+) or darken (−) a hex color by a percentage. */
function shade(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return hex;
  const r = clamp(((n >> 16) & 0xff) + Math.round(255 * (pct / 100)));
  const g = clamp(((n >> 8) & 0xff) + Math.round(255 * (pct / 100)));
  const b = clamp((n & 0xff) + Math.round(255 * (pct / 100)));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function clamp(v: number) {
  return Math.max(0, Math.min(255, v));
}

export default BusinessCardStudio;
