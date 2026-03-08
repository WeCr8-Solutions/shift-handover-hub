import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Terminal } from "lucide-react";

const gcodeCommands = [
  { code: "G00", desc: "Rapid positioning — moves tool at maximum speed to target coordinates", category: "Motion" },
  { code: "G01", desc: "Linear interpolation — controlled feed-rate cutting move", category: "Motion" },
  { code: "G02", desc: "Circular interpolation clockwise (CW arc)", category: "Motion" },
  { code: "G03", desc: "Circular interpolation counter-clockwise (CCW arc)", category: "Motion" },
  { code: "G17", desc: "XY plane selection for arc and canned cycle operations", category: "Plane" },
  { code: "G20", desc: "Programming in inches", category: "Units" },
  { code: "G21", desc: "Programming in millimeters", category: "Units" },
  { code: "G28", desc: "Return to machine home position via intermediate point", category: "Reference" },
  { code: "G40", desc: "Cancel cutter compensation", category: "Compensation" },
  { code: "G41", desc: "Cutter compensation left", category: "Compensation" },
  { code: "G42", desc: "Cutter compensation right", category: "Compensation" },
  { code: "G43", desc: "Tool length compensation positive", category: "Compensation" },
  { code: "G54", desc: "Work coordinate system 1 — most commonly used fixture offset", category: "Coordinates" },
  { code: "G80", desc: "Cancel canned cycle", category: "Canned Cycles" },
  { code: "G81", desc: "Drilling cycle — simple drill, no dwell", category: "Canned Cycles" },
  { code: "G83", desc: "Peck drilling cycle — deep hole drilling with chip breaking", category: "Canned Cycles" },
  { code: "G90", desc: "Absolute positioning mode", category: "Mode" },
  { code: "G91", desc: "Incremental positioning mode", category: "Mode" },
  { code: "M00", desc: "Program stop — operator must press cycle start to continue", category: "M-Code" },
  { code: "M01", desc: "Optional stop — stops only if optional stop switch is on", category: "M-Code" },
  { code: "M03", desc: "Spindle on clockwise (CW)", category: "M-Code" },
  { code: "M04", desc: "Spindle on counter-clockwise (CCW)", category: "M-Code" },
  { code: "M05", desc: "Spindle stop", category: "M-Code" },
  { code: "M06", desc: "Tool change", category: "M-Code" },
  { code: "M08", desc: "Coolant on (flood)", category: "M-Code" },
  { code: "M09", desc: "Coolant off", category: "M-Code" },
  { code: "M30", desc: "Program end and rewind — returns to program start", category: "M-Code" },
];

const categories = [...new Set(gcodeCommands.map(c => c.category))];

export default function GCodeReference() {
  return (
    <>
      <SEOHead
        title="G-Code Reference Guide for CNC Machinists | JobLine.ai"
        description="Complete G-code command reference for CNC milling and turning. Covers G00-G99 motion codes, M-codes, cutter compensation, canned cycles, and coordinate systems."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Code className="w-3 h-3 mr-1" />
              Reference
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              G-Code Command Reference
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Essential G-code and M-code commands for CNC milling and turning operations.
              Covers ISO 6983 standard commands used by Fanuc, Haas, Mazak, and most CNC controls.
            </p>
          </div>

          

          {categories.map((category) => (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                {category}
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {gcodeCommands
                      .filter(c => c.category === category)
                      .map((cmd) => (
                        <div key={cmd.code} className="flex items-start gap-4 px-4 py-3">
                          <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm min-w-[4rem] text-center">
                            {cmd.code}
                          </code>
                          <p className="text-sm text-muted-foreground">{cmd.desc}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          

          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Need G-Code integrated into your production tracking?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                JobLine.ai connects your CNC programs directly to work orders and station dashboards,
                giving supervisors real-time visibility into which program is running on every machine.
              </p>
              <a href="/features/cnc-operator-tools" className="text-primary font-medium text-sm hover:underline">
                Learn about CNC Operator Tools →
              </a>
            </CardContent>
          </Card>
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
