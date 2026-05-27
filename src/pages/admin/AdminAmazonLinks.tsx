import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AMAZON_BOOKS,
  AFFILIATE_TAG,
  buildAmazonUrl,
  readLocalOverrides,
  writeLocalOverrides,
  clearLocalOverrides,
  type AmazonOverrideState,
} from "@/lib/amazonBooks";
import { toast } from "sonner";
import { Copy, ExternalLink, Lock, RotateCcw, Save, ShieldCheck } from "lucide-react";

/**
 * Admin: Amazon Links Manager
 * Gated to platform admins + developers (useAdminAccess.hasPlatformAccess).
 *
 * Lets a dev or admin:
 *   - Set a global affiliate tag preview (localStorage, current browser only)
 *   - Override individual book URLs for preview
 *   - See where every book is referenced (blog posts, resource pages)
 *   - Copy the resolved URL or a code snippet to commit the change to amazonBooks.ts
 */

function isValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// Amazon Associates tags: letters, digits, hyphens; <=50 chars.
const TAG_RE = /^[a-z0-9-]{1,50}$/i;

export default function AdminAmazonLinks() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isReady } = useAuth();
  const { hasPlatformAccess, loading: accessLoading } = useAdminAccess();

  const [state, setState] = useState<AmazonOverrideState>({ tag: "", urlOverrides: {} });
  const [tagDraft, setTagDraft] = useState("");
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");

  // Load on mount
  useEffect(() => {
    const initial = readLocalOverrides();
    setState(initial);
    setTagDraft(initial.tag);
    setUrlDrafts(initial.urlOverrides);
  }, []);

  // Gate
  useEffect(() => {
    if (isReady && !user) navigate("/auth");
  }, [isReady, user, navigate]);

  useEffect(() => {
    if (accessLoading) return;
    if (user && !hasPlatformAccess) navigate("/");
  }, [accessLoading, user, hasPlatformAccess, navigate]);

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!hasPlatformAccess) return null;

  const activeTag = state.tag || AFFILIATE_TAG;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return AMAZON_BOOKS;
    return AMAZON_BOOKS.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.asin.toLowerCase().includes(q) ||
        b.usages.some((u) => u.label.toLowerCase().includes(q) || u.path.toLowerCase().includes(q)),
    );
  }, [filter]);

  const saveTag = () => {
    const trimmed = tagDraft.trim();
    if (trimmed && !TAG_RE.test(trimmed)) {
      toast.error("Invalid affiliate tag", {
        description: "Use letters, digits, and hyphens only (max 50 chars).",
      });
      return;
    }
    const next = { ...state, tag: trimmed };
    writeLocalOverrides(next);
    setState(next);
    toast.success("Affiliate tag saved", { description: "Preview is live in this browser." });
  };

  const saveUrlOverride = (asin: string) => {
    const draft = (urlDrafts[asin] ?? "").trim();
    const next = { ...state, urlOverrides: { ...state.urlOverrides } };
    if (!draft) {
      delete next.urlOverrides[asin];
      writeLocalOverrides(next);
      setState(next);
      toast.success("Override cleared");
      return;
    }
    if (!isValidUrl(draft)) {
      toast.error("Invalid URL", { description: "Must be a full https:// URL." });
      return;
    }
    next.urlOverrides[asin] = draft;
    writeLocalOverrides(next);
    setState(next);
    toast.success("URL override saved");
  };

  const resetAll = () => {
    clearLocalOverrides();
    setState({ tag: "", urlOverrides: {} });
    setTagDraft("");
    setUrlDrafts({});
    toast.success("All local overrides cleared");
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const exportSnippet = () => {
    const lines: string[] = [];
    lines.push(`// Paste into src/lib/amazonBooks.ts`);
    if (state.tag) lines.push(`export const AFFILIATE_TAG = "${state.tag}";`);
    const overrideEntries = Object.entries(state.urlOverrides);
    if (overrideEntries.length) {
      lines.push(``);
      lines.push(`// Per-book overrideUrl values to set on AMAZON_BOOKS entries:`);
      for (const [asin, url] of overrideEntries) {
        const book = AMAZON_BOOKS.find((b) => b.asin === asin);
        lines.push(`// ${book?.title ?? asin}`);
        lines.push(`// asin: "${asin}" -> overrideUrl: "${url}"`);
      }
    }
    return lines.join("\n");
  };

  return (
    <>
      <SEOHead
        title="Amazon Links Admin — JobLine.ai"
        description="Developer/admin tool to manage Amazon book links and affiliate tag across the JobLine site."
        canonical="/admin/amazon-links"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 max-w-6xl space-y-6">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="text-xs">Platform admin / Developer only</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Amazon Links Manager</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Single source of truth for every Amazon book link on the site. Stage a tag or
                per-book URL change as a browser-only preview, then export the change to commit
                to <code className="text-xs px-1 py-0.5 rounded bg-muted">src/lib/amazonBooks.ts</code>.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset all overrides
            </Button>
          </header>

          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>How rollout works</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed">
              Saves on this page only affect <strong>your browser</strong> (localStorage) so you can
              preview links before shipping. To roll an affiliate tag or per-book URL to all
              visitors, copy the snippet below into{" "}
              <code className="text-xs">src/lib/amazonBooks.ts</code> and ship a build.
              Current shipped tag: <code className="text-xs">{AFFILIATE_TAG || "(none — clean /dp links)"}</code>.
            </AlertDescription>
          </Alert>

          {/* Global tag */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global affiliate tag (preview)</CardTitle>
              <CardDescription>
                Appended to every Amazon URL as <code className="text-xs">?tag=…</code> unless a book has its own override.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="aff-tag" className="text-xs">Tag</Label>
                  <Input
                    id="aff-tag"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    placeholder="e.g. joblineai-20"
                    maxLength={50}
                  />
                </div>
                <Button onClick={saveTag} size="sm">
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save preview
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Active in this browser: <code>{activeTag || "(none)"}</code>
              </div>
            </CardContent>
          </Card>

          {/* Filter */}
          <div>
            <Label htmlFor="filter" className="text-xs">Search books, ASINs, or usage paths</Label>
            <Input
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="e.g. Toyota, 0884271951, /blog/throughput"
              className="max-w-md"
            />
          </div>

          {/* Book list */}
          <section aria-label="Books" className="space-y-3">
            {filtered.map((book) => {
              const draftUrl = urlDrafts[book.asin] ?? "";
              const effective = buildAmazonUrl(
                book.asin,
                state.tag || AFFILIATE_TAG,
                state.urlOverrides[book.asin] ?? book.overrideUrl,
              );
              const hasOverride = Boolean(state.urlOverrides[book.asin] || book.overrideUrl);
              return (
                <Card key={book.asin}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{book.category}</Badge>
                          <code className="text-xs px-1.5 py-0.5 rounded bg-muted">{book.asin}</code>
                          {hasOverride && <Badge variant="secondary" className="text-xs">Override active</Badge>}
                        </div>
                        <CardTitle className="text-base leading-snug">{book.title}</CardTitle>
                        <CardDescription className="text-xs">{book.author}</CardDescription>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={effective} target="_blank" rel="noopener noreferrer nofollow">
                          Open <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {/* Effective URL */}
                    <div>
                      <Label className="text-xs">Effective URL</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <code className="flex-1 text-xs px-2 py-1.5 rounded border bg-muted/50 truncate" title={effective}>
                          {effective}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyText(effective, "URL")}
                          aria-label="Copy effective URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Override input */}
                    <div className="flex gap-2 items-end flex-wrap">
                      <div className="flex-1 min-w-[240px]">
                        <Label htmlFor={`url-${book.asin}`} className="text-xs">
                          Override URL (leave blank to use ASIN + tag)
                        </Label>
                        <Input
                          id={`url-${book.asin}`}
                          value={draftUrl}
                          onChange={(e) =>
                            setUrlDrafts((d) => ({ ...d, [book.asin]: e.target.value }))
                          }
                          placeholder={`https://www.amazon.com/dp/${book.asin}`}
                          maxLength={500}
                        />
                      </div>
                      <Button onClick={() => saveUrlOverride(book.asin)} size="sm" variant="outline">
                        <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                      </Button>
                    </div>

                    {/* Usages */}
                    <div>
                      <Label className="text-xs mb-1.5 block">Used in ({book.usages.length})</Label>
                      <ul className="space-y-1">
                        {book.usages.map((u) => (
                          <li key={u.path} className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-[10px] uppercase">{u.kind}</Badge>
                            <a
                              href={u.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate"
                            >
                              {u.label}
                            </a>
                            <code className="text-muted-foreground truncate">{u.path}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No books match that search.</p>
            )}
          </section>

          {/* Export snippet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export to ship</CardTitle>
              <CardDescription>
                Copy this snippet and paste into <code className="text-xs">src/lib/amazonBooks.ts</code> to promote
                your previews to production.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <pre className="text-xs p-3 rounded border bg-muted/30 overflow-auto max-h-64">
{exportSnippet()}
              </pre>
              <Button variant="outline" size="sm" onClick={() => copyText(exportSnippet(), "Snippet")}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy snippet
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
