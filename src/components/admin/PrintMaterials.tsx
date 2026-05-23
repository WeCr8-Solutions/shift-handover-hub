import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, FileDown } from "lucide-react";
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
  /** Base filename without extension — matches the static PDF in /public/print/ */
  slug: string;
}

function SheetCard({ title, description, buildHtml, slug }: SheetCardProps) {
  const html = buildHtml();
  const pdfUrl = `/print/${slug}.pdf`;

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
        <div className="border rounded-md overflow-hidden bg-muted/30">
          <iframe
            title={`${title} preview`}
            srcDoc={html}
            sandbox=""
            className="w-full h-[420px] bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gap-1.5">
            <a href={pdfUrl} download={`${slug}.pdf`}>
              <FileDown className="w-4 h-4" />
              Download PDF
            </a>
          </Button>
          <Button asChild variant="secondary" className="gap-1.5">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="w-4 h-4" />
              Open PDF
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => openAndPrint(html, slug)}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            variant="ghost"
            onClick={() => downloadHtml(html, `${slug}.html`)}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            HTML
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
          <strong> Download PDF</strong> gives you a pixel-perfect file ready for any print
          shop — fonts embedded, no overflow. Use <em>Print</em> for the live HTML version
          or <em>HTML</em> to email the source. Regenerate PDFs after edits with{" "}
          <code className="text-xs">bun scripts/generate-print-pdfs.mjs</code>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SheetCard
          title="Pricing Sheet"
          description="Single, Team, Enterprise tiers + ERP add-ons. Print one per shop visit."
          buildHtml={getPricingSheetHtml}
          slug="jobline-ai-pricing-sheet"
        />
        <SheetCard
          title="Features Sheet"
          description="At-a-glance: handoff, OAP, GCA, AI Planning, ERP, machine monitoring, talent."
          buildHtml={getFeaturesSheetHtml}
          slug="jobline-ai-features-sheet"
        />
      </div>
    </div>
  );
}
