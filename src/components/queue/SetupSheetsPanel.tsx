import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SetupSheet, useSetupSheets } from "@/hooks/useSetupSheets";
import { groupSetupSheetsForPackageView } from "@/lib/setupSheetPackages";
import {
  FileText,
  Upload,
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Loader2,
  X,
} from "lucide-react";

const SHEET_TYPES = [
  { value: "setup_sheet", label: "Setup Sheet" },
  { value: "instruction_set", label: "Instruction Set" },
  { value: "inspection_plan", label: "Inspection Plan" },
  { value: "drawing", label: "Drawing / Blueprint" },
  { value: "other", label: "Other" },
];

interface SetupSheetsPanelProps {
  routingStepId: string;
  queueItemId: string;
  organizationId: string;
  sheets: SetupSheet[];
  loading: boolean;
  canEdit: boolean;
  onAdd: ReturnType<typeof useSetupSheets>["addSheet"];
  onDelete: ReturnType<typeof useSetupSheets>["deleteSheet"];
  onUploadFile: ReturnType<typeof useSetupSheets>["uploadFile"];
  onGetSignedUrl: ReturnType<typeof useSetupSheets>["getSignedUrl"];
}

export function SetupSheetsPanel({
  routingStepId,
  queueItemId,
  organizationId,
  sheets,
  loading,
  canEdit,
  onAdd,
  onDelete,
  onUploadFile,
  onGetSignedUrl,
}: SetupSheetsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewTitle, setViewTitle] = useState("");
  const [loadingView, setLoadingView] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [sheetType, setSheetType] = useState("setup_sheet");
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [revision, setRevision] = useState("A");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = () => {
    setTitle("");
    setSheetType("setup_sheet");
    setDescription("");
    setExternalLink("");
    setRevision("A");
    setSelectedFile(null);
    setAdding(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (selectedFile && user) {
      const result = await onUploadFile(selectedFile, organizationId, user.id);
      if (result.error) {
        toast({ title: "Upload failed", description: result.error, variant: "destructive" });
        setSaving(false);
        return;
      }
      fileUrl = result.path || undefined;
      fileName = selectedFile.name;
    }

    const result = await onAdd({
      routing_step_id: routingStepId,
      queue_item_id: queueItemId,
      organization_id: organizationId,
      title: title.trim(),
      sheet_type: sheetType,
      description: description.trim() || undefined,
      external_link: externalLink.trim() || undefined,
      revision: revision.trim() || undefined,
      file_url: fileUrl,
      file_name: fileName,
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Setup sheet added" });
      resetForm();
    }
    setSaving(false);
  };

  const handleView = async (sheet: SetupSheet) => {
    if (sheet.external_link) {
      window.open(sheet.external_link, "_blank", "noopener");
      return;
    }
    if (!sheet.file_url) return;
    setLoadingView(true);
    setViewTitle(sheet.title);
    const url = await onGetSignedUrl(sheet.file_url);
    if (url) {
      setViewUrl(url);
    } else {
      toast({ title: "Could not load file", variant: "destructive" });
    }
    setLoadingView(false);
  };

  const handleDelete = async (sheet: SetupSheet) => {
    const result = await onDelete(sheet.id, routingStepId);
    if (result.error) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Removed" });
    }
  };

  const typeLabel = (type: string) =>
    SHEET_TYPES.find((t) => t.value === type)?.label || type;

  const groupedSheets = groupSetupSheetsForPackageView(sheets);

  if (loading) return <Skeleton className="h-12 w-full" />;

  return (
    <div className="space-y-2">
      {/* Sheet list */}
      {groupedSheets.length > 0 && (
        <div className="space-y-2">
          {groupedSheets.map((group) => (
            <div key={group.key} className="rounded-md border bg-muted/20">
              <div className="flex items-center justify-between gap-2 border-b px-2 py-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                    {typeLabel(group.sheetType)}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {group.revision ? `Rev ${group.revision}` : "Unversioned"}
                  </Badge>
                </div>
                <span className="text-muted-foreground">
                  {group.count} document{group.count === 1 ? "" : "s"}
                </span>
              </div>

              <div className="space-y-1 p-1.5">
                {group.items.map((sheet) => (
                  <div
                    key={sheet.id}
                    className="flex items-center gap-2 rounded-md border bg-card p-2 text-card-foreground text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium truncate">{sheet.title}</span>
                      </div>
                      {sheet.description && (
                        <p className="text-muted-foreground truncate mt-0.5">{sheet.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(sheet.file_url || sheet.external_link) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleView(sheet)}
                          disabled={loadingView}
                        >
                          {sheet.external_link ? (
                            <ExternalLink className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(sheet)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {sheets.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground text-center py-1">
          No setup sheets for this operation.
        </p>
      )}

      {/* Add form */}
      {adding ? (
        <div className="border rounded-md p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fixture Setup Instructions"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={sheetType} onValueChange={setSheetType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHEET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Revision</Label>
              <Input
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="A"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes..."
              className="text-xs min-h-[48px]"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-xs">External Link (optional)</Label>
            <div className="flex items-center gap-1">
              <Link2 className="w-3 h-3 text-muted-foreground" />
              <Input
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Upload File (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-8"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-3 h-3" />
                {selectedFile ? selectedFile.name : "Choose file"}
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.svg,.dxf,.dwg,.step,.stp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-7 gap-1"
              disabled={saving || !title.trim()}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Save
            </Button>
          </div>
        </div>
      ) : (
        canEdit && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 text-xs w-full"
            onClick={() => setAdding(true)}
          >
            <Plus className="w-3 h-3" /> Add Setup Sheet / Instructions
          </Button>
        )
      )}

      {/* Viewing dialog */}
      <Dialog open={!!viewUrl} onOpenChange={() => setViewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-sm">{viewTitle}</DialogTitle>
          </DialogHeader>
          {viewUrl && (
            <iframe
              src={viewUrl}
              title={viewTitle}
              className="w-full h-[70vh] rounded-md border"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
