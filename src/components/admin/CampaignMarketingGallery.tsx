import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Upload, Image as ImageIcon, FileSpreadsheet, FileText, Trash2,
  ExternalLink, Pencil, Download, Package, CreditCard, UserSquare,
} from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  useCampaignMarketingAssets,
  type CampaignAssetKind,
  type CampaignMarketingAsset,
} from "@/hooks/useCampaignMarketingAssets";
import { FLYER_ZONES } from "./flyerZoneData";

interface Props {
  campaignId: string | null;
}

const KIND_LABEL: Record<CampaignAssetKind, string> = {
  flyer_image: "Flyer image",
  mailing_list_xlsx: "Mailing list (XLSX)",
  document: "Document",
  business_card: "Business card",
  talent_material: "Talent material",
  other: "Other",
};

const KIND_ICON: Record<CampaignAssetKind, typeof ImageIcon> = {
  flyer_image: ImageIcon,
  mailing_list_xlsx: FileSpreadsheet,
  document: FileText,
  business_card: CreditCard,
  talent_material: UserSquare,
  other: FileText,
};

function inferKindFromFile(f: File): CampaignAssetKind {
  if (f.type.startsWith("image/")) return "flyer_image";
  if (/sheet|excel|csv/i.test(f.type) || /\.(xlsx|xls|csv)$/i.test(f.name)) return "mailing_list_xlsx";
  if (/pdf|word|document/i.test(f.type) || /\.(pdf|docx?)$/i.test(f.name)) return "document";
  return "other";
}

function formatBytes(n: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function AssetThumb({
  asset,
  signedUrl,
}: { asset: CampaignMarketingAsset; signedUrl: (p: string) => Promise<string | null> }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (asset.kind === "flyer_image") signedUrl(asset.storage_path).then(setUrl);
  }, [asset, signedUrl]);
  const Icon = KIND_ICON[asset.kind];
  if (asset.kind === "flyer_image" && url) {
    return (
      <img
        src={url}
        alt={asset.title}
        className="w-full aspect-square object-cover rounded-md bg-muted"
        loading="lazy"
      />
    );
  }
  return (
    <div className="w-full aspect-square rounded-md bg-muted flex items-center justify-center">
      <Icon className="w-10 h-10 text-muted-foreground" />
    </div>
  );
}

