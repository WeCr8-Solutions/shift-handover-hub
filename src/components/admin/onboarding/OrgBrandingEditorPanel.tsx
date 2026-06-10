import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Loader2 } from "lucide-react";
import { useOrgBranding, type BrandingRow } from "@/hooks/useOrgProfileAdmin";

interface Props { organizationId: string | null }

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded border bg-transparent cursor-pointer"
          aria-label={`${label} color`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </div>
  );
}

export function OrgBrandingEditorPanel({ organizationId }: Props) {
  const { query, update } = useOrgBranding(organizationId);
  const [form, setForm] = useState<Partial<BrandingRow>>({});

  useEffect(() => {
    setForm(query.data ?? {});
  }, [query.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="w-4 h-4" /> Branding
        </CardTitle>
        <CardDescription>
          Colors, logos, and support contact details applied across the customer's portal, login page, and email templates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <ColorField label="Primary" value={form.primary_color ?? "#3b82f6"} onChange={(v) => setForm({ ...form, primary_color: v })} />
          <ColorField label="Secondary" value={form.secondary_color ?? "#64748b"} onChange={(v) => setForm({ ...form, secondary_color: v })} />
          <ColorField label="Accent" value={form.accent_color ?? "#f59e0b"} onChange={(v) => setForm({ ...form, accent_color: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Logo (light)</Label>
            <Input value={form.logo_light_url ?? ""} onChange={(e) => setForm({ ...form, logo_light_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Logo (dark)</Label>
            <Input value={form.logo_dark_url ?? ""} onChange={(e) => setForm({ ...form, logo_dark_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Favicon</Label>
            <Input value={form.favicon_url ?? ""} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Login background</Label>
            <Input value={form.login_background_url ?? ""} onChange={(e) => setForm({ ...form, login_background_url: e.target.value })} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Support email</Label>
            <Input type="email" value={form.support_email ?? ""} onChange={(e) => setForm({ ...form, support_email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Support phone</Label>
            <Input value={form.support_phone ?? ""} onChange={(e) => setForm({ ...form, support_phone: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Company tagline</Label>
          <Input value={form.company_tagline ?? ""} onChange={(e) => setForm({ ...form, company_tagline: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email header HTML</Label>
          <Textarea rows={2} value={form.email_header_html ?? ""} onChange={(e) => setForm({ ...form, email_header_html: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email footer HTML</Label>
          <Textarea rows={2} value={form.email_footer_html ?? ""} onChange={(e) => setForm({ ...form, email_footer_html: e.target.value })} />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => update.mutate(form)} disabled={update.isPending} className="gap-2">
            {update.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save branding
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
