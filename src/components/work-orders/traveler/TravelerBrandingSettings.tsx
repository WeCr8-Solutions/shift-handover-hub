/**
 * TravelerBrandingSettings — Org Admin UI to upload a reusable company logo
 * and configure the printable Work Order Traveler defaults.
 */
import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTravelerSettings, type PaperSize, type PriorityColor } from "@/hooks/useTravelerSettings";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Printer, Loader2 } from "lucide-react";

const COLORS: PriorityColor[] = ["red", "orange", "yellow", "white", "blue", "green", "pink"];
const PRIORITIES = ["critical", "urgent", "high", "normal", "low"] as const;

export function TravelerBrandingSettings() {
  const { settings, logoUrl, isLoading, upsert } = useTravelerSettings();
  const { organization } = useOrgContext();
  const { hasAdminAccess } = useAdminAccess();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [companyLine, setCompanyLine] = useState(settings.company_name_line ?? "");
  const [footer, setFooter] = useState(settings.footer_text ?? "");
  const [paper, setPaper] = useState<PaperSize>(settings.paper_size);
  const [showRouting, setShowRouting] = useState(settings.show_routing);
  const [showSerials, setShowSerials] = useState(settings.show_serials);
  const [showSignoff, setShowSignoff] = useState(settings.show_signoff);
  const [colorMap, setColorMap] = useState(settings.priority_color_map);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!hasAdminAccess) return (
    <div className="p-6 text-sm text-muted-foreground">Only org admins can edit the traveler template.</div>
  );

  const handleUpload = async (file: File) => {
    if (!organization?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${organization.id}/logo.${ext}`;
      const { error } = await supabase.storage
        .from("traveler-branding")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      await upsert.mutateAsync({ logo_path: path });
      toast({ title: "Logo uploaded", description: "Saved to your traveler template." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    try {
      await upsert.mutateAsync({
        company_name_line: companyLine || null,
        footer_text: footer || null,
        paper_size: paper,
        show_routing: showRouting,
        show_serials: showSerials,
        show_signoff: showSignoff,
        priority_color_map: colorMap,
      });
      toast({ title: "Saved", description: "Traveler template updated." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message ?? String(e), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Printer className="h-5 w-5" /> Work Order Traveler Template</CardTitle>
        <CardDescription>
          Configure the printable traveler used to release work orders to the shop floor.
          Logo and defaults are reused for every print.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-40 items-center justify-center rounded border bg-muted/30">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo</span>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                hidden
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload logo
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or SVG. Reused on every traveler.</p>
            </div>
          </div>
        </div>

        {/* Text + paper */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Company Name Line</Label>
            <Input value={companyLine} onChange={(e) => setCompanyLine(e.target.value)} placeholder={organization?.name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label>Paper Size</Label>
            <Select value={paper} onValueChange={(v) => setPaper(v as PaperSize)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="letter">Letter (8.5" × 11")</SelectItem>
                <SelectItem value="a4">A4 (210mm × 297mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Footer Text</Label>
            <Textarea
              rows={2}
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="e.g. AS9100D · Controlled Document · Do not duplicate"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-3 gap-3 rounded-md border p-3">
          <Toggle label="Routing Table"    value={showRouting} onChange={setShowRouting} />
          <Toggle label="Serial Numbers"   value={showSerials} onChange={setShowSerials} />
          <Toggle label="ISO 9001 Sign-Off" value={showSignoff} onChange={setShowSignoff} />
        </div>

        {/* Priority -> color */}
        <div className="space-y-2">
          <Label>Priority → Paper Color</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {PRIORITIES.map((p) => (
              <div key={p} className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{p}</div>
                <Select
                  value={(colorMap[p] as PriorityColor) ?? "white"}
                  onValueChange={(v) => setColorMap({ ...colorMap, [p]: v as PriorityColor })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLORS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  );
}
