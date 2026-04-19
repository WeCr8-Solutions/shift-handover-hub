import { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, FileText, FileCode, Clock, CalendarDays,
  ExternalLink, Upload, X, Image as ImageIcon, Video, Star, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GalleryItem {
  url: string;
  caption?: string;
  alt?: string;
}

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
  cover_image_url: string | null;
  video_url: string | null;
  video_provider: string | null;
  gallery: GalleryItem[];
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  featured: boolean;
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

const CATEGORIES = [
  "Operations", "Shop Floor", "CNC", "Production", "Quality", "Planning",
  "General", "Shift Handover", "Machine Intelligence", "Vlog", "Story", "Industry Trends",
];

const VIDEO_PROVIDERS = [
  { value: "none", label: "No video" },
  { value: "youtube", label: "YouTube URL" },
  { value: "vimeo", label: "Vimeo URL" },
  { value: "embed", label: "Custom embed URL" },
  { value: "upload", label: "Uploaded MP4" },
];

const emptyPost: Partial<BlogPost> = {
  title: "",
  slug: "",
  published_date: new Date().toISOString().split("T")[0],
  author: "JobLine Team",
  excerpt: "",
  category: "General",
  read_time: "5 min read",
  body: "",
  is_published: false,
  cover_image_url: null,
  video_url: null,
  video_provider: null,
  gallery: [],
  tags: [],
  seo_title: null,
  seo_description: null,
  featured: false,
};

// Glob import all MDX files
const postModules = import.meta.glob("../../../content/posts/*.mdx");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState<"cover" | "gallery" | "video" | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("published_date", { ascending: false });
    if (error) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
    } else {
      setPosts((data || []) as unknown as BlogPost[]);
    }
    setLoading(false);
  };

  const loadMdxPosts = async () => {
    const loaded: MdxPostMeta[] = [];
    for (const path in postModules) {
      try {
        const mod = (await postModules[path]()) as { frontmatter?: MdxPostMeta };
        if (mod.frontmatter) loaded.push(mod.frontmatter);
      } catch {
        /* skip */
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
    setEditingPost({
      ...post,
      gallery: Array.isArray(post.gallery) ? post.gallery : [],
      tags: Array.isArray(post.tags) ? post.tags : [],
    });
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
      is_published: editingPost.is_published ?? false,
      cover_image_url: editingPost.cover_image_url || null,
      video_url: editingPost.video_url || null,
      video_provider: editingPost.video_provider || null,
      gallery: (editingPost.gallery || []) as unknown as never,
      tags: editingPost.tags || [],
      seo_title: editingPost.seo_title || null,
      seo_description: editingPost.seo_description || null,
      featured: editingPost.featured ?? false,
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

  const toggleFeatured = async (post: BlogPost) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ featured: !post.featured, updated_at: new Date().toISOString() })
      .eq("id", post.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchPosts();
    }
  };

  const updateField = <K extends keyof BlogPost>(field: K, value: BlogPost[K] | null) => {
    setEditingPost((prev) => (prev ? { ...prev, [field]: value as BlogPost[K] } : prev));
  };

  // ---- File upload to blog-media bucket ---------------------------------
  const uploadFile = async (
    file: File,
    kind: "cover" | "gallery" | "video"
  ): Promise<string | null> => {
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const slugPart = editingPost?.slug || "post";
      const path = `${kind}/${slugPart}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("blog-media").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("blog-media").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await uploadFile(file, "cover");
    if (url) updateField("cover_image_url", url);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const current = editingPost?.gallery || [];
    const uploaded: GalleryItem[] = [];
    for (const file of files) {
      const url = await uploadFile(file, "gallery");
      if (url) uploaded.push({ url, caption: "", alt: "" });
    }
    updateField("gallery", [...current, ...uploaded]);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await uploadFile(file, "video");
    if (url) {
      updateField("video_url", url);
      updateField("video_provider", "upload");
    }
  };

  const removeGalleryItem = (idx: number) => {
    const current = editingPost?.gallery || [];
    updateField("gallery", current.filter((_, i) => i !== idx));
  };

  const updateGalleryCaption = (idx: number, field: "caption" | "alt", value: string) => {
    const current = [...(editingPost?.gallery || [])];
    current[idx] = { ...current[idx], [field]: value };
    updateField("gallery", current);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    const current = editingPost?.tags || [];
    if (current.includes(t)) return;
    updateField("tags", [...current, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateField("tags", (editingPost?.tags || []).filter((t) => t !== tag));
  };

  // ---- Stats ------------------------------------------------------------
  const dbSlugs = new Set(posts.map((p) => p.slug));
  const uniqueMdxPosts = mdxPosts.filter((m) => !dbSlugs.has(m.slug));
  const totalPosts = posts.length + uniqueMdxPosts.length;
  const publishedCount = posts.filter((p) => p.is_published).length + uniqueMdxPosts.length;
  const draftCount = posts.filter((p) => !p.is_published).length;

  const isUploading = uploading !== null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" /> Blog &amp; Vlog Management
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
          {/* Database posts */}
          {posts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Database Posts</p>
              {posts.map((post) => {
                const wasEdited = post.updated_at && post.updated_at !== post.created_at;
                return (
                  <Card key={post.id} className="border-border">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        {post.cover_image_url && (
                          <img
                            src={post.cover_image_url}
                            alt=""
                            className="w-16 h-16 rounded object-cover shrink-0 border border-border"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm truncate">{post.title}</span>
                            {post.featured && (
                              <Badge variant="default" className="shrink-0 text-[10px] gap-1">
                                <Star className="w-2.5 h-2.5" /> Featured
                              </Badge>
                            )}
                            <Badge variant={post.is_published ? "default" : "secondary"} className="shrink-0 text-[10px]">
                              {post.is_published ? "Published" : "Draft"}
                            </Badge>
                            <Badge variant="outline" className="shrink-0 text-[10px]">{post.category}</Badge>
                            {post.video_url && (
                              <Badge variant="outline" className="shrink-0 text-[10px] gap-1">
                                <Video className="w-2.5 h-2.5" /> Video
                              </Badge>
                            )}
                            {post.gallery?.length > 0 && (
                              <Badge variant="outline" className="shrink-0 text-[10px] gap-1">
                                <ImageIcon className="w-2.5 h-2.5" /> {post.gallery.length}
                              </Badge>
                            )}
                          </div>
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
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFeatured(post)} title={post.featured ? "Unfeature" : "Feature"}>
                            <Star className={`w-3.5 h-3.5 ${post.featured ? "fill-current text-primary" : ""}`} />
                          </Button>
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

          {/* MDX file posts */}
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
                        <p className="text-xs text-muted-foreground truncate">
                          /blog/{post.slug} · {post.author} · {post.readTime}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {post.publishedDate}
                        </p>
                      </div>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost?.id ? "Edit Post" : "New Blog/Vlog Post"}</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="space-y-4 mt-4">
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
                <div className="space-y-2">
                  <Label>Excerpt</Label>
                  <Textarea
                    value={editingPost.excerpt || ""}
                    onChange={(e) => updateField("excerpt", e.target.value)}
                    rows={2}
                    placeholder="Brief description for cards and SEO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body (Markdown)</Label>
                  <Textarea
                    value={editingPost.body || ""}
                    onChange={(e) => updateField("body", e.target.value)}
                    rows={16}
                    placeholder="Write your post content in Markdown. Use ## for headings, ![alt](url) for inline images, etc."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Markdown supports headings (##), lists, links [text](url), and inline images ![alt](url).
                    Use the Media tab to upload assets and copy their URLs.
                  </p>
                </div>
              </TabsContent>

              {/* MEDIA TAB */}
              <TabsContent value="media" className="space-y-6 mt-4">
                {/* Cover image */}
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  {editingPost.cover_image_url ? (
                    <div className="relative inline-block">
                      <img
                        src={editingPost.cover_image_url}
                        alt="Cover"
                        className="max-h-48 rounded-lg border border-border object-cover"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-7 w-7"
                        onClick={() => updateField("cover_image_url", null)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploading}
                      className="gap-2"
                    >
                      {uploading === "cover" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload cover image
                    </Button>
                  )}
                  <Input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  <Input
                    value={editingPost.cover_image_url || ""}
                    onChange={(e) => updateField("cover_image_url", e.target.value || null)}
                    placeholder="…or paste an image URL"
                    className="text-xs"
                  />
                </div>

                {/* Video */}
                <div className="space-y-2">
                  <Label>Video</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Select
                      value={editingPost.video_provider || "none"}
                      onValueChange={(v) => {
                        if (v === "none") {
                          updateField("video_provider", null);
                          updateField("video_url", null);
                        } else {
                          updateField("video_provider", v);
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VIDEO_PROVIDERS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={editingPost.video_url || ""}
                      onChange={(e) => updateField("video_url", e.target.value || null)}
                      placeholder={
                        editingPost.video_provider === "youtube"
                          ? "https://youtube.com/watch?v=…"
                          : editingPost.video_provider === "vimeo"
                          ? "https://vimeo.com/…"
                          : "Video URL"
                      }
                      className="sm:col-span-2"
                      disabled={!editingPost.video_provider || editingPost.video_provider === "upload"}
                    />
                  </div>
                  {editingPost.video_provider === "upload" && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        {uploading === "video" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload MP4
                      </Button>
                      {editingPost.video_url && (
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          ✓ {editingPost.video_url.split("/").pop()}
                        </span>
                      )}
                    </div>
                  )}
                  <Input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    The video plays at the top of the post (above body). Use upload for short vlogs (&lt;100 MB).
                  </p>
                </div>

                {/* Gallery */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Story Gallery</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploading}
                      className="gap-2"
                    >
                      {uploading === "gallery" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add images
                    </Button>
                  </div>
                  <Input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  {(editingPost.gallery || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No gallery images yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(editingPost.gallery || []).map((item, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-2 space-y-2">
                          <div className="relative">
                            <img src={item.url} alt={item.alt || ""} className="w-full h-32 object-cover rounded" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => removeGalleryItem(idx)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <Input
                            value={item.caption || ""}
                            onChange={(e) => updateGalleryCaption(idx, "caption", e.target.value)}
                            placeholder="Caption"
                            className="text-xs h-8"
                          />
                          <Input
                            value={item.alt || ""}
                            onChange={(e) => updateGalleryCaption(idx, "alt", e.target.value)}
                            placeholder="Alt text (accessibility)"
                            className="text-xs h-8"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* META TAB */}
              <TabsContent value="meta" className="space-y-4 mt-4">
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
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input value={editingPost.author || ""} onChange={(e) => updateField("author", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add a tag and press Enter"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(editingPost.tags || []).map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        {t}
                        <button onClick={() => removeTag(t)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-3">
                    <Switch checked={editingPost.is_published || false} onCheckedChange={(v) => updateField("is_published", v)} />
                    <Label>Published</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={editingPost.featured || false} onCheckedChange={(v) => updateField("featured", v)} />
                    <Label>Featured</Label>
                  </div>
                </div>
              </TabsContent>

              {/* SEO TAB */}
              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>SEO Title</Label>
                  <Input
                    value={editingPost.seo_title || ""}
                    onChange={(e) => updateField("seo_title", e.target.value || null)}
                    placeholder={editingPost.title || "Defaults to post title"}
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(editingPost.seo_title || "").length}/60 chars · Shown in search results.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>SEO Description</Label>
                  <Textarea
                    value={editingPost.seo_description || ""}
                    onChange={(e) => updateField("seo_description", e.target.value || null)}
                    placeholder={editingPost.excerpt || "Defaults to excerpt"}
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(editingPost.seo_description || "").length}/160 chars
                  </p>
                </div>
                {editingPost.id && editingPost.updated_at && editingPost.updated_at !== editingPost.created_at && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Last edited {formatDistanceToNow(new Date(editingPost.updated_at), { addSuffix: true })}
                    {" · "}Created {new Date(editingPost.created_at!).toLocaleDateString()}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || isUploading}>
              {saving ? "Saving…" : editingPost?.id ? "Update" : "Create"}
            </Button>
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
            Are you sure you want to delete <strong>{deletingPost?.title}</strong>? This cannot be undone.
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
