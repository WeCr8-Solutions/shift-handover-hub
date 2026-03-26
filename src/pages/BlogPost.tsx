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

interface DbPost {
  title: string;
  slug: string;
  published_date: string;
  author: string;
  excerpt: string;
  category: string;
  read_time: string;
  body: string;
}

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
      .select("title, slug, published_date, author, excerpt, category, read_time, body")
      .eq("slug", slug!)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        setDbPost(data);
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
          title={`${dbPost.title} | JobLine.ai Blog`}
          description={dbPost.excerpt}
          keywords={`${dbPost.category}, manufacturing`}
          canonical={`https://jobline.ai/blog/${dbPost.slug}`}
        />
        <div className="min-h-screen bg-background text-foreground">
          <MarketingNav />
          <article className="py-16 sm:py-24">
            <div className="container mx-auto px-4 max-w-3xl">
              <Button asChild variant="ghost" size="sm" className="mb-8 -ml-2">
                <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-1" /> All Posts</Link>
              </Button>
              <header className="mb-10">
                <Badge variant="outline" className="mb-3">{dbPost.category}</Badge>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">{dbPost.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><User className="w-4 h-4" /> {dbPost.author}</span>
                  <span>{new Date(dbPost.published_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {dbPost.read_time}</span>
                </div>
              </header>
              <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:tracking-tight prose-a:text-primary">
                <ReactMarkdown>{dbPost.body}</ReactMarkdown>
              </div>
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
