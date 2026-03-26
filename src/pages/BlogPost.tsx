import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, User } from "lucide-react";
import { ComponentType } from "react";

interface PostFrontmatter {
  title: string;
  slug: string;
  publishedDate: string;
  author: string;
  excerpt: string;
  category: string;
  readTime: string;
}

interface PostModule {
  default: ComponentType;
  frontmatter: PostFrontmatter;
}

const modules = import.meta.glob<PostModule>("/content/posts/*.mdx", { eager: true });

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const entry = Object.values(modules).find((m) => m.frontmatter.slug === slug);

  if (!entry) {
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

  const { frontmatter, default: Content } = entry;

  return (
    <>
      <SEOHead
        title={`${frontmatter.title} | JobLine.ai Blog`}
        description={frontmatter.excerpt}
        keywords={`${frontmatter.category}, manufacturing, ${frontmatter.title.toLowerCase()}`}
        canonical={`https://jobline.ai/blog/${frontmatter.slug}`}
      />
      <div className="min-h-screen bg-background text-foreground">
        <MarketingNav />

        <article className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Back link */}
            <Button asChild variant="ghost" size="sm" className="mb-8 -ml-2">
              <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-1" /> All Posts</Link>
            </Button>

            {/* Header */}
            <header className="mb-10">
              <Badge variant="outline" className="mb-3">{frontmatter.category}</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">
                {frontmatter.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {frontmatter.author}</span>
                <span>
                  {new Date(frontmatter.publishedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {frontmatter.readTime}</span>
              </div>
            </header>

            {/* MDX Content */}
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