export function CampaignMarketingGallery({ campaignId }: Props) {
  const { assets, loading, uploadAsset, updateAsset, deleteAsset, signedUrl } =
    useCampaignMarketingAssets(campaignId);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<CampaignAssetKind>("flyer_image");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [usedOn, setUsedOn] = useState<string>(new Date().toISOString().slice(0, 10));
  const [zoneNumber, setZoneNumber] = useState<string>("");
  const [utmContent, setUtmContent] = useState<string>("");
  const [utmTargetUrl, setUtmTargetUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<CampaignMarketingAsset | null>(null);
  const [kindFilter, setKindFilter] = useState<CampaignAssetKind | "all">("all");

  const resetForm = useCallback(() => {
    setFile(null);
    setKind("flyer_image");
    setTitle("");
    setNotes("");
    setUsedOn(new Date().toISOString().slice(0, 10));
    setZoneNumber("");
    setUtmContent("");
    setUtmTargetUrl("");
  }, []);

  function onFileChosen(f: File | null) {
    setFile(f);
    if (f) {
      setKind(inferKindFromFile(f));
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  }

  function onZoneChange(val: string) {
    setZoneNumber(val);
    const n = parseInt(val, 10);
    const z = FLYER_ZONES.find(fz => fz.zoneNumber === n);
    if (z) {
      setUtmContent(z.utmContent);
      setUtmTargetUrl(z.fullUtmUrl);
    }
  }

  async function submitUpload() {
    if (!file || !title.trim()) {
      toast.error("Pick a file and enter a title.");
      return;
    }
    setSaving(true);
    try {
      await uploadAsset({
        file,
        filename: file.name,
        kind,
        title: title.trim(),
        notes: notes.trim() || undefined,
        usedOn: usedOn || null,
        zoneNumber: zoneNumber ? parseInt(zoneNumber, 10) : null,
        utmContent: utmContent.trim() || null,
        utmTargetUrl: utmTargetUrl.trim() || null,
      });
      toast.success("Marketing asset uploaded.");
      setUploadOpen(false);
      resetForm();
    } catch (e) {
      toast.error("Upload failed: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function openAsset(a: CampaignMarketingAsset) {
    const url = await signedUrl(a.storage_path, 60 * 10);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await updateAsset(editing.id, {
        title: editing.title,
        notes: editing.notes,
        used_on: editing.used_on,
        zone_number: editing.zone_number,
        utm_content: editing.utm_content,
        utm_target_url: editing.utm_target_url,
      });
      toast.success("Updated.");
      setEditing(null);
    } catch (e) {
      toast.error("Update failed: " + (e as Error).message);
    }
  }

  async function confirmDelete(a: CampaignMarketingAsset) {
    if (!confirm(`Delete "${a.title}"? This removes the file and metadata.`)) return;
    try {
      await deleteAsset(a);
      toast.success("Deleted.");
    } catch (e) {
      toast.error("Delete failed: " + (e as Error).message);
    }
  }

  const filtered = kindFilter === "all" ? assets : assets.filter(a => a.kind === kindFilter);
  const [exporting, setExporting] = useState(false);

  async function downloadZipPackage() {
    if (filtered.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    setExporting(true);
    const t = toast.loading(`Packaging ${filtered.length} asset(s)…`);
    try {
      const zip = new JSZip();
      const folders: Record<CampaignAssetKind, string> = {
        flyer_image: "flyers",
        mailing_list_xlsx: "mailing-lists",
        document: "documents",
        business_card: "business-cards",
        talent_material: "talent-materials",
        other: "other",
      };
      const manifest: string[] = [
        "title,kind,used_on,zone_number,utm_content,utm_target_url,filename,bytes,notes",
      ];
      const csvEscape = (v: unknown) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };

      for (const a of filtered) {
        const url = await signedUrl(a.storage_path, 60 * 15);
        if (!url) continue;
        const res = await fetch(url);
        if (!res.ok) continue;
        const blob = await res.blob();
        const baseName = a.storage_path.split("/").pop() ?? `${a.id}`;
        const safeTitle = a.title.replace(/[^\w.\-]+/g, "_").slice(0, 60);
        const filename = `${safeTitle || a.id}__${baseName}`;
        zip.folder(folders[a.kind])!.file(filename, blob);
        manifest.push([
          a.title, a.kind, a.used_on ?? "", a.zone_number ?? "",
          a.utm_content ?? "", a.utm_target_url ?? "",
          `${folders[a.kind]}/${filename}`, a.byte_size ?? "", a.notes ?? "",
        ].map(csvEscape).join(","));
      }
      zip.file("manifest.csv", manifest.join("\n"));
      zip.file("README.txt",
        `Campaign marketing package\nGenerated: ${new Date().toISOString()}\nAssets: ${filtered.length}\nFilter: ${kindFilter}\n\nFolders:\n- flyers/         Flyer images\n- mailing-lists/  Vista Print XLSX mailing lists\n- documents/      Supporting docs (PDF, DOCX, etc.)\n- other/          Misc assets\n\nSee manifest.csv for full metadata including UTM tagging and zone numbers.\n`,
      );
      const out = await zip.generateAsync({ type: "blob" });
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `campaign_package_${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success(`Downloaded ${filtered.length} asset(s).`, { id: t });
    } catch (e) {
      toast.error("Export failed: " + (e as Error).message, { id: t });
    } finally {
      setExporting(false);
    }
  }


  if (!campaignId) {
    return <p className="text-sm text-muted-foreground p-4">No campaign selected.</p>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Marketing Materials Gallery</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Flyer images, mailing-list XLSX exports, and supporting docs linked to this campaign — with UTM/zone tagging.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={kindFilter} onValueChange={v => setKindFilter(v as CampaignAssetKind | "all")}>
              <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({assets.length})</SelectItem>
                <SelectItem value="flyer_image">Flyer images</SelectItem>
                <SelectItem value="mailing_list_xlsx">Mailing lists</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm" variant="outline"
              onClick={downloadZipPackage}
              disabled={exporting || filtered.length === 0}
              className="gap-1.5"
              title="Download all visible assets + manifest.csv as a ZIP"
            >
              <Package className="w-3.5 h-3.5" />
              {exporting ? "Packaging…" : `ZIP (${filtered.length})`}
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Upload
            </Button>

          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            No marketing materials yet. Upload flyer images, mailing-list XLSX files, or supporting docs.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(a => {
              const Icon = KIND_ICON[a.kind];
              return (
                <Card key={a.id} className="overflow-hidden">
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => openAsset(a)}
                  >
                    <AssetThumb asset={a} signedUrl={signedUrl} />
                  </button>
                  <div className="p-2 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-medium leading-tight line-clamp-2 flex-1">{a.title}</p>
                      <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                        <Icon className="w-3 h-3" /> {KIND_LABEL[a.kind].split(" ")[0]}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1.5">
                      {a.used_on && <span>{a.used_on}</span>}
                      {a.zone_number != null && <span>Zone {a.zone_number}</span>}
                      {a.utm_content && <span className="font-mono">{a.utm_content}</span>}
                    </div>
                    <div className="flex gap-1 pt-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openAsset(a)} title="Open">
                        <Download className="w-3 h-3" />
                      </Button>
                      {a.utm_target_url && (
                        <Button
                          size="icon" variant="ghost" className="h-6 w-6"
                          onClick={() => window.open(a.utm_target_url!, "_blank", "noopener,noreferrer")}
                          title="Open UTM URL"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(a)} title="Edit">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => confirmDelete(a)} title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(a.byte_size)}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={o => { setUploadOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Upload marketing material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">File</Label>
              <Input type="file" onChange={e => onFileChosen(e.target.files?.[0] ?? null)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kind</Label>
                <Select value={kind} onValueChange={v => setKind(v as CampaignAssetKind)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND_LABEL) as CampaignAssetKind[]).map(k => (
                      <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Used on</Label>
                <Input type="date" value={usedOn} onChange={e => setUsedOn(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Santee CNC drop — front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Zone (auto-fills UTM)</Label>
                <Select value={zoneNumber} onValueChange={onZoneChange}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    {FLYER_ZONES.map(z => (
                      <SelectItem key={z.zoneNumber} value={String(z.zoneNumber)}>
                        {String(z.zoneNumber).padStart(2, "0")} — {z.zoneName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">UTM content</Label>
                <Input value={utmContent} onChange={e => setUtmContent(e.target.value)} placeholder="z01_santee_wheatlands" />
              </div>
            </div>
            <div>
              <Label className="text-xs">UTM target URL</Label>
              <Input value={utmTargetUrl} onChange={e => setUtmTargetUrl(e.target.value)} placeholder="https://jobline.ai/start?utm_..." />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Print run, vendor, batch, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={submitUpload} disabled={saving}>
              {saving ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit asset</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Used on</Label>
                  <Input type="date" value={editing.used_on ?? ""} onChange={e => setEditing({ ...editing, used_on: e.target.value || null })} />
                </div>
                <div>
                  <Label className="text-xs">Zone #</Label>
                  <Input
                    type="number" min={1} max={22}
                    value={editing.zone_number ?? ""}
                    onChange={e => setEditing({ ...editing, zone_number: e.target.value ? parseInt(e.target.value, 10) : null })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">UTM content</Label>
                <Input value={editing.utm_content ?? ""} onChange={e => setEditing({ ...editing, utm_content: e.target.value || null })} />
              </div>
              <div>
                <Label className="text-xs">UTM target URL</Label>
                <Input value={editing.utm_target_url ?? ""} onChange={e => setEditing({ ...editing, utm_target_url: e.target.value || null })} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea rows={2} value={editing.notes ?? ""} onChange={e => setEditing({ ...editing, notes: e.target.value || null })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
