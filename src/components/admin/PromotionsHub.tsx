import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { FlyerCampaigns } from "./FlyerCampaigns";
import { openSocialLink } from "@/lib/talent/socialDeepLinks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  FileImage,
  Globe,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  Paperclip,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Share2,
  Sparkles,
  Building2,
} from "lucide-react";

type PromoCampaignType = "event" | "promo";
type SocialPlatform = "linkedin" | "twitter" | "facebook" | "instagram" | "youtube" | "generic";

interface PromoCampaign {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  campaign_type: PromoCampaignType;
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

interface CompanySocialProfile {
  id: string;
  organization_id: string | null;
  company_name: string;
  profile_name: string;
  platform: SocialPlatform;
  profile_url: string;
  handle: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PromoFormState {
  id?: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  campaign_type: PromoCampaignType;
  location_name: string;
  location_address: string;
  starts_at: string;
  ends_at: string;
  qr_target_url: string;
  cta_label: string;
  cover_image_url: string;
  gallery_urls: string[];
  attachment_urls: string[];
  promo_copy: string;
  is_published: boolean;
}

interface SocialProfileFormState {
  id?: string;
  company_name: string;
  profile_name: string;
  platform: SocialPlatform;
  profile_url: string;
  handle: string;
  notes: string;
  is_active: boolean;
}

interface QrAsset {
  title: string;
  url: string;
  fileName: string;
}

interface PromoTemplate {
  key: string;
  label: string;
  type: PromoCampaignType;
  ctaLabel: string;
  description: string;
  promoCopy: string;
}

const emptyPromoForm: PromoFormState = {
  slug: "",
  name: "",
  description: "",
  status: "draft",
  campaign_type: "event",
  location_name: "",
  location_address: "",
  starts_at: "",
  ends_at: "",
  qr_target_url: "",
  cta_label: "Learn more",
  cover_image_url: "",
  gallery_urls: [],
  attachment_urls: [],
  promo_copy: "",
  is_published: false,
};

const emptySocialProfileForm: SocialProfileFormState = {
  company_name: "",
  profile_name: "",
  platform: "linkedin",
  profile_url: "",
  handle: "",
  notes: "",
  is_active: true,
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  generic: "Website",
};

const PROMO_TEMPLATES: PromoTemplate[] = [
  {
    key: "open-house",
    label: "Open House",
    type: "event",
    ctaLabel: "Reserve your spot",
    description: "Invite manufacturers, operators, and prospects to meet the team and see the platform live.",
    promoCopy: "Join us for a hands-on open house built for manufacturing teams. Meet the team, see live workflows, and get a practical look at how JobLine helps the floor move faster.",
  },
  {
    key: "trade-show",
    label: "Trade Show",
    type: "event",
    ctaLabel: "Book a meeting",
    description: "Promote a booth appearance, conference session, or trade show presence.",
    promoCopy: "We’re heading to the show floor. Stop by to see how JobLine helps manufacturing teams coordinate work, reduce blind spots, and keep operations moving in real time.",
  },
  {
    key: "recruiting-push",
    label: "Recruiting Push",
    type: "promo",
    ctaLabel: "Apply now",
    description: "Quick campaign for hiring, talent attraction, and workforce announcements.",
    promoCopy: "We’re growing and looking for operators, leads, and manufacturing talent who want a cleaner, faster way to work. Check out the opportunity and share it with someone strong.",
  },
  {
    key: "product-launch",
    label: "Product Launch",
    type: "promo",
    ctaLabel: "See what’s new",
    description: "Announce a feature release, new program, or launch milestone.",
    promoCopy: "We just launched something new for manufacturing teams. Get the overview, see what changed, and share it with the people who need a faster way to manage the floor.",
  },
];

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start) return "Date not set";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const startLabel = startDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (!endDate) return startLabel;
  const endLabel = endDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: startDate.getFullYear() === endDate.getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${startLabel} - ${endLabel}`;
}

function buildPromoShareText(campaign: PromoFormState | PromoCampaign) {
  const startsAt = "starts_at" in campaign ? campaign.starts_at : campaign.starts_at;
  const endsAt = "ends_at" in campaign ? campaign.ends_at : campaign.ends_at;
  return [
    campaign.name.trim(),
    (campaign.description ?? "").trim(),
    startsAt ? `When: ${formatDateRange(startsAt, endsAt ?? null)}` : "",
    (campaign.location_name ?? "").trim() ? `Where: ${(campaign.location_name ?? "").trim()}` : "",
    (campaign.location_address ?? "").trim(),
    (campaign.promo_copy ?? "").trim(),
    (campaign.cta_label ?? "").trim() && (campaign.qr_target_url ?? "").trim()
      ? `${(campaign.cta_label ?? "").trim()}: ${(campaign.qr_target_url ?? "").trim()}`
      : (campaign.qr_target_url ?? "").trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildComposerUrl(platform: SocialPlatform, targetUrl: string, shareText: string) {
  switch (platform) {
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(shareText)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`;
    case "youtube":
    case "instagram":
    case "generic":
      return null;
  }
}

