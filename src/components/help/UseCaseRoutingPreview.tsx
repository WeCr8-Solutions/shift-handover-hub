import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CheckCircle2, Clock, ArrowRight } from "lucide-react";

interface RoutingStep {
  name: string;
  station: string;
  status: "completed" | "in-progress" | "pending";
  notes?: string;
}

interface UseCaseRouting {
  label: string;
  description: string;
  steps: RoutingStep[];
}

const sampleRoutings: Record<string, UseCaseRouting> = {
  "automotive-repair-shop": {
    label: "Brake Repair — 2018 Toyota Camry",
    description: "Sample routing for a front brake pad and rotor replacement",
    steps: [
      { name: "Customer Intake", station: "Service Desk", status: "completed", notes: "Customer complaint: squealing when braking. VIN logged." },
      { name: "Diagnostics", station: "Bay 1", status: "completed", notes: "Rotors at 22mm (min 25mm). Pads at 1mm. Recommend full front brake service." },
      { name: "Parts Order", station: "Parts Counter", status: "completed", notes: "Rotors x2, ceramic pads, hardware kit. ETA: in stock." },
      { name: "Repair", station: "Bay 3", status: "in-progress", notes: "Driver side complete. Passenger side in progress. Bleeding lines next." },
      { name: "Quality Check", station: "Bay 3", status: "pending", notes: "Test drive required — verify no noise, straight tracking, firm pedal." },
      { name: "Customer Pickup", station: "Service Desk", status: "pending" },
    ],
  },
  "oil-change-quick-lube": {
    label: "Full-Service Oil Change — 2021 Honda CR-V",
    description: "Standard service routing with multi-point inspection",
    steps: [
      { name: "Drive-In & Check-In", station: "Lane 1", status: "completed", notes: "Mileage: 47,230. Customer requests synthetic blend." },
      { name: "Drain & Fill", station: "Pit 1", status: "completed", notes: "Drained 4.2 qt dark oil. Filled 4.4 qt 0W-20 synthetic blend." },
      { name: "Filter Replacement", station: "Pit 1", status: "completed", notes: "OEM filter installed. Torqued to spec." },
      { name: "Fluid Top-Off", station: "Pit 1", status: "completed", notes: "Coolant OK. Brake fluid slightly dark — noted for upsell." },
      { name: "Multi-Point Inspection", station: "Lane 1", status: "in-progress", notes: "Wipers streaking — recommend replacement. Cabin filter dirty." },
      { name: "Drive-Out & Payment", station: "Cashier", status: "pending" },
    ],
  },
  "fleet-maintenance": {
    label: "PM-B Service — Unit #4472 (Freightliner Cascadia)",
    description: "25,000-mile preventive maintenance routing",
    steps: [
      { name: "Oil & Filter", station: "Bay 5", status: "completed", notes: "15W-40, 10 gal. New Donaldson filter. Oil sample sent to lab." },
      { name: "Brake Inspection", station: "Bay 5", status: "completed", notes: "Front pads 60%, rear drums 50%. Adjusted rear brakes." },
      { name: "Tire Inspection", station: "Bay 5", status: "completed", notes: "Steer tires 8/32. Drives 10/32. Alignment check — within spec." },
      { name: "Electrical Check", station: "Bay 5", status: "in-progress", notes: "Checking alternator output and battery load test." },
      { name: "DOT Compliance", station: "Bay 5", status: "pending", notes: "Lights, reflectors, fire extinguisher, triangle kit." },
      { name: "Road Test", station: "Yard", status: "pending" },
    ],
  },
  "general-fabrication": {
    label: "Custom Steel Frame Assembly — PO #2847",
    description: "Multi-step fabrication with welding and paint",
    steps: [
      { name: "Cut", station: "Saw Station", status: "completed", notes: "2x4 tubing cut per drawing Rev C. 24 pieces total." },
      { name: "Fit-Up", station: "Weld Table 1", status: "completed", notes: "Frame tacked per drawing. Square checked on all corners." },
      { name: "Weld", station: "Weld Table 1", status: "in-progress", notes: "E7018, preheat 300°F per WPS-042. Left gussets remaining." },
      { name: "Grind & Finish", station: "Finishing Area", status: "pending" },
      { name: "Paint", station: "Paint Booth", status: "pending", notes: "Safety yellow per customer spec." },
      { name: "Ship", station: "Shipping Dock", status: "pending" },
    ],
  },
  "cnc-machine-shop": {
    label: "Aerospace Bracket — WO-4472, Part #BR-7701",
    description: "5-axis machining with inspection checkpoints",
    steps: [
      { name: "Op 10 — Saw", station: "Bandsaw-01", status: "completed", notes: "Cut 6061-T6 billet to 4.5\" x 3.0\" x 1.25\". Heat lot #AL-2847." },
      { name: "Op 20 — Mill Rough", station: "VMC-02", status: "completed", notes: "Program O4472-R. Roughed profile ±0.010\". Tool 3 offset Z -0.0003\"." },
      { name: "Op 30 — Mill Finish", station: "VMC-02", status: "in-progress", notes: "Program O4472-F. Running at 847 of 1000. 125 Ra surface finish target." },
      { name: "Op 40 — Deburr", station: "Bench-01", status: "pending" },
      { name: "Op 50 — Inspect", station: "QC Lab", status: "pending", notes: "First article + in-process dims per FAI report." },
      { name: "Op 60 — Ship", station: "Shipping", status: "pending" },
    ],
  },
  "body-shop-collision": {
    label: "Collision Repair — 2022 Ford F-150, Claim #INS-9923",
    description: "Front-end collision with frame pull and paint",
    steps: [
      { name: "Estimate & Teardown", station: "Estimating Bay", status: "completed", notes: "Supplement #1: hidden radiator support damage found. Photos uploaded." },
      { name: "Parts Ordering", station: "Parts Desk", status: "completed", notes: "Bumper, fender, header panel, radiator support. All OEM per insurance." },
      { name: "Body Repair", station: "Frame Rack", status: "completed", notes: "Frame pulled to spec. New radiator support welded. Measurements saved." },
      { name: "Prep & Prime", station: "Prep Stall 2", status: "in-progress", notes: "Filler blocked to 180 grit. Priming today." },
      { name: "Paint", station: "Booth 1", status: "pending", notes: "Color: Oxford White (YZ). Blend into door." },
      { name: "Reassembly & Detail", station: "Reassembly Bay", status: "pending" },
    ],
  },
};

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500", label: "Done" },
  "in-progress": { icon: Clock, color: "text-amber-500", bg: "bg-amber-500", label: "Active" },
  pending: { icon: ChevronRight, color: "text-muted-foreground", bg: "bg-muted-foreground/40", label: "Pending" },
};

