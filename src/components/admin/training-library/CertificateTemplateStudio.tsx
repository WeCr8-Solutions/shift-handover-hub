import { useState, useRef } from "react";
import { useCertificateTemplates, useCertTemplateMutations, templateAssetUrl, type CertificateTemplate } from "@/hooks/useCertificateTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateTemplate as CertPreview } from "@/components/certificates/CertificateTemplate";
import type { CertificateRecord, CertificateProgram } from "@/lib/certificates";
import { Plus, Upload, CheckCircle2, Trash2, Save, Award, Image as ImageIcon } from "lucide-react";

interface Props { isPlatformAdmin: boolean }

const SAMPLE_CERT: CertificateRecord = {
  certId: "OAP-SAMPLE-2026",
  qrToken: "preview",
  program: "OAP",
  programName: "OAP Machining – Floor Certification",
  recipientName: "Jane Q. Operator",
  recipientUsername: "janeop",
  recipientEmail: null,
  organizationName: "Sample Mfg. Co.",
  status: "active",
  validFrom: new Date().toISOString(),
  validUntil: null,
  issuedAt: new Date().toISOString(),
  pdfUrl: null,
  signedByName: "Mentor Smith",
  signedByTitle: "Designated OAP Mentor",
  signedBySignatureUrl: null,
  items: [
    { type: "machine", label: "Haas VF-2 Vertical Mill" },
    { type: "course", label: "OAP Section 1 — Safety" },
    { type: "machining_operation", label: "Drilling & Tapping" },
    { type: "safety_credential", label: "Lockout/Tagout Awareness" },
  ],
};