function QrPanel({ asset }: { asset: QrAsset }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(asset.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function downloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    const size = 1000;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = asset.fileName;
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <QRCodeSVG ref={svgRef} value={asset.url} size={180} level="H" fgColor="#0d1b2a" bgColor="#ffffff" includeMargin />
      <p className="text-sm font-medium text-center">{asset.title}</p>
      <p className="text-xs text-muted-foreground text-center max-w-[220px] break-all">{asset.url}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={copyUrl}>
          <Copy className="w-3 h-3 mr-1" />
          {copied ? "Copied" : "Copy URL"}
        </Button>
        <Button size="sm" variant="outline" onClick={downloadPng}>
          <QrCode className="w-3 h-3 mr-1" />
          PNG
        </Button>
      </div>
    </div>
  );
}

export function PromotionsHub({ organizationId = null }: { organizationId?: string | null }) {
  const [activeTab, setActiveTab] = useState("promotions");
  const [promoCampaigns, setPromoCampaigns] = useState<PromoCampaign[]>([]);
  const [socialProfiles, setSocialProfiles] = useState<CompanySocialProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [socialDialogOpen, setSocialDialogOpen] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "gallery" | "attachment" | null>(null);

  const [promoForm, setPromoForm] = useState<PromoFormState>(emptyPromoForm);
  const [socialForm, setSocialForm] = useState<SocialProfileFormState>(emptySocialProfileForm);

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrAsset, setQrAsset] = useState<QrAsset | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    const [campaignsRes, socialRes] = await Promise.all([
      supabase
        .from("flyer_campaigns" as never)
        .select("id,slug,name,description,status,campaign_type,location_name,location_address,starts_at,ends_at,qr_target_url,cta_label,cover_image_url,gallery_urls,attachment_urls,promo_copy,is_published,created_at,updated_at")
        .in("campaign_type" as never, ["event", "promo"] as never)
        .order("starts_at" as never, { ascending: true, nullsFirst: false } as never) as unknown as Promise<{ data: PromoCampaign[] | null; error: { message?: string } | null }>,
      supabase
        .from("company_social_profiles" as never)
        .select("id,organization_id,company_name,profile_name,platform,profile_url,handle,notes,is_active,created_at,updated_at")
        .or(organizationId ? `organization_id.eq.${organizationId},organization_id.is.null` : "organization_id.is.null")
        .order("company_name" as never)
        .order("profile_name" as never) as unknown as Promise<{ data: CompanySocialProfile[] | null; error: { message?: string } | null }>,
    ]);

    if (campaignsRes.error) toast.error(campaignsRes.error.message ?? "Failed to load promotions.");
    if (socialRes.error) toast.error(socialRes.error.message ?? "Failed to load social profiles.");

    setPromoCampaigns(campaignsRes.data ?? []);
    setSocialProfiles(socialRes.data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [organizationId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function resetPromoForm(next?: Partial<PromoFormState>) {
    setPromoForm({ ...emptyPromoForm, ...next });
  }

  function resetSocialForm(next?: Partial<SocialProfileFormState>) {
    setSocialForm({ ...emptySocialProfileForm, ...next });
  }

  function applyPromoTemplate(template: PromoTemplate) {
    setPromoForm((current) => ({
      ...current,
      campaign_type: template.type,
      description: current.description || template.description,
      cta_label: current.cta_label || template.ctaLabel,
      promo_copy: current.promo_copy || template.promoCopy,
    }));
    toast.success(`${template.label} template applied.`);
  }

  function openPromoDialog(type: PromoCampaignType) {
    resetPromoForm({ campaign_type: type });
    setPromoDialogOpen(true);
  }

  function editPromo(campaign: PromoCampaign) {
    resetPromoForm({
      id: campaign.id,
      slug: campaign.slug,
      name: campaign.name,
      description: campaign.description ?? "",
      status: campaign.status,
      campaign_type: campaign.campaign_type,
      location_name: campaign.location_name ?? "",
      location_address: campaign.location_address ?? "",
      starts_at: toDateTimeLocal(campaign.starts_at),
      ends_at: toDateTimeLocal(campaign.ends_at),
      qr_target_url: campaign.qr_target_url ?? "",
      cta_label: campaign.cta_label ?? "Learn more",
      cover_image_url: campaign.cover_image_url ?? "",
      gallery_urls: Array.isArray(campaign.gallery_urls) ? campaign.gallery_urls : [],
      attachment_urls: Array.isArray(campaign.attachment_urls) ? campaign.attachment_urls : [],
      promo_copy: campaign.promo_copy ?? "",
      is_published: campaign.is_published,
    });
    setPromoDialogOpen(true);
  }

  function editSocialProfile(profile: CompanySocialProfile) {
    resetSocialForm({
      id: profile.id,
      company_name: profile.company_name,
      profile_name: profile.profile_name,
      platform: profile.platform,
      profile_url: profile.profile_url,
      handle: profile.handle ?? "",
      notes: profile.notes ?? "",
      is_active: profile.is_active,
    });
    setSocialDialogOpen(true);
  }

  async function copyText(value: string, successMessage: string) {
    if (!value.trim()) {
      toast.error("Nothing to copy yet.");
      return;
    }
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  }

  async function uploadPromoAsset(file: File, folder: "cover" | "gallery" | "attachment") {
    setUploading(folder);
    try {
      const extension = file.name.split(".").pop() || "bin";
      const slugPart = promoForm.slug || createSlug(promoForm.name) || "promotion";
      const path = `${folder}/${slugPart}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
      const { error } = await supabase.storage.from("flyer-promo-media").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("flyer-promo-media").getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
      return null;
    } finally {
      setUploading(null);
    }
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const url = await uploadPromoAsset(file, "cover");
    if (url) setPromoForm((current) => ({ ...current, cover_image_url: url }));
  }

  async function handleGalleryUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const urls = (await Promise.all(files.map((file) => uploadPromoAsset(file, "gallery")))).filter((value): value is string => Boolean(value));
    if (urls.length) setPromoForm((current) => ({ ...current, gallery_urls: [...current.gallery_urls, ...urls] }));
  }

  async function handleAttachmentUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const urls = (await Promise.all(files.map((file) => uploadPromoAsset(file, "attachment")))).filter((value): value is string => Boolean(value));
    if (urls.length) setPromoForm((current) => ({ ...current, attachment_urls: [...current.attachment_urls, ...urls] }));
  }

  async function savePromoCampaign() {
    const slug = createSlug(promoForm.slug || promoForm.name);
    if (!promoForm.name.trim() || !slug) {
      toast.error("Name and slug are required.");
      return;
    }
    if (!promoForm.qr_target_url.trim()) {
      toast.error("QR target URL is required.");
      return;
    }

    setPromoSaving(true);
    const payload = {
      slug,
      name: promoForm.name.trim(),
      description: promoForm.description.trim() || null,
      status: promoForm.status,
      campaign_type: promoForm.campaign_type,
      location_name: promoForm.location_name.trim() || null,
      location_address: promoForm.location_address.trim() || null,
      starts_at: promoForm.starts_at ? new Date(promoForm.starts_at).toISOString() : null,
      ends_at: promoForm.ends_at ? new Date(promoForm.ends_at).toISOString() : null,
      qr_target_url: promoForm.qr_target_url.trim(),
      cta_label: promoForm.cta_label.trim() || null,
      cover_image_url: promoForm.cover_image_url.trim() || null,
      gallery_urls: promoForm.gallery_urls,
      attachment_urls: promoForm.attachment_urls,
      promo_copy: promoForm.promo_copy.trim() || null,
      is_published: promoForm.is_published,
      updated_at: new Date().toISOString(),
    };

    const result = promoForm.id
      ? await (supabase.from("flyer_campaigns" as never).update(payload as never).eq("id" as never, promoForm.id as never) as unknown as Promise<{ error: { message?: string } | null }>)
      : await (supabase.from("flyer_campaigns" as never).insert(payload as never) as unknown as Promise<{ error: { message?: string } | null }>);

    setPromoSaving(false);
    if (result.error) {
      toast.error(result.error.message ?? "Failed to save promotion.");
      return;
    }

    toast.success(promoForm.id ? "Promotion updated." : "Promotion created.");
    setPromoDialogOpen(false);
    resetPromoForm();
    void fetchData(true);
  }

  async function saveSocialProfile() {
    if (!socialForm.company_name.trim() || !socialForm.profile_name.trim() || !socialForm.profile_url.trim()) {
      toast.error("Company, profile name, and profile URL are required.");
      return;
    }

    setSocialSaving(true);
    const payload = {
      organization_id: organizationId,
      company_name: socialForm.company_name.trim(),
      profile_name: socialForm.profile_name.trim(),
      platform: socialForm.platform,
      profile_url: socialForm.profile_url.trim(),
      handle: socialForm.handle.trim() || null,
      notes: socialForm.notes.trim() || null,
      is_active: socialForm.is_active,
      updated_at: new Date().toISOString(),
    };

    const result = socialForm.id
      ? await (supabase.from("company_social_profiles" as never).update(payload as never).eq("id" as never, socialForm.id as never) as unknown as Promise<{ error: { message?: string } | null }>)
      : await (supabase.from("company_social_profiles" as never).insert(payload as never) as unknown as Promise<{ error: { message?: string } | null }>);

    setSocialSaving(false);
    if (result.error) {
      toast.error(result.error.message ?? "Failed to save social profile.");
      return;
    }

    toast.success(socialForm.id ? "Social profile updated." : "Social profile created.");
    setSocialDialogOpen(false);
    resetSocialForm();
    void fetchData(true);
  }

  async function togglePromoPublished(campaign: PromoCampaign) {
    const { error } = await (supabase
      .from("flyer_campaigns" as never)
      .update({ is_published: !campaign.is_published, updated_at: new Date().toISOString() } as never)
      .eq("id" as never, campaign.id as never) as unknown as Promise<{ error: { message?: string } | null }>);
    if (error) {
      toast.error(error.message ?? "Failed to update publish status.");
      return;
    }
    toast.success(campaign.is_published ? "Promotion unpublished." : "Promotion published.");
    void fetchData(true);
  }

  function showQr(title: string, url: string, slug: string) {
    if (!url.trim()) {
      toast.error("Add a QR target URL first.");
      return;
    }
    setQrAsset({ title, url, fileName: `${slug || createSlug(title) || "promotion"}-qr.png` });
    setQrDialogOpen(true);
  }

  async function quickPost(profile: CompanySocialProfile, campaign: PromoCampaign) {
    const targetUrl = campaign.qr_target_url?.trim();
    if (!targetUrl) {
      toast.error("This promotion is missing its destination URL.");
      return;
    }

    const shareText = buildPromoShareText(campaign);
    await navigator.clipboard.writeText(shareText);
    const composerUrl = buildComposerUrl(profile.platform, targetUrl, shareText);
    trackEvent("company_social_quick_post", {
      platform: profile.platform,
      profile_name: profile.profile_name,
      campaign_type: campaign.campaign_type,
      campaign_slug: campaign.slug,
    });
    if (composerUrl) {
      window.open(composerUrl, "_blank", "noopener,noreferrer");
    } else {
      openSocialLink(profile.profile_url);
    }
    toast.success(`Post copy copied for ${profile.profile_name}.`);
  }

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="h-6 w-56" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const activeProfiles = socialProfiles.filter((profile) => profile.is_active);
  const upcomingCount = promoCampaigns.filter((campaign) => !campaign.starts_at || new Date(campaign.starts_at).getTime() >= Date.now() - 86400000).length;
  const profilesByPlatform = activeProfiles.reduce<Record<SocialPlatform, CompanySocialProfile[]>>(
    (accumulator, profile) => {
      accumulator[profile.platform] = [...(accumulator[profile.platform] ?? []), profile];
      return accumulator;
    },
    {
      linkedin: [],
      twitter: [],
      facebook: [],
      instagram: [],
      youtube: [],
      generic: [],
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Promotions Hub</h2>
          <p className="text-sm text-muted-foreground">Create event promos, stage assets, and launch quick posts from saved company social profiles.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => void fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => openPromoDialog("event")}>
            <CalendarDays className="w-3.5 h-3.5 mr-1" />
            New Event
          </Button>
          <Button size="sm" onClick={() => openPromoDialog("promo")}>
            <Megaphone className="w-3.5 h-3.5 mr-1" />
            New Promo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Profiles", value: activeProfiles.length.toLocaleString() },
          { label: "Upcoming Promotions", value: upcomingCount.toLocaleString() },
          { label: "Published", value: promoCampaigns.filter((campaign) => campaign.is_published).length.toLocaleString() },
          { label: "Drafts", value: promoCampaigns.filter((campaign) => !campaign.is_published).length.toLocaleString() },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-0.5">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="promotions" className="gap-1.5">
            <Megaphone className="w-3.5 h-3.5" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="social-profiles" className="gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Company Profiles
          </TabsTrigger>
          <TabsTrigger value="flyer-ops" className="gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Flyer Ops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">One-Tap Launchers</CardTitle>
              <CardDescription>Start common promotion types with prefilled copy, then only change the details unique to this campaign.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {PROMO_TEMPLATES.map((template) => (
                <Button
                  key={template.key}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    openPromoDialog(template.type);
                    setTimeout(() => applyPromoTemplate(template), 0);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  {template.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {promoCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No promotions yet. Create an event or promo campaign to generate QR codes, attach images, and quick-post from saved company accounts.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {promoCampaigns.map((campaign) => {
                const shareText = buildPromoShareText(campaign);
                return (
                  <Card key={campaign.id} className="overflow-hidden">
                    {campaign.cover_image_url && (
                      <div className="aspect-[16/7] bg-muted">
                        <img src={campaign.cover_image_url} alt={campaign.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">{campaign.name}</CardTitle>
                            <Badge variant={campaign.is_published ? "default" : "outline"}>{campaign.is_published ? "Published" : "Draft"}</Badge>
                            <Badge variant="secondary" className="capitalize">{campaign.campaign_type}</Badge>
                          </div>
                          <CardDescription className="font-mono">/{campaign.slug}</CardDescription>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => editPromo(campaign)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {campaign.description && <p className="text-sm text-muted-foreground">{campaign.description}</p>}
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <span>{formatDateRange(campaign.starts_at, campaign.ends_at)}</span>
                        </div>
                        {(campaign.location_name || campaign.location_address) && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <div>
                              {campaign.location_name && <div>{campaign.location_name}</div>}
                              {campaign.location_address && <div className="text-muted-foreground">{campaign.location_address}</div>}
                            </div>
                          </div>
                        )}
                        {campaign.qr_target_url && (
                          <div className="flex items-start gap-2">
                            <LinkIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <a href={campaign.qr_target_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                              {campaign.qr_target_url}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => void copyText(shareText, "Promo copy copied.")}>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy Post
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void copyText(campaign.qr_target_url ?? "", "Destination URL copied.")}>
                          <LinkIcon className="w-3.5 h-3.5 mr-1" />
                          Copy URL
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => showQr(campaign.name, campaign.qr_target_url ?? "", campaign.slug)}>
                          <QrCode className="w-3.5 h-3.5 mr-1" />
                          QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const emailSubject = encodeURIComponent(campaign.name);
                            const emailBody = encodeURIComponent(`${shareText}\n\n${campaign.qr_target_url ?? ""}`);
                            window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                          }}
                        >
                          <Mail className="w-3.5 h-3.5 mr-1" />
                          Email Kit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => togglePromoPublished(campaign)}>
                          {campaign.is_published ? "Unpublish" : "Publish"}
                        </Button>
                      </div>

                      <div className="space-y-2 rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground">Quick post from company profiles</p>
                        {activeProfiles.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Add company social profiles first so this promotion can launch from the right accounts.</p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {(["linkedin", "twitter", "facebook"] as SocialPlatform[]).map((platform) =>
                                profilesByPlatform[platform][0] ? (
                                  <Button
                                    key={`${campaign.id}-${platform}`}
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => void quickPost(profilesByPlatform[platform][0], campaign)}
                                  >
                                    <Share2 className="w-3.5 h-3.5 mr-1" />
                                    Launch {PLATFORM_LABELS[platform]}
                                  </Button>
                                ) : null,
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {activeProfiles.map((profile) => (
                                <Button key={profile.id} size="sm" variant="ghost" className="border" onClick={() => void quickPost(profile, campaign)}>
                                  <Share2 className="w-3.5 h-3.5 mr-1" />
                                  {profile.profile_name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{(campaign.gallery_urls ?? []).length} image(s)</span>
                        <span>{(campaign.attachment_urls ?? []).length} attachment(s)</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="social-profiles" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-medium">Company Social Profiles</h3>
              <p className="text-xs text-muted-foreground">Save the exact company accounts your team uses so promotions can launch from the right destination quickly.</p>
            </div>
            <Button size="sm" onClick={() => setSocialDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Profile
            </Button>
          </div>

          {socialProfiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No company social profiles yet. Add your LinkedIn, X, Facebook, Instagram, or website profiles here.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {socialProfiles.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{profile.profile_name}</CardTitle>
                        <CardDescription>{profile.company_name}</CardDescription>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => editSocialProfile(profile)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{PLATFORM_LABELS[profile.platform]}</Badge>
                      <Badge variant={profile.is_active ? "default" : "outline"}>{profile.is_active ? "Active" : "Inactive"}</Badge>
                      {profile.handle && <span className="text-muted-foreground">@{profile.handle.replace(/^@/, "")}</span>}
                    </div>
                    <a href={profile.profile_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                      {profile.profile_url}
                    </a>
                    {profile.notes && <p className="text-muted-foreground">{profile.notes}</p>}
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => openSocialLink(profile.profile_url)}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Open Profile
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void copyText(profile.profile_url, "Profile URL copied.")}>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy URL
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="flyer-ops">
          <FlyerCampaigns />
        </TabsContent>
      </Tabs>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          {qrAsset && <QrPanel asset={qrAsset} />}
        </DialogContent>
      </Dialog>

      <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{promoForm.id ? "Edit Promotion" : "Create Promotion"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={promoForm.campaign_type} onValueChange={(value) => setPromoForm((current) => ({ ...current, campaign_type: value as PromoCampaignType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={promoForm.status} onValueChange={(value) => setPromoForm((current) => ({ ...current, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Quick Start Template</Label>
                <div className="flex flex-wrap gap-2">
                  {PROMO_TEMPLATES.filter((template) => template.type === promoForm.campaign_type).map((template) => (
                    <Button key={template.key} type="button" variant="outline" size="sm" onClick={() => applyPromoTemplate(template)}>
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Name</Label>
                <Input
                  value={promoForm.name}
                  onChange={(event) => setPromoForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.id ? current.slug : createSlug(event.target.value),
                  }))}
                  placeholder="Spring open house, webinar, recruiting push..."
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Slug</Label>
                <Input value={promoForm.slug} onChange={(event) => setPromoForm((current) => ({ ...current, slug: createSlug(event.target.value) }))} placeholder="spring-open-house" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={promoForm.description} onChange={(event) => setPromoForm((current) => ({ ...current, description: event.target.value }))} placeholder="Short summary for the event or promotion." />
              </div>
              <div className="space-y-1.5">
                <Label>Venue / Location</Label>
                <Input value={promoForm.location_name} onChange={(event) => setPromoForm((current) => ({ ...current, location_name: event.target.value }))} placeholder="Convention Center Hall B" />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={promoForm.location_address} onChange={(event) => setPromoForm((current) => ({ ...current, location_address: event.target.value }))} placeholder="123 Main St, San Diego, CA" />
              </div>
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="datetime-local" value={promoForm.starts_at} onChange={(event) => setPromoForm((current) => ({ ...current, starts_at: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="datetime-local" value={promoForm.ends_at} onChange={(event) => setPromoForm((current) => ({ ...current, ends_at: event.target.value }))} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>QR Target URL</Label>
                <Input value={promoForm.qr_target_url} onChange={(event) => setPromoForm((current) => ({ ...current, qr_target_url: event.target.value }))} placeholder="https://jobline.ai/..." />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Call To Action</Label>
                <Input value={promoForm.cta_label} onChange={(event) => setPromoForm((current) => ({ ...current, cta_label: event.target.value }))} placeholder="Register now" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Promo Copy</Label>
                <Textarea rows={5} value={promoForm.promo_copy} onChange={(event) => setPromoForm((current) => ({ ...current, promo_copy: event.target.value }))} placeholder="Write the exact post copy your team should publish." />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Media Kit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                  <input ref={attachmentInputRef} type="file" accept="image/*,.pdf,application/pdf" multiple className="hidden" onChange={handleAttachmentUpload} />

                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    {promoForm.cover_image_url ? (
                      <div className="space-y-2">
                        <div className="aspect-[16/7] overflow-hidden rounded-lg border bg-muted">
                          <img src={promoForm.cover_image_url} alt={promoForm.name || "Promotion cover"} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => coverInputRef.current?.click()} disabled={uploading !== null}>
                            {uploading === "cover" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileImage className="w-3.5 h-3.5 mr-1" />}
                            Replace
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setPromoForm((current) => ({ ...current, cover_image_url: "" }))}>Remove</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => coverInputRef.current?.click()} disabled={uploading !== null}>
                        {uploading === "cover" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 mr-1" />}
                        Upload Cover
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Gallery Images</Label>
                      <Button size="sm" variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={uploading !== null}>
                        {uploading === "gallery" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                        Add Images
                      </Button>
                    </div>
                    {promoForm.gallery_urls.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Upload supporting images for posts, flyers, or event listings.</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {promoForm.gallery_urls.map((url) => (
                          <div key={url} className="space-y-2">
                            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                              <img src={url} alt="Promotion asset" className="h-full w-full object-cover" />
                            </div>
                            <Button size="sm" variant="outline" className="w-full" onClick={() => setPromoForm((current) => ({ ...current, gallery_urls: current.gallery_urls.filter((value) => value !== url) }))}>Remove</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Attachments</Label>
                      <Button size="sm" variant="outline" onClick={() => attachmentInputRef.current?.click()} disabled={uploading !== null}>
                        {uploading === "attachment" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Paperclip className="w-3.5 h-3.5 mr-1" />}
                        Add Files
                      </Button>
                    </div>
                    {promoForm.attachment_urls.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Upload PDFs, one-pagers, or extra artwork for the team.</div>
                    ) : (
                      <div className="space-y-2">
                        {promoForm.attachment_urls.map((url) => (
                          <div key={url} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                            <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all">{url.split("/").pop()}</a>
                            <Button size="sm" variant="outline" onClick={() => setPromoForm((current) => ({ ...current, attachment_urls: current.attachment_urls.filter((value) => value !== url) }))}>Remove</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Quick Post Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{buildPromoShareText(promoForm) || "Promo text preview will appear here as you complete the campaign."}</pre>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => void copyText(buildPromoShareText(promoForm), "Promo copy copied.")}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Text
                    </Button>
                    <Button variant="outline" onClick={() => showQr(promoForm.name || "Promotion", promoForm.qr_target_url, promoForm.slug || createSlug(promoForm.name))}>
                      <QrCode className="w-4 h-4 mr-2" />
                      Preview QR
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const emailSubject = encodeURIComponent(promoForm.name || "Promotion draft");
                        const emailBody = encodeURIComponent(`${buildPromoShareText(promoForm)}\n\n${promoForm.qr_target_url}`);
                        window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Draft
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">Publish on save</p>
                      <p className="text-xs text-muted-foreground">Keep drafts staged until your team is ready to post.</p>
                    </div>
                    <Switch checked={promoForm.is_published} onCheckedChange={(checked) => setPromoForm((current) => ({ ...current, is_published: checked }))} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPromoDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => void savePromoCampaign()} disabled={promoSaving}>{promoSaving ? "Saving..." : promoForm.id ? "Save Changes" : "Create Promotion"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{socialForm.id ? "Edit Company Profile" : "Add Company Profile"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input value={socialForm.company_name} onChange={(event) => setSocialForm((current) => ({ ...current, company_name: event.target.value }))} placeholder="JobLine.ai" />
            </div>
            <div className="space-y-1.5">
              <Label>Profile Name</Label>
              <Input value={socialForm.profile_name} onChange={(event) => setSocialForm((current) => ({ ...current, profile_name: event.target.value }))} placeholder="JobLine LinkedIn" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={socialForm.platform} onValueChange={(value) => setSocialForm((current) => ({ ...current, platform: value as SocialPlatform }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Handle</Label>
                <Input value={socialForm.handle} onChange={(event) => setSocialForm((current) => ({ ...current, handle: event.target.value }))} placeholder="joblineai" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Profile URL</Label>
              <Input value={socialForm.profile_url} onChange={(event) => setSocialForm((current) => ({ ...current, profile_url: event.target.value }))} placeholder="https://linkedin.com/company/jobline-ai" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={socialForm.notes} onChange={(event) => setSocialForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional posting notes, ownership details, or approval reminders." />
            </div>
            {organizationId && (
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                This profile is saved to the current organization so the business team only sees the social accounts relevant to this company.
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active profile</p>
                <p className="text-xs text-muted-foreground">Inactive profiles stay on record but won’t show in quick-post actions.</p>
              </div>
              <Switch checked={socialForm.is_active} onCheckedChange={(checked) => setSocialForm((current) => ({ ...current, is_active: checked }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSocialDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => void saveSocialProfile()} disabled={socialSaving}>{socialSaving ? "Saving..." : socialForm.id ? "Save Changes" : "Add Profile"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}