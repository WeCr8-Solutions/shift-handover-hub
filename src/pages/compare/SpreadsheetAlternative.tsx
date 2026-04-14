import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, CheckCircle2, XCircle, Zap, FileSpreadsheet, AlertTriangle, Users, BarChart3 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { LeadCaptureBar } from "@/components/marketing/LeadCaptureBar";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { MockQueueBoard } from "@/components/marketing/MockAppPreviews";

const painPoints = [
  { icon: FileSpreadsheet, title: "One File, One Source of Truth — That's Never Quite Right", desc: "Shared Excel job logs go stale the moment someone forgets to update them. You're always working with yesterday's data — at best." },
  { icon: AlertTriangle, title: "No Real-Time Visibility", desc: "Spreadsheets don't update themselves. When a job moves, a machine goes down, or a shift ends, the spreadsheet stays frozen until someone gets around to it." },
  { icon: Users, title: "Not Built for Multiple Simultaneous Users", desc: "Shared spreadsheets corrupt, overwrite each other's edits, and lock up at the worst moments. Three operators can't update the same file at the same time." },
  { icon: BarChart3, title: "Zero Analytics on What Actually Happened", desc: "You can track what's happening in a spreadsheet — but you can't automatically calculate shift throughput, scrap rates, machine utilization, or on-time delivery." },
];

const comparison = [
  { feature: "Real-time updates by multiple users", excel: "No — file conflicts", jobline: "Yes — live, simultaneous" },
  { feature: "Mobile-friendly for shop floor", excel: "No", jobline: "Yes — on any device" },
  { feature: "Shift handoff system", excel: "Manual email or verbal", jobline: "Structured digital forms" },
  { feature: "Machine status tracking", excel: "Manual entry", jobline: "Operator-driven, live" },
  { feature: "Automatic analytics", excel: "Manual formulas break", jobline: "Built-in dashboards" },
  { feature: "Photo attachments for issues", excel: "No", jobline: "Yes" },
  { feature: "Audit trail of changes", excel: "No", jobline: "Full history" },
  { feature: "Wall display / kiosk mode", excel: "No", jobline: "Yes" },
  { feature: "Works without a computer scientist", excel: "No — constant maintenance", jobline: "Yes — operators use it themselves" },
];

const faqs = [
  { q: "We've been using Excel for years. Why change now?", a: "If it's working perfectly, don't change it. But most shops using spreadsheets have a list of workarounds — the second file for the real status, the whiteboard that contradicts the spreadsheet, the morning meeting to reconcile last night's updates. JobLine.ai eliminates all of that." },
  { q: "How hard is the switch?", a: "It's not a migration. You build your digital shop fresh — add machines, add operators, add open jobs. Most shops are running live the same day. You can keep the spreadsheet as backup for the first week if it eases the transition." },
  { q: "What about cost? Excel is free.", a: "Excel has a hidden cost — the time your team spends maintaining it and the decisions made with bad data. Most shops find JobLine.ai pays for itself in the first month through avoided rework and better shift coordination." },
];

const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "name": "Replace Excel for Manufacturing — JobLine.ai", "url": "https://jobline.ai/compare/spreadsheet-alternative" };

export default function SpreadsheetAlternative() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Replace Excel for Manufacturing — Real-Time Shop Floor Software"
        description="Stop managing your shop floor with spreadsheets. JobLine.ai replaces shared Excel job logs with real-time work order tracking, shift handoffs, and live machine dashboards — updated by operators, not accountants."
        keywords="replace Excel manufacturing, spreadsheet alternative manufacturing, shop floor Excel replacement, stop using spreadsheets job shop, Excel job shop alternative, manufacturing software replace Excel, job tracking replace spreadsheet, shop management without Excel"
        canonical="/compare/spreadsheet-alternative"
        jsonLd={jsonLd}
      />
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <FileSpreadsheet className="w-4 h-4" />
              Replacing Your Job Shop Spreadsheet?
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your Shop Floor Deserves Better{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                Than a Spreadsheet
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              If your shop runs on shared Excel files and whiteboards, you're managing with data that's always slightly wrong. JobLine.ai gives operators a tool they actually update in real time — so your visibility is always accurate.
            </p>
            <div className="flex flex-wrap gap-4 mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Try JobLine.ai Free <ArrowRight className="w-5 h-5" /></Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="gap-2"><Zap className="w-5 h-5" /> Book a Demo</Button>
            </div>
            <MockQueueBoard />
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-4" />
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Why Spreadsheets Break Down on the Shop Floor</h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-16">
              {painPoints.map((p, i) => (
                <div key={i} className="p-6 rounded-xl bg-card border border-border">
                  <p.icon className="w-7 h-7 text-destructive mb-3" />
                  <h3 className="font-semibold mb-2">{p.title}</h3>
                  <p className="text-muted-foreground text-sm">{p.desc}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-6 text-center">Spreadsheet vs. JobLine.ai</h2>
            <div className="overflow-x-auto mb-16">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Excel / Spreadsheet</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">JobLine.ai</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-muted-foreground"><XCircle className="w-4 h-4 text-destructive flex-shrink-0" />{row.excel}</span></td>
                      <td className="py-3 px-4"><span className="flex items-center gap-2 text-status-ok"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{row.jobline}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LeadCaptureBar sourcePage="spreadsheet-alternative" className="mb-16" />
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4 mb-16">
              {faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/30">
                  <h3 className="font-medium mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
            <div className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <h2 className="text-2xl font-bold mb-3">Replace your spreadsheet today</h2>
              <p className="text-muted-foreground mb-6">Free trial — set up in under an hour, no credit card needed.</p>
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">Get Started Free <ArrowRight className="w-5 h-5" /></Button>
            </div>
          </div>
        </section>
        <AdPlacement format="horizontal" className="py-6" />
      </main>
      <MarketingFooter />
      <LeadCaptureModal />
    </div>
  );
}
