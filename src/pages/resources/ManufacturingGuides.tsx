import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  Clock,
  Wrench,
  ClipboardCheck,
  Factory,
  RefreshCw,
  Shield,
} from "lucide-react";

const guides = [
  {
    title: "Complete Guide to Shift Handoffs in Manufacturing",
    description: "Learn best practices for shift-to-shift communication, reduce information loss, and maintain production continuity across all shifts.",
    category: "Operations",
    readTime: "8 min",
    icon: RefreshCw,
    slug: "/features/shift-handoff-software",
  },
  {
    title: "Work Order Management: From Job Shop to Smart Factory",
    description: "How to digitize work order tracking, eliminate paper travelers, and gain real-time visibility into production status.",
    category: "Planning",
    readTime: "12 min",
    icon: ClipboardCheck,
    slug: "/features/work-order-tracking",
  },
  {
    title: "Setting Up Digital Work Centers for CNC Operations",
    description: "Step-by-step guide to organizing your CNC machines, lathes, and mills into digital work centers with real-time status tracking.",
    category: "Setup",
    readTime: "10 min",
    icon: Wrench,
    slug: "/features/cnc-operator-tools",
  },
  {
    title: "Production Floor Visibility: What Supervisors Need",
    description: "Key metrics, KPIs, and dashboard strategies that give manufacturing supervisors instant insight into floor operations.",
    category: "Leadership",
    readTime: "7 min",
    icon: Factory,
    slug: "/features/manufacturing-oversight",
  },
  {
    title: "Quality Management and NCR Workflows",
    description: "How to implement non-conformance reporting, disposition workflows, and traceability for AS9100 and ISO 9001 compliance.",
    category: "Quality",
    readTime: "15 min",
    icon: Shield,
    slug: "/features/quality-management",
  },
  {
    title: "Downtime Tracking: Identifying and Eliminating Waste",
    description: "Capture unplanned downtime events, categorize root causes, and use data-driven insights to improve OEE.",
    category: "Continuous Improvement",
    readTime: "9 min",
    icon: Clock,
    slug: "/features/downtime-tracking",
  },
];

export default function ManufacturingGuides() {
  return (
    <>
      <SEOHead
        title="Manufacturing Guides & Best Practices | JobLine.ai Resources"
        description="Expert guides on shift handoffs, work order management, CNC operations, quality management, and production floor visibility for manufacturing teams."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              Resources
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Manufacturing Guides & Best Practices
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Practical, actionable guides for manufacturing teams looking to digitize operations,
              improve shift communication, and gain real-time production visibility.
            </p>
          </div>

          

          <div className="grid md:grid-cols-2 gap-6">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Card key={guide.title} className="group hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {guide.readTime}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight">{guide.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={guide.slug}>
                      <Button variant="ghost" className="gap-2 p-0 h-auto text-primary hover:text-primary/80">
                        Read Guide
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
