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
  BarChart3,
  Users,
  Truck,
  Settings,
  Timer,
  Layers,
} from "lucide-react";

const guides = [
  {
    title: "Complete Guide to Shift Handoffs in Manufacturing",
    description:
      "Shift handoffs are the single biggest source of lost information on the shop floor. This guide covers structured handoff protocols, what to communicate (machine status, job progress, quality alerts, tooling issues), common pitfalls like verbal-only handoffs, and how digital handoff logs create an auditable trail that supervisors can review across shifts.",
    category: "Operations",
    readTime: "8 min",
    icon: RefreshCw,
    slug: "/features/shift-handoff-software",
  },
  {
    title: "Work Order Management: From Paper to Digital",
    description:
      "Paper travelers get lost, damaged, and can't be searched. This guide walks through the transition from paper-based work orders to digital tracking — covering work order creation, status workflows (pending → queued → in-progress → complete), routing sequences, part quantity tracking, and how real-time visibility reduces expediting calls by giving everyone the same view of the queue.",
    category: "Planning",
    readTime: "12 min",
    icon: ClipboardCheck,
    slug: "/features/work-order-tracking",
  },
  {
    title: "Setting Up Digital Work Centers for CNC Operations",
    description:
      "Work centers are the foundation of production scheduling. This guide explains how to organize your machines into logical work centers based on capability (not just location), set up stations for each machine or cell, define standard operations and cycle times, and connect operator check-ins so you always know who is running which machine and what job they're on.",
    category: "Setup",
    readTime: "10 min",
    icon: Wrench,
    slug: "/features/cnc-operator-tools",
  },
  {
    title: "Production Floor Visibility: What Supervisors Need to Know",
    description:
      "Supervisors waste hours walking the floor asking 'where are we on this job?' This guide covers the key metrics every manufacturing supervisor needs on a single screen — jobs in progress by station, on-time delivery risk, operator utilization, quality yield rates, and how to set up alerts for jobs that stall or fall behind schedule.",
    category: "Leadership",
    readTime: "7 min",
    icon: Factory,
    slug: "/features/manufacturing-oversight",
  },
  {
    title: "Quality Management and NCR Workflows",
    description:
      "Non-conformance reports (NCRs) are a cornerstone of any quality system. This guide covers the full NCR lifecycle — detection, documentation, containment, disposition (use-as-is, rework, scrap, return to vendor), root cause analysis, and corrective action. Includes guidance on quantity tracking to prevent over-production and maintaining traceability for AS9100 and ISO 9001 audits.",
    category: "Quality",
    readTime: "15 min",
    icon: Shield,
    slug: "/features/quality-management",
  },
  {
    title: "Downtime Tracking: Identifying and Eliminating Waste",
    description:
      "You can't improve what you don't measure. This guide covers how to categorize downtime events by type (mechanical, electrical, material shortage, setup, operator-related), capture them in real-time at the machine, calculate OEE (Overall Equipment Effectiveness), and use Pareto analysis to focus improvement efforts on the 20% of causes creating 80% of lost time.",
    category: "Continuous Improvement",
    readTime: "9 min",
    icon: Clock,
    slug: "/features/downtime-tracking",
  },
  {
    title: "Understanding Production Scheduling for Job Shops",
    description:
      "Job shop scheduling is inherently complex — every part has a different routing, lead times vary, and priorities shift daily. This guide covers scheduling fundamentals: finite vs. infinite capacity, forward vs. backward scheduling, dispatch rules (first-come first-served, shortest processing time, earliest due date), and how to use visual queue boards to balance workloads across work centers.",
    category: "Planning",
    readTime: "14 min",
    icon: BarChart3,
    slug: "/features/production-scheduling",
  },
  {
    title: "Building Effective Manufacturing Teams",
    description:
      "Strong teams are the backbone of consistent production. This guide covers team structure (leads, operators, floaters), cross-training strategies for flexibility, how to organize teams around cells or product families, communication practices that reduce errors, and role-based access that gives operators what they need without overwhelming them with information they don't.",
    category: "Leadership",
    readTime: "8 min",
    icon: Users,
    slug: "/features/team-collaboration",
  },
  {
    title: "Routing and Outside Processing Management",
    description:
      "Many parts require operations that go outside your facility — heat treating, plating, anodizing, NDT, grinding. This guide explains how to include outside processing steps in your routing, track parts while they're at vendors, account for vendor lead times in your schedule, and maintain chain-of-custody documentation for regulated industries like aerospace and medical.",
    category: "Operations",
    readTime: "11 min",
    icon: Truck,
    slug: "/features/work-order-tracking",
  },
  {
    title: "Machine Time Tracking and Utilization",
    description:
      "Knowing how many hours your machines actually spend cutting (vs. sitting idle or in setup) is critical for capacity planning, job costing, and capital investment decisions. This guide covers machine time tracking methods, calculating spindle utilization, identifying the gap between available hours and productive hours, and setting realistic utilization targets.",
    category: "Analytics",
    readTime: "10 min",
    icon: Timer,
    slug: "/features/machine-time-tracking",
  },
  {
    title: "Setup Reduction: Applying SMED on the Shop Floor",
    description:
      "Setup time is pure non-value-added time — the machine isn't making chips. Single-Minute Exchange of Dies (SMED) is a lean methodology for dramatically reducing changeover times. This guide explains the SMED framework: separating internal setup (machine must be stopped) from external setup (can be done while running), converting internal to external, and standardizing procedures.",
    category: "Continuous Improvement",
    readTime: "12 min",
    icon: Settings,
    slug: "/features/downtime-tracking",
  },
  {
    title: "Multi-Operation Parts: Managing Complex Routings",
    description:
      "Precision parts often require 8–15 operations across multiple machines: rough turning, finish turning, milling, drilling, grinding, heat treat, plating, final inspection. This guide covers how to structure complex routings, track work-in-process between operations, manage first article requirements at each step, and prevent parts from getting lost between stations.",
    category: "Operations",
    readTime: "13 min",
    icon: Layers,
    slug: "/features/work-order-tracking",
  },
];

export default function ManufacturingGuides() {
  return (
    <>
      <SEOHead
        title="Manufacturing Guides & Best Practices — {guides.length} Expert Guides | JobLine.ai Resources"
        description="Expert guides on shift handoffs, work order management, CNC operations, quality management, NCR workflows, scheduling, downtime tracking, and lean manufacturing for job shops and production teams."
        canonical="/resources/guides"
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
              {guides.length} practical, actionable guides for manufacturing teams looking to digitize
              operations, improve shift communication, reduce downtime, and gain real-time production visibility.
              Written for machinists, supervisors, and shop owners — no fluff.
            </p>
          </div>

          <AdPlacement format="horizontal" className="mb-8" />

          <div className="grid md:grid-cols-2 gap-6">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Card key={guide.title} className="group hover:border-primary/50 transition-colors flex flex-col">
                  <CardHeader className="flex-1">
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
                    <CardDescription className="leading-relaxed">{guide.description}</CardDescription>
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

          <AdPlacement format="rectangle" className="mt-12" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
