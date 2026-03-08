import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { HelpSearch } from "@/components/help";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { helpCategories, getArticlesByCategory, helpArticles } from "@/lib/helpArticles";

const popularSlugs = [
  "getting-started/creating-an-account",
  "work-orders/creating-work-orders",
  "shift-handoffs/creating-a-handoff",
  "teams-orgs/inviting-members",
  "stations/operator-check-in",
  "faq/common-errors",
];

export default function Help() {
  const navigate = useNavigate();

  const popularArticles = popularSlugs
    .map((path) => {
      const [cat, slug] = path.split("/");
      return helpArticles.find((a) => a.category === cat && a.slug === slug);
    })
    .filter(Boolean);

  return (
    <>
      <SEOHead
        title="Help Center"
        description="Find guides, tutorials, and answers to common questions about JobLine.ai manufacturing software."
        canonical="/help"
        keywords="jobline help, manufacturing software help, shift handoff guide, work order help"
      />
      <MarketingNav />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-16">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How can we help?
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Search our documentation or browse by category below.
            </p>
            <HelpSearch large className="max-w-xl mx-auto" />
          </div>
        </section>

        <AdPlacement format="horizontal" className="my-6" />

        {/* Categories */}
        <section className="container mx-auto px-4 py-12 max-w-5xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpCategories.map((cat) => {
              const count = getArticlesByCategory(cat.key).length;
              return (
                <Card
                  key={cat.key}
                  className="cursor-pointer hover:border-primary/50 transition-colors group"
                  onClick={() => {
                    const first = getArticlesByCategory(cat.key)[0];
                    if (first) navigate(`/help/${cat.key}/${first.slug}`);
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <cat.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {cat.label}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">{cat.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Popular Articles */}
        <section className="container mx-auto px-4 pb-12 max-w-5xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Popular Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularArticles.map((article) => article && (
              <button
                key={`${article.category}-${article.slug}`}
                onClick={() => navigate(`/help/${article.category}/${article.slug}`)}
                className="text-left p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">{article.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{article.categoryLabel}</p>
              </button>
            ))}
          </div>
        </section>

        <AdPlacement format="rectangle" className="mb-8" />
      </main>

      <MarketingFooter />
    </>
  );
}
