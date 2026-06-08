import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, FileSpreadsheet, FileSignature, Eye, Download, Loader2, Package, Printer } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import {
  CONCIERGE_DOCUMENTS, renderDocument, downloadBlob, filenameFor,
  engagementContext, defaultContext,
  type ConciergeDocument, type DocumentAudience, type DocumentFormat,
} from "@/lib/concierge/documentRegistry";

interface Props {
  audience: DocumentAudience | "all";
  engagement?: any | null;
  title?: string;
  description?: string;
}

const KIND_LABEL: Record<string, string> = {
  contract: "Contracts",
  worksheet: "Intake Worksheets",
  sop: "Staff SOPs",
  reference: "Reference",
};

const KIND_ICON: Record<string, any> = {
  contract: FileSignature,
  worksheet: FileSpreadsheet,
  sop: FileText,
  reference: FileText,
};

export function DocumentLibrary({ audience, engagement, title, description }: Props) {
  const ctx = useMemo(() => engagement ? engagementContext(engagement) : defaultContext(), [engagement]);
  const [previewBlob, setPreviewBlob] = useState<{ url: string; title: string; filename: string; format: DocumentFormat } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [bundling, setBundling] = useState(false);

  const docs = useMemo(() => CONCIERGE_DOCUMENTS.filter((d) => {
    if (audience === "all") return true;
    return d.audience === audience || d.audience === "both";
  }), [audience]);

  const grouped = useMemo(() => {
    const out: Record<string, ConciergeDocument[]> = {};
    docs.forEach((d) => { (out[d.kind] ||= []).push(d); });
    return out;
  }, [docs]);

  function printBlobUrl(url: string) {
    const frame = document.createElement("iframe");
    frame.src = url;
    frame.title = "document-print-frame";
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);
    frame.onload = () => {
      window.setTimeout(() => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        window.setTimeout(() => frame.remove(), 1500);
      }, 250);
    };
  }

  async function handlePreview(doc: ConciergeDocument) {
    setBusy(`${doc.key}:preview`);
    try {
      const fmt: DocumentFormat = doc.formats.includes("pdf") ? "pdf" : doc.formats[0];
      const blob = await renderDocument(doc, fmt, ctx);
      const url = URL.createObjectURL(blob);
      setPreviewBlob({ url, title: doc.title, filename: filenameFor(doc, fmt, ctx), format: fmt });
    } catch (e: any) {
      toast.error(`Preview failed: ${e?.message ?? e}`);
    } finally {
      setBusy(null);
    }
  }

  async function handlePrintDoc(doc: ConciergeDocument) {
    setBusy(`${doc.key}:print`);
    try {
      const fmt: DocumentFormat = doc.formats.includes("pdf") ? "pdf" : doc.formats[0];
      const blob = await renderDocument(doc, fmt, ctx);
      const url = URL.createObjectURL(blob);
      printBlobUrl(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e: any) {
      toast.error(`Print failed: ${e?.message ?? e}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload(doc: ConciergeDocument, format: DocumentFormat) {
    setBusy(`${doc.key}:${format}`);
    try {
      const blob = await renderDocument(doc, format, ctx);
      downloadBlob(blob, filenameFor(doc, format, ctx));
      toast.success(`${doc.title} downloaded`);
    } catch (e: any) {
      toast.error(`Download failed: ${e?.message ?? e}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleBundle() {
    setBundling(true);
    try {
      const zip = new JSZip();
      for (const doc of docs) {
        const fmt: DocumentFormat = doc.kind === "worksheet" ? "xlsx" : "pdf";
        if (!doc.formats.includes(fmt)) continue;
        const blob = await renderDocument(doc, fmt, ctx);
        zip.file(filenameFor(doc, fmt, ctx), blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const safeCustomer = (ctx.customerName || "blank").replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
      downloadBlob(out, `jobline_concierge_pack_${safeCustomer}.zip`);
      toast.success("Concierge document pack downloaded");
    } catch (e: any) {
      toast.error(`Bundle failed: ${e?.message ?? e}`);
    } finally {
      setBundling(false);
    }
  }

  const kinds = Object.keys(grouped);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-4 h-4" /> {title ?? "Concierge Document Library"}
            </CardTitle>
            <CardDescription>
              {description ?? "Preview, download (PDF / DOCX / Excel), and review every onboarding artifact. Worksheets match the in-app intake fields exactly."}
            </CardDescription>
          </div>
          <Button onClick={handleBundle} disabled={bundling} className="gap-2">
            {bundling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download full pack (.zip)
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={kinds[0] ?? "contract"}>
          <TabsList className="flex flex-wrap h-auto justify-start">
            {kinds.map((k) => (
              <TabsTrigger key={k} value={k} className="gap-2">
                {KIND_LABEL[k] ?? k} <Badge variant="secondary">{grouped[k].length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {kinds.map((k) => {
            const Icon = KIND_ICON[k] ?? FileText;
            return (
              <TabsContent key={k} value={k} className="space-y-3 pt-3">
                <div className="grid gap-3 md:grid-cols-2">
                  {grouped[k].map((doc) => (
                    <Card key={doc.key} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Icon className="w-4 h-4" /> {doc.title}
                        </CardTitle>
                        <CardDescription className="text-xs">{doc.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          {doc.formats.map((f) => (
                            <Badge key={f} variant="outline" className="text-[10px] uppercase">{f}</Badge>
                          ))}
                          {doc.audience === "staff" && (
                            <Badge variant="outline" className="text-[10px] uppercase border-amber-500/40 text-amber-600">Internal</Badge>
                          )}
                          {doc.engagementAware && engagement && (
                            <Badge variant="outline" className="text-[10px] uppercase border-status-ok/40 text-status-ok">Filled</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                          <Button size="sm" variant="outline" className="gap-1.5"
                            onClick={() => handlePreview(doc)}
                            disabled={busy === `${doc.key}:preview`}>
                            {busy === `${doc.key}:preview` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                            Preview
                          </Button>
                          {doc.formats.map((f) => (
                            <Button key={f} size="sm" variant="secondary" className="gap-1.5"
                              onClick={() => handleDownload(doc, f)}
                              disabled={busy === `${doc.key}:${f}`}>
                              {busy === `${doc.key}:${f}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                              {f.toUpperCase()}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>

      <Dialog open={!!previewBlob} onOpenChange={(open) => {
        if (!open && previewBlob) { URL.revokeObjectURL(previewBlob.url); setPreviewBlob(null); }
      }}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>{previewBlob?.title} — preview</DialogTitle>
          </DialogHeader>
          {previewBlob && (
            <iframe title="document-preview" src={previewBlob.url} className="flex-1 w-full" />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