interface Props {
  slug: string;
}

export function UseCaseRoutingPreview({ slug }: Props) {
  const [expanded, setExpanded] = useState(false);
  const routing = sampleRoutings[slug];

  if (!routing) return null;

  return (
    <div className="mt-8 border border-border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{routing.label}</p>
          <p className="text-xs text-muted-foreground">{routing.description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide Routing" : "See Sample Routing"}
        </Button>
      </div>

      {expanded && (
        <div className="p-4 space-y-0">
          {routing.steps.map((step, i) => {
            const config = statusConfig[step.status];
            const Icon = config.icon;
            const isLast = i === routing.steps.length - 1;

            return (
              <div key={i} className="flex gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.status === "completed" ? "bg-emerald-500/10" :
                    step.status === "in-progress" ? "bg-amber-500/10" : "bg-muted"
                  }`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[24px] ${
                      step.status === "completed" ? "bg-emerald-500/30" : "bg-border"
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-4 flex-1 min-w-0 ${isLast ? "" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{step.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{step.station}</Badge>
                    <Badge variant={step.status === "in-progress" ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                      {config.label}
                    </Badge>
                  </div>
                  {step.notes && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.notes}</p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-3 border-t border-border mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>This is a sample routing — your shop's routing will match your actual workflow and stations.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
