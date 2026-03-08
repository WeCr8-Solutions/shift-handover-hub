import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { BookA, Search } from "lucide-react";

const glossaryTerms = [
  { term: "AS9100", definition: "Quality management system standard for the aerospace industry, based on ISO 9001 with additional aerospace-specific requirements." },
  { term: "Cycle Time", definition: "The total time from the beginning to the end of a process, as defined by the customer's demand rate. In CNC, it's the time to complete one part." },
  { term: "DNC (Direct Numerical Control)", definition: "A system that connects CNC machines to a central computer for program transfer, eliminating manual program loading." },
  { term: "Downtime", definition: "Any period when a machine or process is not producing. Can be planned (maintenance) or unplanned (breakdowns)." },
  { term: "ERP (Enterprise Resource Planning)", definition: "Integrated software system that manages business processes including inventory, scheduling, financials, and production." },
  { term: "First Article Inspection (FAI)", definition: "A complete, independent inspection of the first production part to verify that the process produces a conforming product." },
  { term: "Fixture", definition: "A work-holding device that locates and clamps a workpiece during machining, ensuring consistent positioning and repeatability." },
  { term: "G-Code", definition: "The programming language used to control CNC machines. Based on ISO 6983, it specifies tool movements, speeds, and operations." },
  { term: "ISO 9001", definition: "International standard for quality management systems, providing a framework for consistent quality in products and services." },
  { term: "Job Shop", definition: "A manufacturing facility that produces small batches of custom parts, typically with high variety and low volume." },
  { term: "Kanban", definition: "A visual scheduling system for lean manufacturing that uses cards or signals to trigger production based on actual demand." },
  { term: "Lead Time", definition: "The total time from customer order to delivery, including queue time, processing time, and shipping." },
  { term: "MES (Manufacturing Execution System)", definition: "Software that monitors, tracks, and controls manufacturing operations on the shop floor in real-time." },
  { term: "NCR (Non-Conformance Report)", definition: "A document recording a product or process that doesn't meet specifications, triggering investigation and corrective action." },
  { term: "OEE (Overall Equipment Effectiveness)", definition: "A metric measuring manufacturing productivity: Availability × Performance × Quality. World-class OEE is 85%+." },
  { term: "Part Traveler", definition: "A document that accompanies a part through production, recording each operation, inspection, and status change." },
  { term: "Routing", definition: "The sequence of operations and work centers a part must pass through during manufacturing." },
  { term: "Setup Time", definition: "The time required to prepare a machine for a new job, including tool changes, fixture installation, and program loading." },
  { term: "Shift Handoff", definition: "The process of transferring information between outgoing and incoming operators at shift change, critical for production continuity." },
  { term: "SPC (Statistical Process Control)", definition: "Method using statistical techniques to monitor and control a process, ensuring it operates at its full potential." },
  { term: "Takt Time", definition: "The rate at which a finished product must be completed to meet customer demand. Calculated as available time / customer demand." },
  { term: "Tool Life", definition: "The expected duration a cutting tool can operate before replacement, measured in minutes, parts, or linear distance." },
  { term: "Traveler", definition: "See Part Traveler. A production tracking document that follows the workpiece through each manufacturing step." },
  { term: "WIP (Work in Process)", definition: "Partially completed goods still in the production process. High WIP indicates bottlenecks or inefficiencies." },
  { term: "Work Center", definition: "A grouping of machines or workstations that perform similar operations, used for scheduling and capacity planning." },
  { term: "Work Order", definition: "An authorization to manufacture a specific quantity of parts, containing routing, materials, and specifications." },
];

export default function IndustryGlossary() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return glossaryTerms;
    const q = search.toLowerCase();
    return glossaryTerms.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    );
  }, [search]);

  const letters = useMemo(() => {
    const set = new Set(filtered.map((t) => t.term[0].toUpperCase()));
    return [...set].sort();
  }, [filtered]);

  return (
    <>
      <SEOHead
        title="Manufacturing & CNC Glossary | JobLine.ai Resources"
        description="Comprehensive glossary of manufacturing terms, CNC machining definitions, quality management concepts, and production planning terminology."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">
              <BookA className="w-3 h-3 mr-1" />
              Glossary
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Manufacturing & CNC Glossary
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Key terms and definitions for manufacturing, CNC machining, quality management, and production planning.
            </p>
          </div>

          <div className="relative mb-8 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          

          {letters.map((letter) => (
            <div key={letter} className="mb-6">
              <h2 className="text-2xl font-bold text-primary mb-3 border-b border-border pb-1">{letter}</h2>
              <dl className="space-y-3">
                {filtered
                  .filter((t) => t.term[0].toUpperCase() === letter)
                  .map((t) => (
                    <div key={t.term} className="pl-4">
                      <dt className="font-semibold text-foreground">{t.term}</dt>
                      <dd className="text-sm text-muted-foreground mt-0.5">{t.definition}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No terms found matching "{search}"
            </p>
          )}

          
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
