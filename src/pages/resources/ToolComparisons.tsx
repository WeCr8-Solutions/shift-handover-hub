import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, GitCompare, Clock, Factory, Wrench, ShieldCheck } from "lucide-react";

const comparisonRows = [
  {
    criterion: "Shift handoff continuity",
    jobline: "Structured digital handoffs, history by station, and incoming-shift visibility.",
    genericMes: "Usually available but often requires heavy customization.",
    spreadsheet: "Manual updates, easy to miss context between shifts.",
  },
  {
    criterion: "Work order routing visibility",
    jobline: "Real-time queue and routing view by station and operation.",
    genericMes: "Strong for enterprise routing, but can be complex for job shops.",
    spreadsheet: "Static status; difficult to trust in live operations.",
  },
  {
    criterion: "Operator adoption",
    jobline: "Built for shop-floor use with simple workflow screens.",
    genericMes: "Powerful but can require long onboarding cycles.",
    spreadsheet: "Familiar initially, but low consistency across teams.",
  },
  {
    criterion: "Quality and NCR tracking",
    jobline: "Integrated quality workflows with status and disposition context.",
    genericMes: "Often available as a separate quality module.",
    spreadsheet: "High risk of version drift and audit gaps.",
  },
  {
    criterion: "Deployment speed",
    jobline: "Fast startup for teams that need immediate visibility.",
    genericMes: "Longer implementation and integration timelines.",
    spreadsheet: "Immediate to start, expensive to scale reliably.",
  },
];

const whenToChoose = [
  {
    title: "Choose JobLine.ai when",
    icon: CheckCircle2,
    points: [
      "You need fast deployment and operator-friendly adoption.",
      "Shift handoff quality and queue visibility are immediate priorities.",
      "You want digital process discipline without a heavy enterprise rollout.",
    ],
  },
  {
    title: "Choose a larger MES when",
    icon: Factory,
    points: [
      "You require deep ERP/PLM integration across multiple global plants.",
      "Your process relies on extensive custom module development.",
      "You have dedicated internal MES admin and engineering resources.",
    ],
  },
  {
    title: "Avoid spreadsheet-only workflows when",
    icon: XCircle,
    points: [
      "Handoffs are frequently missed or inconsistent between shifts.",
      "Production status is hard to verify in real time.",
      "Auditability and quality traceability are business-critical.",
    ],
  },
];

const evaluationChecklist = [
  {
    title: "Operational Fit",
    icon: Wrench,
    items: [
      "Can operators complete core tasks in under 30 seconds?",
      "Can supervisors see queue, bottlenecks, and handoffs at a glance?",
      "Does it support routing complexity without daily admin overhead?",
    ],
  },
  {
    title: "Implementation Risk",
    icon: Clock,
    items: [
      "How long until first station goes live?",
      "How much configuration is needed before value appears?",
      "Can rollout happen by cell/team without disrupting production?",
    ],
  },
  {
    title: "Compliance Readiness",
    icon: ShieldCheck,
    items: [
      "Are quality events and dispositions traceable?",
      "Can data be reviewed for audits and customer requirements?",
      "Is role-based access practical for mixed operator/supervisor teams?",
    ],
  },
];

export default function ToolComparisons() {
  return (
    <>
      <SEOHead
        title="Manufacturing Tool Comparisons | JobLine.ai Resources"
        description="Compare shop-floor software approaches: JobLine.ai vs generic MES platforms vs spreadsheet workflows. Use practical criteria for handoffs, routing, quality, and rollout speed."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-6xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <GitCompare className="w-3 h-3 mr-1" />
              Resources
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Tool Comparisons for Manufacturing Teams</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Use this practical comparison to evaluate digital handoff and production tracking tools for job shops and discrete manufacturing teams.
            </p>
          </div>

          <AdPlacement format="horizontal" className="mb-8" />

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Side-by-Side Comparison</CardTitle>
              <CardDescription>
                Focused on day-to-day shop-floor execution, not only procurement checklist features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold">Criteria</th>
                      <th className="text-left p-3 font-semibold">JobLine.ai</th>
                      <th className="text-left p-3 font-semibold">Generic MES</th>
                      <th className="text-left p-3 font-semibold">Spreadsheets / Whiteboards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.criterion} className="border-b border-border/60 align-top">
                        <td className="p-3 font-medium">{row.criterion}</td>
                        <td className="p-3 text-muted-foreground">{row.jobline}</td>
                        <td className="p-3 text-muted-foreground">{row.genericMes}</td>
                        <td className="p-3 text-muted-foreground">{row.spreadsheet}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {whenToChoose.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evaluation Checklist</CardTitle>
              <CardDescription>
                Ask these questions during demos and pilot trials before selecting a platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {evaluationChecklist.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div key={group.title}>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        {group.title}
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <AdPlacement format="rectangle" className="mt-10" />
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
