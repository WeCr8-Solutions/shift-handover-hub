import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, FileCode, Clock, CalendarDays, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published_date: string;
  author: string;
  excerpt: string;
  category: string;
  read_time: string;
  body: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface MdxPostMeta {
  title: string;
  slug: string;
  publishedDate: string;
  author: string;
  excerpt: string;
  category: string;
  readTime: string;
}

const CATEGORIES = ["Operations", "Shop Floor", "CNC", "Production", "Quality", "Planning", "General", "Shift Handover", "Machine Intelligence"];

const emptyPost = {
  title: "",
  slug: "",
  published_date: new Date().toISOString().split("T")[0],
  author: "JobLine Team",
  excerpt: "",
  category: "General",
  read_time: "5 min read",
  body: "",
  is_published: false,
};

// Glob import all MDX files
const postModules = import.meta.glob("../../../content/posts/*.mdx");

export function BlogAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [mdxPosts, setMdxPosts] = useState<MdxPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("published_date", { ascending: false });
    if (error) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  // Load MDX post frontmatter
  const loadMdxPosts = async () => {
    const loaded: MdxPostMeta[] = [];
    for (const path in postModules) {
      try {
        const mod = (await postModules[path]()) as { frontmatter?: MdxPostMeta };
        if (mod.frontmatter) {
          loaded.push(mod.frontmatter);
        }
      } catch {
        // skip broken MDX files
      }
    }
    loaded.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
    setMdxPosts(loaded);
  };

  useEffect(() => {
    fetchPosts();
    loadMdxPosts();
  }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openNew = () => {
    setEditingPost({ ...emptyPost });
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost({ ...post });
    setDialogOpen(true);
  };

  const openDelete = (post: BlogPost) => {
    setDeletingPost(post);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPost?.title || !editingPost?.slug) {
      toast({ title: "Title and slug are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: editingPost.title,
      slug: editingPost.slug,
      published_date: editingPost.published_date || new Date().toISOString().split("T")[0],
      author: editingPost.author || "JobLine Team",
      excerpt: editingPost.excerpt || "",
      category: editingPost.category || "General",
      read_time: editingPost.read_time || "5 min read",
      body: editingPost.body || "",
      is_published: editingPost.is_published || false,
      created_by: user?.id,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingPost.id) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", editingPost.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }

    if (error) {
      toast({ title: "Error saving post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingPost.id ? "Post updated" : "Post created" });
      setDialogOpen(false);
      setEditingPost(null);
      fetchPosts();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", deletingPost.id);
    if (error) {
      toast({ title: "Error deleting post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post deleted" });
      setDeleteDialogOpen(false);
      setDeletingPost(null);
      fetchPosts();
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ is_published: !post.is_published, updated_at: new Date().toISOString() })
      .eq("id", post.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchPosts();
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setEditingPost((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Check if an MDX post has a DB override
  const dbSlugs = new Set(posts.map((p) => p.slug));
  const uniqueMdxPosts = mdxPosts.filter((m) => !dbSlugs.has(m.slug));

  const totalPosts = posts.length + uniqueMdxPosts.length;
  const publishedCount = posts.filter((p) => p.is_published).length + uniqueMdxPosts.length;
  const draftCount = posts.filter((p) => !p.is_published).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" /> Blog Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalPosts} total · {publishedCount} published · {draftCount} draft{draftCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 shrink-0" size="sm">
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading posts…</div>
      ) : (
        <div className="space-y-2">
          {/* Database posts — fully editable */}
          {posts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Database Posts</p>
              {posts.map((post) => {
                const wasEdited = post.updated_at && post.updated_at !== post.created_at;
                return (
                  <Card key={post.id} className="border-border">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm truncate">{post.title}</span>
                            <Badge variant={post.is_published ? "default" : "secondary"} className="shrink-0 text-[10px]">
                              {post.is_published ? "Published" : "Draft"}
                            </Badge>
                            <Badge variant="outline" className="shrink-0 text-[10px]">{post.category}</Badge>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-muted-foreground truncate">
                              /blog/{post.slug} · {post.author}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {post.published_date}
                              </span>
                              {wasEdited && (
                                <span className="flex items-center gap-1 text-primary/70">
                                  <Clock className="w-3 h-3" />
                                  Edited {formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(post)} title={post.is_published ? "Unpublish" : "Publish"}>
                            {post.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(post)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* MDX file posts — read-only display */}
          {uniqueMdxPosts.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                MDX File Posts <span className="normal-case font-normal">(read-only, edit in codebase)</span>
              </p>
              {uniqueMdxPosts.map((post) => (
                <Card key={post.slug} className="border-border bg-muted/30">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <FileCode className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">{post.title}</span>
                          <Badge variant="default" className="shrink-0 text-[10px]">Published</Badge>
                          <Badge variant="outline" className="shrink-0 text-[10px]">{post.category}</Badge>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            /blog/{post.slug} · {post.author} · {post.readTime}
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {post.publishedDate}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View post">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {posts.length === 0 && uniqueMdxPosts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No posts yet. Click "New Post" to create one.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost?.id ? "Edit Post" : "New Blog Post"}</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4">
              {editingPost.id && editingPost.updated_at && editingPost.updated_at !== editingPost.created_at && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Last edited {formatDistanceToNow(new Date(editingPost.updated_at), { addSuffix: true })}
                  {" · "}Created {new Date(editingPost.created_at!).toLocaleDateString()}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editingPost.title || ""}
                    onChange={(e) => {
                      updateField("title", e.target.value);
                      if (!editingPost.id) updateField("slug", generateSlug(e.target.value));
                    }}
                    placeholder="Post title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editingPost.slug || ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="url-slug"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editingPost.category || "General"} onValueChange={(v) => updateField("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Published Date</Label>
                  <Input type="date" value={editingPost.published_date || ""} onChange={(e) => updateField("published_date", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Read Time</Label>
                  <Input value={editingPost.read_time || ""} onChange={(e) => updateField("read_time", e.target.value)} placeholder="5 min read" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input value={editingPost.author || ""} onChange={(e) => updateField("author", e.target.value)} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={editingPost.is_published || false} onCheckedChange={(v) => updateField("is_published", v)} />
                  <Label>Published</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea value={editingPost.excerpt || ""} onChange={(e) => updateField("excerpt", e.target.value)} rows={2} placeholder="Brief description for cards and SEO" />
              </div>
              <div className="space-y-2">
                <Label>Body (Markdown)</Label>
                <Textarea value={editingPost.body || ""} onChange={(e) => updateField("body", e.target.value)} rows={14} placeholder="Write your post content in Markdown..." className="font-mono text-sm" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingPost?.id ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "<strong>{deletingPost?.title}</strong>"? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
