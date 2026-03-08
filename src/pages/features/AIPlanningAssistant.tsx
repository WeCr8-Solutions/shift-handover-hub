import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  CalendarClock,
  ListOrdered,
  CheckCircle2,
  Zap,
  Brain,
  BarChart3,
  Target,
  Clock,
  Shield,
  TrendingUp,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Mock chat bubble components                                        */
/* ------------------------------------------------------------------ */

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground text-sm leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function AiBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary/60 border border-border px-4 py-2.5 text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

function MockChatWindow({
  title,
  usageText,
  children,
  className,
}: {
  title: string;
  usageText?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden shadow-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {usageText && (
          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
            {usageText}
          </Badge>
        )}
      </div>
      {/* Chat body */}
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Use-case data                                                      */
/* ------------------------------------------------------------------ */

const useCases = [
  {
    icon: AlertTriangle,
    iconColor: "text-red-400",
    iconBg: "bg-red-500/10",
    title: "Machine Down Recovery",
    description:
      "Instantly identify which work orders are affected and get rerouting suggestions to keep production moving.",
    userMessage: "CNC-03 is down. What work orders are affected?",
    aiResponse: (
      <>
        <p className="font-medium">⚠️ 3 work orders impacted by CNC-03 downtime:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
          <li><span className="font-mono text-primary">WO-0847</span> — Bracket Assembly (127/150 pcs) — <span className="text-red-400">urgent</span></li>
          <li><span className="font-mono text-primary">WO-0862</span> — Gear Housing (0/80 pcs) — queued</li>
          <li><span className="font-mono text-primary">WO-0871</span> — End Cap (0/300 pcs) — queued</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-1">
          💡 <strong>Recommendation:</strong> Move WO-0847 to CNC-01 (idle in 15 min). Reschedule WO-0862 to tomorrow's 2nd shift on CNC-02.
        </p>
      </>
    ),
  },
  {
    icon: CalendarClock,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    title: "Due Date Feasibility",
    description:
      "Ask whether deadlines are realistic and get data-backed schedule recommendations.",
    userMessage: "Can we still hit the Friday deadline for WO-0851?",
    aiResponse: (
      <>
        <p className="font-medium">📊 WO-0851 — Shaft Housing (75 pcs)</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Current step: CNC Machining (step 3/6)</p>
          <p>• Remaining ops: Deburr → Heat Treat → Final Insp → Ship</p>
          <p>• Estimated completion: <span className="text-amber-400 font-medium">Saturday 2 PM</span></p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          💡 <strong>To meet Friday:</strong> Prioritize on LATHE-02 (skip WO-0873 queue) and expedite heat treat pickup. This saves ~8 hrs.
        </p>
      </>
    ),
  },
  {
    icon: ListOrdered,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    title: "Queue Reprioritization",
    description:
      "Let AI reorder your production queue based on due dates, station availability, and routing constraints.",
    userMessage: "Reprioritize the queue for 2nd shift based on due dates",
    aiResponse: (
      <>
        <p className="font-medium">📋 Suggested 2nd shift queue order:</p>
        <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
          <li><span className="font-mono text-primary">WO-0851</span> — Due Fri — Shaft Housing → LATHE-02</li>
          <li><span className="font-mono text-primary">WO-0847</span> — Due Sat — Bracket Assembly → CNC-01</li>
          <li><span className="font-mono text-primary">WO-0853</span> — Due Mon — Motor Mount → MILL-03</li>
          <li><span className="font-mono text-primary">WO-0862</span> — Due Tue — Gear Housing → CNC-02</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-1">
          ✅ This order ensures <strong>zero late deliveries</strong> with current station capacity.
        </p>
      </>
    ),
  },
];

const howItWorks = [
  { step: "01", title: "Ask a Question", description: "Type a plain-English question about scheduling, rerouting, priorities, or capacity.", icon: MessageSquare },
  { step: "02", title: "AI Analyzes Your Data", description: "The assistant reads your live queue, station status, routing, and due dates in real time.", icon: Brain },
  { step: "03", title: "Get Actionable Answers", description: "Receive specific work order references, reroute suggestions, and priority adjustments.", icon: Target },
  { step: "04", title: "Act from Your Dashboard", description: "Apply recommendations directly from your production dashboard — no copy-pasting needed.", icon: Zap },
];

const benefits = [
  { icon: Clock, text: "Reduce scheduling decisions from hours to seconds" },
  { icon: AlertTriangle, text: "React to machine downtime instantly" },
  { icon: TrendingUp, text: "Improve on-time delivery rates" },
  { icon: BarChart3, text: "Optimize station utilization across shifts" },
  { icon: Shield, text: "Data stays inside your organization" },
  { icon: Users, text: "Empower supervisors & leads with AI insights" },
  { icon: Settings, text: "No setup — works with your existing queue" },
  { icon: Brain, text: "Gets smarter as you add more production data" },
];

const tiers = [
  { name: "Free", limit: "5 / day", highlight: false },
  { name: "Single", limit: "25 / day", highlight: false },
  { name: "Team", limit: "100 / day", highlight: true },
  { name: "Enterprise", limit: "Unlimited", highlight: false },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AIPlanningAssistant() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI Planning Assistant | Smart Production Scheduling"
        description="Ask plain-English questions about scheduling, machine downtime, and priorities. JobLine's AI Planning Assistant analyzes your live production data and delivers actionable answers in seconds."
        keywords="AI planning assistant, production scheduling AI, manufacturing AI, smart production planner, machine downtime recovery, work order prioritization, AI expeditor"
        canonical="/features/ai-planning-assistant"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "JobLine AI Planning Assistant",
          applicationCategory: "BusinessApplication",
          description: "AI-powered production planning assistant for manufacturing operations.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free tier: 5 messages/day" },
        }}
      />

      <MarketingNav />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-amber-500/15 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="container mx-auto px-4 relative text-center max-w-4xl">
          <Badge variant="outline" className="mb-5 border-amber-500/40 text-amber-400">
            <Sparkles className="w-3 h-3 mr-1.5" />
            AI-Powered Production Intelligence
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5">
            Your AI{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-primary">
              Production Planner
            </span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Ask questions about scheduling, machine downtime, and priorities.
            The assistant analyzes your <strong>live queue &amp; station data</strong> and
            gives actionable answers — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 min-w-[180px]">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/pricing")} className="gap-2 min-w-[180px]">
              See Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* ── Hero Chat Preview ────────────────────────────────── */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <MockChatWindow title="Planning Assistant" usageText="3 / 5 left today">
            <UserBubble text="A machine is down. What work orders are affected and what should I do?" />
            <AiBubble>
              <p className="font-medium">⚠️ CNC-03 is flagged as <span className="text-red-400">Down</span>. 3 work orders are impacted:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
                <li><span className="font-mono text-primary">WO-0847</span> — Bracket Assembly — 127 of 150 done — <span className="text-red-400 font-semibold">urgent</span></li>
                <li><span className="font-mono text-primary">WO-0862</span> — Gear Housing — queued — due Wednesday</li>
                <li><span className="font-mono text-primary">WO-0871</span> — End Cap — queued — due Thursday</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                💡 <strong>Recommended actions:</strong>
              </p>
              <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-0.5">
                <li>Move WO-0847 to <strong>CNC-01</strong> (available in 15 min) to finish the remaining 23 pcs.</li>
                <li>Reschedule WO-0862 to tomorrow's 2nd shift on <strong>CNC-02</strong>.</li>
                <li>WO-0871 has slack — keep in queue.</li>
              </ol>
            </AiBubble>
            {/* Mock input */}
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <div className="flex-1 h-9 rounded-lg bg-secondary/40 border border-border/50 px-3 flex items-center text-xs text-muted-foreground">
                Ask about scheduling, rerouting, or priorities…
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </MockChatWindow>
        </div>
      </section>

      {/* ── Use Cases ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4">Real Scenarios</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              See What You Can Ask
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              From machine failures to deadline crunches — the assistant handles it all.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {useCases.map((uc, i) => (
              <Card key={i} className="border-border bg-card hover:border-primary/40 transition-colors">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", uc.iconBg)}>
                      <uc.icon className={cn("w-5 h-5", uc.iconColor)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{uc.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{uc.description}</p>

                  {/* Mini chat */}
                  <div className="rounded-lg border border-border bg-background/60 p-3 space-y-3">
                    <UserBubble text={uc.userMessage} />
                    <AiBubble>{uc.aiResponse}</AiBubble>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Four Simple Steps</h2>
          </div>

          <div className="space-y-6">
            {howItWorks.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{step.step}</span>
                    <h3 className="font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plan Comparison ──────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-amber-500/40 text-amber-400">
            <Sparkles className="w-3 h-3 mr-1.5" /> Usage Tiers
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Start Free. Scale as You Grow.
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Every plan includes the AI Planning Assistant. Upgrade for more daily messages.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={cn(
                  "rounded-xl border p-4 text-center",
                  t.highlight
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <p className="text-xs text-muted-foreground mb-1">{t.name}</p>
                <p className={cn("text-lg font-bold", t.highlight && "text-primary")}>{t.limit}</p>
                <p className="text-[10px] text-muted-foreground">messages</p>
              </div>
            ))}
          </div>

          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Why Teams Love It</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LeadCaptureBar sourcePage="ai-planning-assistant" className="py-8" />

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Ready to Plan Smarter?
          </h2>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">
            Start with 5 free AI messages a day. No credit card required.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 min-w-[200px]">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      

      <MarketingFooter />
      <LeadCaptureModal />
    </div>
  );
}
