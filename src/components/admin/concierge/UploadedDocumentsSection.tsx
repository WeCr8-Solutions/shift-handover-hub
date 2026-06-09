import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Upload, Download, Trash2, FileUp, Pencil } from "lucide-react";
import { useConciergeUploads, type UploadedConciergeDoc, type UploadedDocCategory } from "@/hooks/useConciergeUploads";
import { UploadDocumentDialog } from "./UploadDocumentDialog";

interface Props {
  orgId: string | null;
  engagementId?: string | null;
  category: UploadedDocCategory;
  title: string;
  description: string;
  canEdit: boolean;
  defaultOpen?: boolean;
}

export function UploadedDocumentsSection({
  orgId, engagementId, category, title, description, canEdit, defaultOpen,
}: Props) {
  const { list, remove, getSignedUrl } = useConciergeUploads(orgId, category);
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [supersedes, setSupersedes] = useState<UploadedConciergeDoc | null>(null);

  const docs = list.data ?? [];

  async function handleOpen(doc: UploadedConciergeDoc) {
    const url = await getSignedUrl(doc);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            className="w-full text-left flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
            aria-expanded={open}
            aria-label={`Toggle ${title}`}
          >
            <div className="flex items-center gap-3">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
              <div>
                <div className="font-medium text-sm flex items-center gap-2">
                  {title}
                  <Badge variant="secondary" className="text-[10px]">{docs.length}</Badge>
                  {!orgId && <Badge variant="outline" className="text-[10px]">Open from an engagement</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            </div>
            {canEdit && orgId && (
              <span
                role="button"
                tabIndex={0}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border bg-background px-3 text-xs hover:bg-accent"
                onClick={(e) => { e.stopPropagation(); setSupersedes(null); setUploadOpen(true); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    setSupersedes(null);
                    setUploadOpen(true);
                  }
                }}
              >
                <Upload className="w-3.5 h-3.5" /> Upload
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            {list.isLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
            {!list.isLoading && docs.length === 0 && (
              <div className="border border-dashed rounded-md p-6 text-center text-xs text-muted-foreground">
                <FileUp className="w-5 h-5 mx-auto mb-2 opacity-60" />
                No {title.toLowerCase()} uploaded yet.
                {canEdit && orgId && <> Click <span className="font-medium">Upload</span> above to add one.</>}
              </div>
            )}
            <div className="grid gap-2 md:grid-cols-2">
              {docs.map((doc) => (
                <div key={doc.id} className="border rounded-md p-3 text-xs space-y-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{doc.title}</div>
                      {doc.description && (
                        <div className="text-muted-foreground line-clamp-2 mt-0.5">{doc.description}</div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">v{doc.version}</Badge>
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[9px] font-normal">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">
                    {doc.file_size_bytes ? `${(doc.file_size_bytes / 1024).toFixed(0)} KB · ` : ""}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => handleOpen(doc)}>
                      <Download className="w-3 h-3" /> Open
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                          onClick={() => { setSupersedes(doc); setUploadOpen(true); }}
                        >
                          <Pencil className="w-3 h-3" /> Replace
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-destructive hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{doc.title}" will be permanently removed from storage and the org record.
                                This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove.mutate(doc)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={(o) => { setUploadOpen(o); if (!o) setSupersedes(null); }}
        orgId={orgId}
        engagementId={engagementId}
        defaultCategory={category}
        supersedes={supersedes}
      />
    </Card>
  );
}
