import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, AlertTriangle, Factory } from "lucide-react";
import { industries } from "./industryData";
import NotFound from "@/pages/NotFound";

export default function IndustryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const data = slug ? industries[slug] : undefined;

  if (!data) return <NotFound />;

  return (
    <>
      <SEOHead
        title={`${data.name} Software`}
        description={data.metaDescription}
        canonical={`/industries/${data.slug}`}
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container relative py-16 sm:py-24 max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Factory className="w-3 h-3 mr-1" />
              {data.name}
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {data.headline}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {data.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")}>
                Request a Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Challenges */}
        <section className="container py-16 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Challenges We Solve</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Common pain points in {data.name.toLowerCase()} that JobLine.ai addresses head-on.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.challenges.map((c, i) => (
              <Card key={i} className="border-destructive/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{c.title}</h3>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="border-y border-border bg-muted/30">
          <div className="container py-16 max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">How JobLine.ai Helps</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Purpose-built capabilities for {data.name.toLowerCase()} operations.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.benefits.map((b, i) => (
                <Card key={i} className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">{b.title}</h3>
                        <p className="text-sm text-muted-foreground">{b.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16 max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Transform Your {data.name} Operations?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join manufacturers who've eliminated spreadsheet scheduling, verbal handoffs, and production blind spots.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
              View Pricing
            </Button>
          </div>
        </section>

        <AdPlacement format="horizontal" slot="industry-footer" className="my-8" />
      <MarketingFooter />
      </div>
    </>
  );
}
