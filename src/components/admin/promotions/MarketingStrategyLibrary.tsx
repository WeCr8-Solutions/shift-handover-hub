import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Eye, Pencil, RotateCcw } from "lucide-react";

// Vite raw glob — eagerly inline the entire marketing strategy library so the
// admin can review/edit without a backend round-trip. SPA constraint: edits are
// local-only (textarea + download .md). The repo file is the source of truth.
const RAW_DOCS = import.meta.glob("/docs/marketing/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

interface DocEntry {
  path: string;
  filename: string;
  title: string;
  original: string;
}

function deriveTitle(filename: string, body: string): string {
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return filename.replace(/\.md$/, "").replace(/^\d+-/, "").replace(/-/g, " ");
}

const STORAGE_PREFIX = "promo:strategy-draft:";

export function MarketingStrategyLibrary() {
  const docs = useMemo<DocEntry[]>(() => {
    return Object.entries(RAW_DOCS)
      .map(([path, content]) => {
        const filename = path.split("/").pop() ?? path;
        return { path, filename, title: deriveTitle(filename, content), original: content };
      })
      .sort((a, b) => a.filename.localeCompare(b.filename));
  }, []);

  const [selectedPath, setSelectedPath] = useState<string>(docs[0]?.path ?? "");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draftMap, setDraftMap] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    const seed: Record<string, string> = {};
    for (const doc of docs) {
      const stored = window.localStorage.getItem(STORAGE_PREFIX + doc.filename);
      if (stored !== null) seed[doc.path] = stored;
    }
    return seed;
  });

  const selected = docs.find((d) => d.path === selectedPath) ?? docs[0];
  if (!selected) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No marketing strategy docs found under <code>docs/marketing/</code>.
        </CardContent>
      </Card>
    );
  }

  const draft = draftMap[selected.path];
  const body = draft ?? selected.original;
  const isDirty = draft !== undefined && draft !== selected.original;

  function updateDraft(value: string) {
    setDraftMap((prev) => ({ ...prev, [selected.path]: value }));
    try {
      window.localStorage.setItem(STORAGE_PREFIX + selected.filename, value);
    } catch {
      /* quota */
    }
  }

  function resetDraft() {
    setDraftMap((prev) => {
      const next = { ...prev };
      delete next[selected.path];
      return next;
    });
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + selected.filename);
    } catch {
      /* noop */
    }
    toast.success("Reverted to repo version.");
  }

  function copyAll() {
    void navigator.clipboard.writeText(body);
    toast.success("Markdown copied.");
  }

  function downloadMd() {
    const blob = new Blob([body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selected.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Strategy Library</CardTitle>
          <CardDescription>
            Read and edit the marketing strategy docs that ship in <code>docs/marketing/</code>.
            Edits are saved to your browser only — download the <code>.md</code> and commit it to
            the repo to ship changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedPath} onValueChange={(v) => { setSelectedPath(v); setMode("view"); }}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {docs.map((d) => (
                  <SelectItem key={d.path} value={d.path}>
                    {d.filename} — {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isDirty && <Badge variant="secondary">Local edits</Badge>}
            <div className="ml-auto flex gap-2 flex-wrap">
              <Button size="sm" variant={mode === "view" ? "default" : "outline"} onClick={() => setMode("view")}>
                <Eye className="w-3.5 h-3.5 mr-1" /> Read
              </Button>
              <Button size="sm" variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}>
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={copyAll}>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={downloadMd}>
                <Download className="w-3.5 h-3.5 mr-1" /> Download .md
              </Button>
              {isDirty && (
                <Button size="sm" variant="ghost" onClick={resetDraft}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Revert
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {mode === "edit" ? (
            <Textarea
              value={body}
              onChange={(e) => updateDraft(e.target.value)}
              className="font-mono text-xs min-h-[60vh]"
              spellCheck={false}
            />
          ) : (
            <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-20">
              <ReactMarkdown>{body}</ReactMarkdown>
            </article>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
