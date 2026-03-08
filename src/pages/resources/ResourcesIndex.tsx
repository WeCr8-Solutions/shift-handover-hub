import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BookOpen, Code, BookA, ArrowRight, GitCompare } from "lucide-react";

const sections = [
  {
    title: "Manufacturing Guides",
    description: "12 in-depth guides covering shift handoffs, work order management, CNC setup, quality workflows, scheduling, downtime tracking, setup reduction, and production visibility.",
    icon: BookOpen,
    href: "/resources/guides",
    count: "12 guides",
  },
  {
    title: "G-Code & M-Code Reference",
    description: "Complete reference with ~100 G-codes and ~80 M-codes for CNC milling and turning. Covers motion, canned cycles, compensation, coordinate systems, coolant, spindle, automation, and turning-specific codes. Searchable with category tabs.",
    icon: Code,
    href: "/resources/gcode",
    count: "180+ codes",
  },
  {
    title: "Industry Glossary",
    description: "90+ manufacturing terms defined in detail — CNC machining, quality management (ISO 9001, AS9100), lean manufacturing, GD&T, tooling, materials, and production planning. Written for machinists and engineers.",
    icon: BookA,
    href: "/resources/glossary",
    count: "90+ terms",
  },
  {
    title: "Tool Comparisons",
    description: "Side-by-side comparisons of manufacturing software, MES systems, and shop floor management tools. Coming soon.",
    icon: GitCompare,
    href: "/resources/guides",
    count: "Coming soon",
  },
];

export default function ResourcesIndex() {
  return (
    <>
      <SEOHead
        title="Manufacturing Resources — G-Code Reference, Glossary & Guides | JobLine.ai"
        description="Free manufacturing resources: 12 expert guides, 180+ G-code and M-code references, 90+ industry glossary terms, and tool comparisons for machine shops and production teams."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Manufacturing Resources
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Free guides, references, and tools for manufacturing teams —
              from G-code commands and industry terminology to shift handoff best practices and lean manufacturing.
            </p>
          </div>

          <AdPlacement format="horizontal" className="mb-8" />

          <div className="grid md:grid-cols-2 gap-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.title} to={section.href}>
                  <Card className="h-full group hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-xs">{section.count}</Badge>
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="leading-relaxed">{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-primary font-medium text-sm flex items-center gap-1">
                        Explore
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <AdPlacement format="rectangle" className="mt-12" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
