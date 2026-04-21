import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanningAssistantPanel } from "@/components/planning/PlanningAssistantPanel";
import {
  Sparkles,
  Gauge,
  Calendar,
  Workflow,
  ClipboardList,
  BookOpen,
  Truck,
  ArrowRight,
  Factory,
  ListChecks,
  ShieldAlert,
  Wrench,
  LucideIcon,
} from "lucide-react";

interface ModuleCard {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

interface ModuleSection {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  cards: ModuleCard[];
}

export default function PlanningCenter() {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const { hasOrgSupervisorAccess } = useAdminAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  if (!user) return null;

  const sections: ModuleSection[] = [
    {
      id: "capacity",
      title: "Capacity",
      subtitle: "Load vs. available hours, bottlenecks, and what-if planning.",
      icon: Gauge,
      cards: [
        {
          title: "Calendar Load View",
          description: "Daily scheduled work by station — see overload at a glance.",
          to: "/queue?view=calendar",
          icon: Calendar,
        },
        {
          title: "Station Workload",
          description: "Kanban filtered to in-progress work across all stations.",
          to: "/queue?view=kanban&status=in_progress",
          icon: Factory,
        },
        {
          title: "Capacity Reference",
          description: "How JobLine.ai models capacity, shifts, and bottlenecks.",
          to: "/features/capacity-planning",
          icon: BookOpen,
        },
      ],
    },
    {
      id: "planning",
      title: "Planning",
      subtitle: "Sequence work, balance stations, and resolve conflicts.",
      icon: ClipboardList,
      cards: [
        {
          title: "Production Queue",
          description: "Full queue with filters, kanban, list, and calendar views.",
          to: "/queue",
          icon: ListChecks,
        },
        {
          title: "Schedule Conflicts",
          description: "On-hold and at-risk items requiring re-sequencing.",
          to: "/queue?view=list&status=on_hold",
          icon: ShieldAlert,
        },
        {
          title: "Routing & Operations",
          description: "Inspect routing steps and outside processing flow.",
          to: "/queue?view=list",
          icon: Workflow,
        },
      ],
    },
    {
      id: "processing",
      title: "Processing",
      subtitle: "Outside ops, deliveries, and material movement.",
      icon: Truck,
      cards: [
        {
          title: "Outside Processing",
          description: "Vendor PO tracking, ship-out, and return windows.",
          to: "/queue?tab=outside-processing",
          icon: Truck,
        },
        {
          title: "Active Deliveries",
          description: "In-flight handoffs and station-to-station moves.",
          to: "/queue?view=list",
          icon: ArrowRight,
        },
        {
          title: "NCR Queue",
          description: "Non-conformance reports awaiting authorization.",
          to: "/queue?tab=ncr",
          icon: ShieldAlert,
        },
      ],
    },
    {
      id: "sop",
      title: "SOP Center",
      subtitle: "Standard operating procedures, training, and quality docs.",
      icon: BookOpen,
      cards: [
        {
          title: "G-Code Academy",
          description: "Standardized CNC operator training and reference.",
          to: "/gcode-academy",
          icon: BookOpen,
        },
        {
          title: "Operator Acceptance Program",
          description: "AS9100/ISO certification & mentor sign-off workflow.",
          to: "/oap/learn",
          icon: ClipboardList,
        },
        {
          title: "Manufacturing Guides",
          description: "Setup sheets, tooling, FAI, and process references.",
          to: "/resources/guides",
          icon: Wrench,
        },
      ],
    },
  ];

  const canUseAi = hasOrgSupervisorAccess && !!organization;

  return (
    <>
      <Helmet>
        <title>Planning Center | JobLine.ai</title>
        <meta
          name="description"
          content="Unified planning hub: capacity, scheduling, processing, SOPs, and AI-powered production assistant."
        />
      </Helmet>
      <Header />
      <main className="container py-6 space-y-6">
        <header className="space-y-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Planning Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Capacity, planning, processing, and SOPs — powered by the same AI assistant from the floor.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/queue?view=calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Open calendar
            </Link>
          </Button>
        </header>

        <Tabs defaultValue="capacity" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                  <Icon className="w-4 h-4" />
                  {s.title}
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              AI Assistant
              {!canUseAi && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  supervisor
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Link
                      key={card.title}
                      to={card.to}
                      className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
                    >
                      <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/40">
                        <CardHeader className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="p-2 rounded-md bg-primary/10 text-primary">
                              <Icon className="w-5 h-5" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <CardTitle className="text-base">{card.title}</CardTitle>
                          <CardDescription className="text-xs leading-relaxed">
                            {card.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="ai" className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">AI Planning Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Same engine as the floating ✨ button — with your live shop-floor context.
              </p>
            </div>
            {canUseAi ? (
              <PlanningAssistantPanel organizationId={organization!.id} />
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Supervisor or admin access is required to use the AI Planning Assistant.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
