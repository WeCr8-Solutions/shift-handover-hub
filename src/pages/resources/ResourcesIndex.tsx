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
    description: "Best practices for shift handoffs, work order management, CNC setup, quality workflows, and production visibility.",
    icon: BookOpen,
    href: "/resources/guides",
    count: "6 guides",
  },
  {
    title: "G-Code Reference",
    description: "Complete G-code and M-code command reference for CNC milling and turning. Covers Fanuc, Haas, Mazak, and ISO 6983.",
    icon: Code,
    href: "/resources/gcode",
    count: "27 commands",
  },
  {
    title: "Industry Glossary",
    description: "Manufacturing terminology, CNC definitions, quality management concepts, and production planning terms explained.",
    icon: BookA,
    href: "/resources/glossary",
    count: "26 terms",
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
        title="Manufacturing Resources, G-Code Reference & Guides | JobLine.ai"
        description="Free manufacturing resources: shift handoff guides, G-code reference, CNC glossary, and tool comparisons for machine shops and production teams."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Manufacturing Resources
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Free guides, references, and tools for manufacturing teams.
              From G-code commands to shift handoff best practices.
            </p>
          </div>

          

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
                      <CardDescription>{section.description}</CardDescription>
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

          
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
