import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Bulk upload</CardTitle>
        <CardDescription className="text-xs">
          Download the template, fill in customer data, and upload here. Files are stored privately under the org.
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
          <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload file"}
        </Button>
        {lastFile && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <FileCheck2 className="w-3 h-3 text-status-ok" /> Last: {lastFile}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
