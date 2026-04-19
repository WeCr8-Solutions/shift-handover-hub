import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  type ServiceItem,
  type GalleryItem,
  type TestimonialItem,
  type BusinessHours,
  DAY_LABELS,
  newId,
} from "@/lib/talent/miniSiteTypes";

interface MiniSiteData {
  services: ServiceItem[];
  gallery: GalleryItem[];
  testimonials: TestimonialItem[];
  business_hours: BusinessHours | null;
  vcard_full_name: string;
  vcard_title: string;
  vcard_company: string;
  theme_color: string;
  accent_color: string;
  cta_label: string;
  cta_url: string;
  card_slug: string;
}

const empty: MiniSiteData = {
  services: [],
  gallery: [],
  testimonials: [],
  business_hours: null,
  vcard_full_name: "",
  vcard_title: "",
  vcard_company: "",
  theme_color: "",
  accent_color: "",
  cta_label: "",
  cta_url: "",
  card_slug: "",
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

/**
 * Mini-site editor — manages all "business card / digital storefront" fields
 * stored on operator_profiles. Drop into the operator profile editor under a
 * dedicated "Mini-site" tab.
 */
export function MiniSiteEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<MiniSiteData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: row } = await supabase
        .from("operator_profiles")
        .select(
          `services, gallery, testimonials, business_hours,
           vcard_full_name, vcard_title, vcard_company,
           theme_color, accent_color, cta_label, cta_url, card_slug`
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (row) {
        const r = row as Record<string, unknown>;
        setData({
          services: (r.services as ServiceItem[]) ?? [],
          gallery: (r.gallery as GalleryItem[]) ?? [],
          testimonials: (r.testimonials as TestimonialItem[]) ?? [],
          business_hours: (r.business_hours as BusinessHours | null) ?? null,
          vcard_full_name: (r.vcard_full_name as string) ?? "",
          vcard_title: (r.vcard_title as string) ?? "",
          vcard_company: (r.vcard_company as string) ?? "",
          theme_color: (r.theme_color as string) ?? "",
          accent_color: (r.accent_color as string) ?? "",
          cta_label: (r.cta_label as string) ?? "",
          cta_url: (r.cta_url as string) ?? "",
          card_slug: (r.card_slug as string) ?? "",
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    const cleanSlug = data.card_slug ? slugify(data.card_slug) : null;
    const { error } = await supabase.from("operator_profiles").upsert(
      {
        user_id: user.id,
        services: data.services,
        gallery: data.gallery,
        testimonials: data.testimonials,
        business_hours: data.business_hours,
        vcard_full_name: data.vcard_full_name || null,
        vcard_title: data.vcard_title || null,
        vcard_company: data.vcard_company || null,
        theme_color: data.theme_color || null,
        accent_color: data.accent_color || null,
        cta_label: data.cta_label || null,
        cta_url: data.cta_url || null,
        card_slug: cleanSlug,
      } as never,
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      const msg = error.code === "23505" ? "That card link is already taken." : error.message;
      toast({ title: "Save failed", description: msg, variant: "destructive" });
      return;
    }
    if (cleanSlug && cleanSlug !== data.card_slug) {
      setData((d) => ({ ...d, card_slug: cleanSlug }));
    }
    toast({ title: "Mini-site saved" });
  };

  const setDay = (
    key: keyof BusinessHours,
    field: "open" | "close" | "off",
    value: string | boolean
  ) => {
    setData((d) => {
      const hours = (d.business_hours ?? {
        mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null,
      }) as BusinessHours;
      if (field === "off") {
        return {
          ...d,
          business_hours: {
            ...hours,
            [key]: value ? null : { open: "09:00", close: "17:00" },
          },
        };
      }
      const slot = (hours[key] ?? { open: "09:00", close: "17:00" }) as { open: string; close: string };
      return {
        ...d,
        business_hours: { ...hours, [key]: { ...slot, [field]: value as string } },
      };
    });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading mini-site editor…</p>;
  }

  const cardUrl = data.card_slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/card/${data.card_slug}`
    : "";

  return (
    <div className="space-y-6">
      {/* Business card identity */}
      <Card>
        <CardHeader>
          <CardTitle>Digital business card</CardTitle>
          <CardDescription>
            Powers your <code>/card/:slug</code> short link, the vCard download, and the QR sticker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Full name (vCard)</Label>
              <Input
                value={data.vcard_full_name}
                onChange={(e) => setData({ ...data, vcard_full_name: e.target.value })}
                placeholder="Jane Operator"
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={data.vcard_title}
                onChange={(e) => setData({ ...data, vcard_title: e.target.value })}
                placeholder="Senior CNC Machinist"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={data.vcard_company}
                onChange={(e) => setData({ ...data, vcard_company: e.target.value })}
                placeholder="Acme Precision"
              />
            </div>
            <div>
              <Label>Card short link</Label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 bg-muted text-xs text-muted-foreground">
                  /card/
                </span>
                <Input
                  className="rounded-l-none"
                  value={data.card_slug}
                  onChange={(e) => setData({ ...data, card_slug: e.target.value })}
                  placeholder="jane-operator"
                />
              </div>
              {cardUrl && (
                <a
                  href={cardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Preview <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Theme color (hex)</Label>
              <Input
                type="text"
                value={data.theme_color}
                onChange={(e) => setData({ ...data, theme_color: e.target.value })}
                placeholder="#0f172a"
              />
            </div>
            <div>
              <Label>Accent color (hex)</Label>
              <Input
                type="text"
                value={data.accent_color}
                onChange={(e) => setData({ ...data, accent_color: e.target.value })}
                placeholder="#22d3ee"
              />
            </div>
            <div>
              <Label>CTA label</Label>
              <Input
                value={data.cta_label}
                onChange={(e) => setData({ ...data, cta_label: e.target.value })}
                placeholder="Book a consultation"
              />
            </div>
            <div>
              <Label>CTA URL</Label>
              <Input
                value={data.cta_url}
                onChange={(e) => setData({ ...data, cta_url: e.target.value })}
                placeholder="https://calendly.com/yourname"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <ListEditor
        title="Services"
        description="What you offer. Shown on your public profile."
        items={data.services}
        onChange={(services) => setData({ ...data, services })}
        renderItem={(s, update) => (
          <div className="grid sm:grid-cols-3 gap-2">
            <Input
              placeholder="Service title"
              value={s.title}
              onChange={(e) => update({ ...s, title: e.target.value })}
              className="sm:col-span-1"
            />
            <Input
              placeholder="Price (e.g. $45/hr)"
              value={s.price ?? ""}
              onChange={(e) => update({ ...s, price: e.target.value })}
              className="sm:col-span-1"
            />
            <Textarea
              placeholder="Short description"
              value={s.description ?? ""}
              onChange={(e) => update({ ...s, description: e.target.value })}
              rows={2}
              className="sm:col-span-3"
            />
          </div>
        )}
        empty={() => ({ id: newId(), title: "", description: "", price: "" })}
      />

      {/* Gallery */}
      <ListEditor
        title="Portfolio gallery"
        description="Image URLs for work samples. Upload first to your profile, then paste the URL here."
        items={data.gallery}
        onChange={(gallery) => setData({ ...data, gallery })}
        renderItem={(g, update) => (
          <div className="grid sm:grid-cols-3 gap-2 items-center">
            <Input
              placeholder="https://…/image.jpg"
              value={g.url}
              onChange={(e) => update({ ...g, url: e.target.value })}
              className="sm:col-span-2"
            />
            <Input
              placeholder="Caption"
              value={g.caption ?? ""}
              onChange={(e) => update({ ...g, caption: e.target.value })}
            />
            {g.url && (
              <img
                src={g.url}
                alt={g.caption ?? "preview"}
                className="sm:col-span-3 h-20 w-32 object-cover rounded border"
              />
            )}
          </div>
        )}
        empty={() => ({ id: newId(), url: "", caption: "" })}
      />

      {/* Testimonials */}
      <ListEditor
        title="Testimonials"
        description="Quotes from coworkers, supervisors, or clients."
        items={data.testimonials}
        onChange={(testimonials) => setData({ ...data, testimonials })}
        renderItem={(t, update) => (
          <div className="space-y-2">
            <Textarea
              placeholder="Quote"
              rows={2}
              value={t.quote}
              onChange={(e) => update({ ...t, quote: e.target.value })}
            />
            <div className="grid sm:grid-cols-2 gap-2">
              <Input
                placeholder="Author"
                value={t.author}
                onChange={(e) => update({ ...t, author: e.target.value })}
              />
              <Input
                placeholder="Role"
                value={t.role ?? ""}
                onChange={(e) => update({ ...t, role: e.target.value })}
              />
            </div>
          </div>
        )}
        empty={() => ({ id: newId(), quote: "", author: "", role: "" })}
      />

      {/* Business hours */}
      <Card>
        <CardHeader>
          <CardTitle>Business hours</CardTitle>
          <CardDescription>Optional — show when you're available.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DAY_LABELS.map(({ key, label }) => {
            const slot = data.business_hours?.[key] as { open: string; close: string } | null;
            const off = slot == null;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="w-12 font-medium">{label}</span>
                <Button
                  type="button"
                  size="sm"
                  variant={off ? "outline" : "secondary"}
                  className="h-8 w-20"
                  onClick={() => setDay(key, "off", !off)}
                >
                  {off ? "Closed" : "Open"}
                </Button>
                {!off && (
                  <>
                    <Input
                      type="time"
                      value={slot?.open ?? "09:00"}
                      onChange={(e) => setDay(key, "open", e.target.value)}
                      className="h-8 w-28"
                    />
                    <span>–</span>
                    <Input
                      type="time"
                      value={slot?.close ?? "17:00"}
                      onChange={(e) => setDay(key, "close", e.target.value)}
                      className="h-8 w-28"
                    />
                  </>
                )}
              </div>
            );
          })}
          <div>
            <Label>Notes (optional)</Label>
            <Input
              placeholder="By appointment, holidays closed, etc."
              value={data.business_hours?.notes ?? ""}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  business_hours: { ...(d.business_hours ?? { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null }), notes: e.target.value },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? "Saving…" : (<><Save className="w-4 h-4" /> Save mini-site</>)}
        </Button>
      </div>
    </div>
  );
}

interface ListEditorProps<T extends { id: string }> {
  title: string;
  description: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, update: (next: T) => void) => React.ReactNode;
  empty: () => T;
}

function ListEditor<T extends { id: string }>({
  title,
  description,
  items,
  onChange,
  renderItem,
  empty,
}: ListEditorProps<T>) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="rounded-lg border bg-muted/20 p-3 space-y-2 relative">
            {renderItem(item, (next) => {
              const copy = items.slice();
              copy[idx] = next;
              onChange(copy);
            })}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-7 w-7 text-destructive"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              aria-label="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, empty()])}
          className="gap-1"
        >
          <Plus className="w-4 h-4" /> Add
        </Button>
      </CardContent>
    </Card>
  );
}
