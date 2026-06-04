import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileCheck2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface ImportResult {
  inserted: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

const IMPORT_MODULES = new Set(["equipment", "stations", "users_roles", "routing"]);

export function UploadUtility({
  engagementId,
  organizationId,
  moduleKey,
  templateColumns,
}: {
  engagementId: string;
  organizationId: string;
  moduleKey: string;
  templateColumns: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ path: string; result: ImportResult } | null>(null);
  const [committing, setCommitting] = useState(false);

  const canImport = IMPORT_MODULES.has(moduleKey);

  const downloadTemplate = () => {
    const csv = templateColumns.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${moduleKey}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `${organizationId}/${engagementId}/${moduleKey}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("onboarding-documents").upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;
      setLastFile(file.name);
      toast.success(`Uploaded ${file.name}`);

      if (canImport && /\.csv$/i.test(file.name)) {
        const { data, error: fnErr } = await supabase.functions.invoke("onboarding-bulk-import", {
          body: { engagement_id: engagementId, module_key: moduleKey, storage_path: path, dry_run: true },
        });
        if (fnErr) throw fnErr;
        setPreview({ path, result: data as ImportResult });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const commitImport = async () => {
    if (!preview) return;
    setCommitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("onboarding-bulk-import", {
        body: { engagement_id: engagementId, module_key: moduleKey, storage_path: preview.path, dry_run: false },
      });
      if (error) throw error;
      const res = data as ImportResult;
      toast.success(`Imported ${res.inserted} row${res.inserted === 1 ? "" : "s"}`);
      setPreview(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Bulk upload
            {canImport && <Badge variant="secondary" className="text-[10px]">CSV auto-import</Badge>}
          </CardTitle>
          <CardDescription className="text-xs">
            Download the template, fill in customer data, and upload here. CSV files are previewed before any rows are written.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <Download className="w-4 h-4" /> Download CSV template
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json,.pdf,.png,.jpg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Upload file"}
          </Button>
          {lastFile && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <FileCheck2 className="w-3 h-3 text-status-ok" /> Last: {lastFile}
            </span>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import preview — {moduleKey}</DialogTitle>
            <DialogDescription>
              Dry-run validation results. Nothing has been written yet.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border p-3">
                  <div className="text-2xl font-semibold text-status-ok">{preview.result.inserted}</div>
                  <div className="text-xs text-muted-foreground">Rows ready to import</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-2xl font-semibold text-destructive">{preview.result.skipped}</div>
                  <div className="text-xs text-muted-foreground">Rows skipped</div>
                </div>
              </div>
              {preview.result.errors.length > 0 && (
                <div className="rounded border border-destructive/40 p-3 max-h-48 overflow-auto space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5" /> {preview.result.errors.length} error(s)
                  </div>
                  <ul className="text-xs space-y-0.5">
                    {preview.result.errors.slice(0, 20).map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)} disabled={committing}>Discard</Button>
            <Button
              onClick={commitImport}
              disabled={committing || !preview || preview.result.inserted === 0}
              className="gap-2"
            >
              {committing && <Loader2 className="w-4 h-4 animate-spin" />}
              Commit import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