export function CertificateTemplateStudio({ isPlatformAdmin }: Props) {
  const { data: templates = [], isLoading } = useCertificateTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const m = useCertTemplateMutations();

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const handleNew = (program: CertificateProgram, variant: "diploma" | "digital") => {
    m.upsert.mutateAsync({
      program, variant, name: `New ${program} ${variant} template`,
      is_canonical: true, is_active: false, organization_id: null,
    } as any).then((row: any) => setSelectedId(row.id));
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4" /> Certificate Template Studio</CardTitle>
            {isPlatformAdmin && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => handleNew("OAP", "diploma")}>
                  <Plus className="w-3 h-3" /> OAP Diploma
                </Button>
                <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => handleNew("GCA", "diploma")}>
                  <Plus className="w-3 h-3" /> GCA Diploma
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Visual layout is fixed by code for print fidelity. Upload your own seal, signature, watermark and tweak colors / labels here.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Templates ({templates.length})</CardTitle></CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-auto">
            {isLoading && <div className="p-3 text-xs text-muted-foreground">Loading...</div>}
            {templates.length === 0 && !isLoading && (
              <div className="p-4 text-xs text-muted-foreground text-center">
                No custom templates yet. The built-in defaults are shown to recipients until you create one.
              </div>
            )}
            {templates.map((t) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-3 py-2 border-b hover:bg-muted/50 ${selectedId === t.id ? "bg-muted" : ""}`}>
                <div className="text-sm font-medium truncate">{t.name}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] h-4">{t.program}</Badge>
                  <Badge variant="secondary" className="text-[10px] h-4">{t.variant}</Badge>
                  {t.is_active && <Badge className="text-[10px] h-4 bg-green-600">active</Badge>}
                  {t.is_canonical && <Badge variant="outline" className="text-[10px] h-4">canonical</Badge>}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          {!selected ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select a template or create one</CardContent></Card>
          ) : (
            <TemplateEditor template={selected} m={m} readOnly={!isPlatformAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({
  template, m, readOnly,
}: {
  template: CertificateTemplate;
  m: ReturnType<typeof useCertTemplateMutations>;
  readOnly: boolean;
}) {
  const [draft, setDraft] = useState<CertificateTemplate>(template);
  const sealRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);
  const wmRef = useRef<HTMLInputElement>(null);

  if (draft.id !== template.id) { setDraft(template); return null; }

  const handleUpload = async (kind: "seal" | "watermark" | "signature", file: File | undefined) => {
    if (!file) return;
    const path = await m.uploadAsset.mutateAsync({
      file, kind,
      scope: template.is_canonical ? { canonical: true } : { organizationId: template.organization_id! },
    });
    const field =
      kind === "seal" ? "seal_logo_path"
      : kind === "watermark" ? "background_watermark_path"
      : "signature_default_path";
    setDraft({ ...draft, [field]: path });
  };

  const previewCert: CertificateRecord = {
    ...SAMPLE_CERT,
    program: draft.program,
    signedBySignatureUrl: templateAssetUrl(draft.signature_default_path),
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base truncate">{draft.name}</CardTitle>
        {!readOnly && (
          <div className="flex gap-2">
            {!draft.is_active && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => m.setActive.mutate({
                id: draft.id, program: draft.program, variant: draft.variant, organizationId: draft.organization_id,
              })}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Set Active
              </Button>
            )}
            <Button size="sm" onClick={() => m.upsert.mutate(draft)} disabled={m.upsert.isPending} className="gap-1">
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => m.remove.mutate(draft.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} disabled={readOnly} className="h-8" /></div>
              <div>
                <Label className="text-xs">Variant</Label>
                <Select value={draft.variant} onValueChange={(v) => setDraft({ ...draft, variant: v as any })} disabled={readOnly}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diploma">Diploma (print)</SelectItem>
                    <SelectItem value="digital">Digital (in-app)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Border style</Label>
                <Select value={draft.border_style ?? "ornate"} onValueChange={(v) => setDraft({ ...draft, border_style: v as any })} disabled={readOnly}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ornate">Ornate</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Accent color (hex)</Label>
                <div className="flex gap-2">
                  <Input type="color" value={draft.accent_color_hex ?? "#0F172A"} onChange={(e) => setDraft({ ...draft, accent_color_hex: e.target.value })} disabled={readOnly} className="h-8 w-14 p-1" />
                  <Input value={draft.accent_color_hex ?? ""} onChange={(e) => setDraft({ ...draft, accent_color_hex: e.target.value })} disabled={readOnly} className="h-8" placeholder="#0F172A" />
                </div>
              </div>
              <div><Label className="text-xs">Font (serif)</Label><Input value={draft.font_family_serif ?? ""} placeholder="Playfair Display, Georgia, serif" onChange={(e) => setDraft({ ...draft, font_family_serif: e.target.value })} disabled={readOnly} className="h-8" /></div>
              <div><Label className="text-xs">Font (sans)</Label><Input value={draft.font_family_sans ?? ""} placeholder="Inter, sans-serif" onChange={(e) => setDraft({ ...draft, font_family_sans: e.target.value })} disabled={readOnly} className="h-8" /></div>
            </div>
            <div><Label className="text-xs">Header text</Label><Input value={draft.header_text ?? ""} onChange={(e) => setDraft({ ...draft, header_text: e.target.value })} disabled={readOnly} className="h-8" /></div>
            <div><Label className="text-xs">Footer text</Label><Input value={draft.footer_text ?? ""} onChange={(e) => setDraft({ ...draft, footer_text: e.target.value })} disabled={readOnly} className="h-8" /></div>
          </TabsContent>

          <TabsContent value="assets" className="mt-3 space-y-3">
            <AssetSlot label="Seal / Logo" path={draft.seal_logo_path} inputRef={sealRef} onUpload={(f) => handleUpload("seal", f)} readOnly={readOnly} />
            <AssetSlot label="Default Signature" path={draft.signature_default_path} inputRef={sigRef} onUpload={(f) => handleUpload("signature", f)} readOnly={readOnly} />
            <AssetSlot label="Background Watermark" path={draft.background_watermark_path} inputRef={wmRef} onUpload={(f) => handleUpload("watermark", f)} readOnly={readOnly} />
            <p className="text-[11px] text-muted-foreground">PNG / SVG / WebP up to 2 MB. Click Save after uploading to persist the new path.</p>
          </TabsContent>

          <TabsContent value="preview" className="mt-3">
            <div className="overflow-auto border rounded-lg p-4 bg-muted/20" style={{ maxHeight: 600 }}>
              <div style={{ transform: "scale(0.55)", transformOrigin: "top left", width: "8.5in" }}>
                <CertPreview cert={previewCert} variant={draft.variant} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AssetSlot({
  label, path, inputRef, onUpload, readOnly,
}: {
  label: string; path: string | null; inputRef: React.RefObject<HTMLInputElement>;
  onUpload: (f: File | undefined) => void; readOnly: boolean;
}) {
  const url = templateAssetUrl(path);
  return (
    <div className="flex items-center gap-3 p-3 border rounded-md">
      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
        {url ? <img src={url} alt={label} className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground font-mono truncate">{path ?? "—"}</div>
      </div>
      {!readOnly && (
        <>
          <input ref={inputRef} type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" hidden
            onChange={(e) => onUpload(e.target.files?.[0])} />
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} className="gap-1">
            <Upload className="w-3.5 h-3.5" /> Upload
          </Button>
        </>
      )}
    </div>
  );
}
