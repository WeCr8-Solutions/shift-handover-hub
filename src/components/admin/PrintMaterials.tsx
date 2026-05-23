import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText } from "lucide-react";
import {
  getPricingSheetHtml,
  getFeaturesSheetHtml,
  openAndPrint,
  downloadHtml,
} from "./printables/printableSheets";

interface SheetCardProps {
  title: string;
  description: string;
  buildHtml: () => string;
  filename: string;
}

function SheetCard({ title, description, buildHtml, filename }: SheetCardProps) {
  const html = buildHtml();

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Live preview rendered in a sandboxed iframe so it can't reach the parent app */}
        <div className="border rounded-md overflow-hidden bg-muted/30">
          <iframe
            title={`${title} preview`}
            srcDoc={html}
            sandbox=""
            className="w-full h-[420px] bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => openAndPrint(html, filename.replace(/\.html$/, ""))}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadHtml(html, filename)}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download HTML
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PrintMaterials() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Print-ready, single-page <strong>US&nbsp;Letter</strong> sheets sized for 0.5" margins.
          Use <em>Print</em> to send straight to your printer, or <em>Download&nbsp;HTML</em> to
          email a print shop. Pricing always reflects the current live plan prices.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SheetCard
          title="Pricing Sheet"
          description="Single, Team, Enterprise tiers + ERP add-ons. Print one per shop visit."
          buildHtml={getPricingSheetHtml}
          filename="jobline-ai-pricing-sheet.html"
        />
        <SheetCard
          title="Features Sheet"
          description="At-a-glance: handoff, OAP, GCA, AI Planning, ERP, machine monitoring, talent."
          buildHtml={getFeaturesSheetHtml}
          filename="jobline-ai-features-sheet.html"
        />
      </div>
    </div>
  );
}
