import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { useState, useMemo } from "react";

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
  frontmatter: PostFrontmatter;
}

const modules = import.meta.glob<PostModule>("/content/posts/*.mdx", { eager: true });

const allPosts: PostFrontmatter[] = Object.values(modules)
  .map((m) => m.frontmatter)
  .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

const categories = ["All", ...Array.from(new Set(allPosts.map((p) => p.category)))];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPosts = useMemo(
    () => (activeCategory === "All" ? allPosts : allPosts.filter((p) => p.category === activeCategory)),
    [activeCategory]
  );

  return (
    <>
      <SEOHead
        title="Manufacturing Blog | JobLine.ai"
        description="Expert insights on shift handoffs, production scheduling, CNC operations, quality management, and shop floor optimization for modern manufacturers."
        keywords="manufacturing blog, shift handoff tips, CNC machine shop, production scheduling, quality management, digital expeditor"
        canonical="https://jobline.ai/blog"
      />
      <div className="min-h-screen bg-background text-foreground">
        <MarketingNav />

        {/* Hero */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <Badge variant="secondary" className="mb-4">Manufacturing Insights</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              The JobLine Blog
            </h1>
            <p className="text-lg text-muted-foreground">
              Practical guides, industry insights, and best practices for modern manufacturing teams.
            </p>
          </div>
        </section>

        {/* Category filters */}
        <section className="border-b border-border sticky top-16 z-40 bg-background/90 backdrop-blur-sm">
          <div className="container mx-auto px-4 flex gap-2 overflow-x-auto py-3">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={cat === activeCategory ? "default" : "ghost"}
                size="sm"
                className="shrink-0"
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </section>

        {/* Posts grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card key={post.slug} className="group hover:shadow-lg transition-shadow border-border">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>
                    <Link to={`/blog/${post.slug}`}>
                      <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" /> {post.author}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.publishedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <AdPlacement format="horizontal" className="py-4" />

        {/* CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-2xl font-bold mb-3">Ready to modernize your shop floor?</h2>
            <p className="text-muted-foreground mb-6">Start your free trial and see how JobLine.ai transforms shift handoffs, work orders, and production tracking.</p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">Start Free Trial <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
}
