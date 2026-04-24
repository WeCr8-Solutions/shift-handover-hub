import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import NotFound from "@/pages/NotFound";
import { erpGuideParts, LOCAL_KEY } from "./erpGuideData";

export default function ERPGuidePart() {
  const { partSlug } = useParams<{ partSlug: string }>();
  const navigate = useNavigate();
  const part = erpGuideParts.find((p) => p.id === partSlug);

  useEffect(() => {
    if (part) {
      try {
        const read = new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"));
        read.add(part.id);
        localStorage.setItem(LOCAL_KEY, JSON.stringify([...read]));
      } catch {
        // Ignore localStorage failures when tracking read progress.
      }
    }
  }, [part]);

  if (!part) return <NotFound />;

  const idx = erpGuideParts.findIndex((p) => p.id === part.id);
  const prev = idx > 0 ? erpGuideParts[idx - 1] : null;
  const next = idx < erpGuideParts.length - 1 ? erpGuideParts[idx + 1] : null;
  const Icon = part.icon;

  return (
    <>
      <SEOHead
        title={`Part ${part.part}: ${part.title} — ERP Selection Guide`}
        description={part.subtitle}
        canonical={`/resources/erp-guide/${part.id}`}
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-3xl">
          {/* Breadcrumb */}
          <Button variant="ghost" size="sm" className="gap-1.5 mb-6 -ml-2" onClick={() => navigate("/resources/erp-guide")}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Guide Overview
          </Button>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Part {part.part} of {erpGuideParts.length}</Badge>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{part.title}</h1>
              <p className="text-muted-foreground mt-2">{part.subtitle}</p>
            </div>
          </div>

          <div className="space-y-8">
            {part.sections.map((sec, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-3">{sec.heading}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{sec.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Prev/Next nav */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
            {prev ? (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/resources/erp-guide/${prev.id}`)}>
                <ArrowLeft className="w-3.5 h-3.5" /> Part {prev.part}
              </Button>
            ) : <div />}
            {next ? (
              <Button size="sm" className="gap-1.5" onClick={() => navigate(`/resources/erp-guide/${next.id}`)}>
                Part {next.part} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/auth")}>
                Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
