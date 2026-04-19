import { useParams, Link } from "react-router-dom";
import { useEffect, useState, ComponentType } from "react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface PostFrontmatter {
  title: string;
  slug: string;
  publishedDate: string;
  author: string;
  excerpt: string;
  category: string;
  readTime: string;
}

interface MdxModule {
  default: ComponentType;
  frontmatter: PostFrontmatter;
}

const mdxModules = import.meta.glob<MdxModule>("/content/posts/*.mdx", { eager: true });

interface GalleryItem {
  url: string;
  caption?: string;
  alt?: string;
}

interface DbPost {
  title: string;
  slug: string;
  published_date: string;
  author: string;
  excerpt: string;
  category: string;
  read_time: string;
  body: string;
  cover_image_url: string | null;
  video_url: string | null;
  video_provider: string | null;
  gallery: GalleryItem[];
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
}

// ---------------------------------------------------------------------------
// Video embed renderer
// ---------------------------------------------------------------------------
function VideoEmbed({ url, provider }: { url: string; provider: string | null }) {
  // YouTube
  if (provider === "youtube" || /youtube\.com|youtu\.be/.test(url)) {
    const idMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    const id = idMatch?.[1];
    if (!id) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title="Video"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  // Vimeo
  if (provider === "vimeo" || /vimeo\.com/.test(url)) {
    const idMatch = url.match(/vimeo\.com\/(\d+)/);
    const id = idMatch?.[1];
    if (!id) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
        <iframe
          src={`https://player.vimeo.com/video/${id}`}
          title="Video"
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  // Uploaded MP4 / direct video file
  if (provider === "upload" || /\.(mp4|webm|mov)$/i.test(url)) {
    return (
      <video
        controls
        className="w-full rounded-xl border border-border bg-black"
        preload="metadata"
      >
        <source src={url} />
        Your browser does not support video playback.
      </video>
    );
  }
  // Generic embed iframe
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
      <iframe src={url} title="Video" className="w-full h-full" allowFullScreen />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
function Gallery({ items }: { items: GalleryItem[] }) {
  if (!items?.length) return null;
  return (
    <section className="mt-12 not-prose">
      <h2 className="text-xl font-bold mb-4">Story Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <figure key={i} className="space-y-2">
            <img
              src={item.url}
              alt={item.alt || item.caption || ""}
              loading="lazy"
              className="w-full rounded-lg border border-border object-cover"
            />
            {item.caption && (
              <figcaption className="text-xs text-muted-foreground italic">
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [dbPost, setDbPost] = useState<DbPost | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  // Check MDX first
  const mdxEntry = Object.values(mdxModules).find((m) => m.frontmatter.slug === slug);

  useEffect(() => {
    if (mdxEntry) {
      setDbLoading(false);
      return;
    }
    supabase
      .from("blog_posts")
      .select(
        "title, slug, published_date, author, excerpt, category, read_time, body, cover_image_url, video_url, video_provider, gallery, tags, seo_title, seo_description"
      )
      .eq("slug", slug!)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDbPost({
            ...data,
            gallery: (Array.isArray(data.gallery) ? data.gallery : []) as GalleryItem[],
            tags: Array.isArray(data.tags) ? data.tags : [],
          });
        }
        setDbLoading(false);
      });
  }, [slug, mdxEntry]);

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MarketingNav />
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Loading…</div>
        <MarketingFooter />
      </div>
    );
  }

  // Render MDX post
  if (mdxEntry) {
    const { frontmatter, default: Content } = mdxEntry;
    return (
      <>
        <SEOHead
          title={`${frontmatter.title} | JobLine.ai Blog`}
          description={frontmatter.excerpt}
          keywords={`${frontmatter.category}, manufacturing`}
          canonical={`https://jobline.ai/blog/${frontmatter.slug}`}
        />
        <div className="min-h-screen bg-background text-foreground">
          <MarketingNav />
          <article className="py-16 sm:py-24">
            <div className="container mx-auto px-4 max-w-3xl">
              <Button asChild variant="ghost" size="sm" className="mb-8 -ml-2">
                <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-1" /> All Posts</Link>
              </Button>
              <header className="mb-10">
                <Badge variant="outline" className="mb-3">{frontmatter.category}</Badge>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">{frontmatter.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {frontmatter.author}</span>
                  <span>{new Date(frontmatter.publishedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {frontmatter.readTime}</span>
                </div>
              </header>
              <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:tracking-tight prose-a:text-primary">
                <Content />
              </div>
            </div>
          </article>
          <MarketingFooter />
        </div>
      </>
    );
  }

  // Render DB post
  if (dbPost) {
    return (
      <>
        <SEOHead
          title={`${dbPost.seo_title || dbPost.title} | JobLine.ai Blog`}
          description={dbPost.seo_description || dbPost.excerpt}
          keywords={`${dbPost.category}, ${dbPost.tags.join(", ")}, manufacturing`}
          canonical={`https://jobline.ai/blog/${dbPost.slug}`}
          ogImage={dbPost.cover_image_url || undefined}
        />
        <div className="min-h-screen bg-background text-foreground">
          <MarketingNav />
          <article className="py-16 sm:py-24">
            <div className="container mx-auto px-4 max-w-3xl">
              <Button asChild variant="ghost" size="sm" className="mb-8 -ml-2">
                <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-1" /> All Posts</Link>
              </Button>
              <header className="mb-8">
                <Badge variant="outline" className="mb-3">{dbPost.category}</Badge>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">{dbPost.title}</h1>
                {dbPost.excerpt && (
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">{dbPost.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {dbPost.author}</span>
                  <span>{new Date(dbPost.published_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {dbPost.read_time}</span>
                </div>
              </header>

              {/* Hero media: video takes priority, otherwise cover image */}
              {dbPost.video_url ? (
                <div className="mb-10">
                  <VideoEmbed url={dbPost.video_url} provider={dbPost.video_provider} />
                </div>
              ) : dbPost.cover_image_url ? (
                <img
                  src={dbPost.cover_image_url}
                  alt={dbPost.title}
                  className="w-full rounded-xl border border-border object-cover mb-10 max-h-[500px]"
                />
              ) : null}

              <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-lg prose-img:border prose-img:border-border">
                <ReactMarkdown>{dbPost.body}</ReactMarkdown>
              </div>

              <Gallery items={dbPost.gallery} />

              {dbPost.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-1.5">
                  {dbPost.tags.map((t) => (
                    <Badge key={t} variant="secondary">#{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          </article>
          <MarketingFooter />
        </div>
      </>
    );
  }

  // Not found
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Post not found</h1>
        <Button asChild variant="outline">
          <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog</Link>
        </Button>
      </div>
      <MarketingFooter />
    </div>
  );
}
