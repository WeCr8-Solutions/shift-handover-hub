import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PostMeta {
  title: string;
  slug: string;
  publishedDate: string;
  author: string;
  authorTitle?: string;
  excerpt: string;
  category: string;
  readTime: string;
  coverImage?: string;
  tags?: string[];
  featured?: boolean;
  source: "mdx" | "db";
}

// ---------------------------------------------------------------------------
// Vite glob — lazy load to keep bundles small
// ---------------------------------------------------------------------------
const postModules = import.meta.glob<{ frontmatter: Omit<PostMeta, "source"> }>(
  "/content/posts/*.mdx"
);

const CATEGORIES = [
  "All",
  "Product Update",
  "Shift Handover",
  "Machine Intelligence",
  "Operations",
  "Shop Floor",
  "CNC Programming",
  "Industry Trends",
];

// ---------------------------------------------------------------------------
// Blog Index
// ---------------------------------------------------------------------------
export default function Blog() {
  const [mdxPosts, setMdxPosts] = useState<PostMeta[]>([]);
  const [dbPosts, setDbPosts] = useState<PostMeta[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // Load MDX posts
  useEffect(() => {
    async function loadMdx() {
      const loaded: PostMeta[] = [];
      for (const path in postModules) {
        const mod = await postModules[path]();
        if (mod.frontmatter) loaded.push({ ...mod.frontmatter, source: "mdx" });
      }
      setMdxPosts(loaded);
      setLoading(false);
    }
    loadMdx();
  }, []);

  // Load DB posts
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("title, slug, published_date, author, excerpt, category, read_time")
      .eq("is_published", true)
      .then(({ data }) => {
        if (data) {
          setDbPosts(
            data.map((p) => ({
              title: p.title,
              slug: p.slug,
              publishedDate: p.published_date,
              author: p.author,
              excerpt: p.excerpt,
              category: p.category,
              readTime: p.read_time,
              source: "db" as const,
            }))
          );
        }
      });
  }, []);

  // Merge & dedupe (DB wins on slug conflict)
  const allPosts = useMemo(() => {
    const slugMap = new Map<string, PostMeta>();
    mdxPosts.forEach((p) => slugMap.set(p.slug, p));
    dbPosts.forEach((p) => slugMap.set(p.slug, p));
    return Array.from(slugMap.values()).sort(
      (a, b) =>
        new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
  }, [mdxPosts, dbPosts]);

  const filtered =
    activeCategory === "All"
      ? allPosts
      : allPosts.filter((p) => p.category === activeCategory);

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured || activeCategory !== "All");

  const pageTitle =
    "Manufacturing Blog — Shift Handover, CNC & Shop Floor Insights";
  const pageDescription =
    "Practical guides for manufacturing teams: shift handover best practices, CNC programming tips, machine intelligence, and shop floor operations from the JobLine.ai team.";

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "JobLine.ai Manufacturing Blog",
          description: pageDescription,
          url: "https://jobline.ai/blog",
          publisher: {
            "@type": "Organization",
            name: "JobLine.ai",
            url: "https://jobline.ai",
            logo: {
              "@type": "ImageObject",
              url: "https://jobline.ai/logo.png",
            },
          },
        }}
      />

      <div className="min-h-screen bg-background text-foreground">
        <MarketingNav />

        {/* HERO HEADER */}
        <header className="border-b border-border px-6 py-20 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            JobLine.ai / Resources
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Shop Floor Intelligence.
            <br />
            <span className="text-primary">Written for Builders.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Practical guides on shift handover, CNC programming, machine
            monitoring, and modern manufacturing operations — from the team
            building JobLine.ai.
          </p>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* CATEGORY FILTER */}
          <nav
            aria-label="Blog categories"
            className="mb-12 flex flex-wrap gap-2"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {loading && (
            <div className="py-24 text-center text-muted-foreground">
              Loading posts…
            </div>
          )}

          {!loading && (
            <>
              {/* FEATURED POST — full-width hero card */}
              {featured && activeCategory === "All" && (
                <article className="mb-12" aria-label="Featured post">
                  <Link
                    to={`/blog/${featured.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/30 transition-all hover:border-primary/40 md:flex-row"
                  >
                    {featured.coverImage && (
                      <div className="aspect-video w-full overflow-hidden md:w-1/2">
                        <img
                          src={featured.coverImage}
                          alt={featured.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          width={800}
                          height={450}
                          loading="eager"
                        />
                      </div>
                    )}
                    <div className="flex flex-col justify-center p-8 md:w-1/2">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                          Featured
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {featured.category}
                        </span>
                      </div>
                      <h2 className="mb-3 text-2xl font-bold leading-snug group-hover:text-primary md:text-3xl">
                        {featured.title}
                      </h2>
                      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                        {featured.excerpt}
                      </p>
                      <PostMetaLine post={featured} />
                    </div>
                  </Link>
                </article>
              )}

              {/* POST GRID */}
              {rest.length === 0 && (
                <p className="py-16 text-center text-muted-foreground">
                  No posts in this category yet.
                </p>
              )}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </>
          )}
        </div>

        <AdPlacement format="horizontal" className="py-4" />

        {/* INTERNAL LINKS — bottom CTA */}
        <section className="border-t border-border bg-muted/30 px-6 py-16 text-center">
          <h2 className="mb-2 text-xl font-bold">
            Ready to modernize your shift handover?
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            See how JobLine.ai replaces paper logs with real-time digital
            handoffs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              See JobLine.ai
            </Link>
            <Link
              to="/features"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40"
            >
              View Features
            </Link>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Blog Card Component
// ---------------------------------------------------------------------------
function BlogCard({ post }: { post: PostMeta }) {
  return (
    <article>
      <Link
        to={`/blog/${post.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-muted/30 transition-all hover:border-primary/40"
      >
        {post.coverImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={600}
              height={338}
              loading="lazy"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-6">
          <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
            {post.category}
          </span>
          <h2 className="mb-2 flex-1 text-lg font-bold leading-snug group-hover:text-primary">
            {post.title}
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {post.excerpt}
          </p>
          <PostMetaLine post={post} />
        </div>
      </Link>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Shared post meta line (author + date + readTime)
// ---------------------------------------------------------------------------
function PostMetaLine({ post }: { post: PostMeta }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-medium text-foreground/60">{post.author}</span>
      <span>·</span>
      <time dateTime={post.publishedDate}>
        {new Date(post.publishedDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </time>
      <span>·</span>
      <span>{post.readTime}</span>
    </div>
  );
}
