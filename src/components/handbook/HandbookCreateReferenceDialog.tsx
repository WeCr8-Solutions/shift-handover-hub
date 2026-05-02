import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHandbookCategories, type HandbookReference } from "@/hooks/useHandbook";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

interface Props {
  initialTitle?: string;
  /** Called once a stub reference exists. */
  onCreated: (ref: HandbookReference) => void;
  trigger?: React.ReactNode;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Quick "we don't have a handbook entry for this yet" stub creator.
 * Org admins/supervisors create non-canonical org-scoped rows; the body
 * defaults to a TODO so authors can fill it in later from /handbook/:slug.
 */
export function HandbookCreateReferenceDialog({ initialTitle = "", onCreated, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(slugify(initialTitle));
  const [categoryId, setCategoryId] = useState<string>("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useHandbookCategories();
  const { organizationId } = useOrganization();
  const qc = useQueryClient();

  // De-dupe categories by slug — DB has both canonical + org-cloned rows.
  const uniqueCategories = Array.from(
    new Map(categories.map((c) => [c.slug, c])).values()
  );

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim() || !categoryId) {
      toast.error("Title, slug, and category are required.");
      return;
    }
    if (!organizationId) {
      toast.error("No active organization — cannot create a reference here.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("handbook_references")
        .insert({
          title: title.trim(),
          slug: slug.trim(),
          category_id: categoryId,
          summary: summary.trim() || null,
          body_md: "_TODO: write reference body. This stub was created from an editor._",
          is_canonical: false,
          organization_id: organizationId,
          tags: [],
        })
        .select("*, category:handbook_categories(*)")
        .single();
      if (error) throw error;
      toast.success("Stub reference created");
      qc.invalidateQueries({ queryKey: ["handbook_references"] });
      onCreated(data as HandbookReference);
      setOpen(false);
      setTitle("");
      setSlug("");
      setSummary("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1 h-7">
            <Plus className="w-3 h-3" /> New reference stub
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create handbook stub</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug || slug === slugify(title)) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Surface finish Ra/Rz"
            />
          </div>
          <div>
            <Label className="text-xs">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
              <SelectContent>
                {uniqueCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Summary (optional)</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              placeholder="One-line description for search results."
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Body is left as a TODO; finish writing it from <code>/handbook/{slug || "your-slug"}</code> after creation.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={saving}>Create & link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
