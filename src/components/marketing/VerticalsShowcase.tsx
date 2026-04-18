import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Cog,
  Hammer,
  Wrench,
  Flame,
  HardHat,
  Zap,
  Droplets,
  Wind,
  ArrowRight,
} from "lucide-react";

interface Vertical {
  slug: string;
  name: string;
  icon: typeof Cog;
  blurb: string;
  sampleRoles: string[];
  certCode: string; // shows up inside cert IDs, e.g. OAP-CAB-XXXXXX-2026
}

const VERTICALS: Vertical[] = [
  {
    slug: "machining",
    name: "Machining & CNC",
    icon: Cog,
    blurb: "Programmers, machinists, toolmakers, grinders, EDM, swiss & 5-axis.",
    sampleRoles: ["CNC Programmer", "5-Axis Machinist", "Toolmaker"],
    certCode: "OAP-XXXXXX-YYYY",
  },
  {
    slug: "cabinetry",
    name: "Cabinetry & Woodworking",
    icon: Hammer,
    blurb: "Cabinetmakers, CNC router operators, finishers, installers.",
    sampleRoles: ["Master Cabinetmaker", "CNC Router Op", "Wood Finisher"],
    certCode: "OAP-CAB-XXXXXX-YYYY",
  },
  {
    slug: "automotive",
    name: "Automotive",
    icon: Wrench,
    blurb: "Lube techs through ASE Master, EV/hybrid, diesel, transmission, body & paint.",
    sampleRoles: ["Master Mechanic", "EV/Hybrid Tech", "Diesel Tech"],
    certCode: "OAP-AUTO-XXXXXX-YYYY",
  },
  {
    slug: "welding",
    name: "Welding",
    icon: Flame,
    blurb: "AWS-certified welders, pipe welders, CWI inspectors, foremen.",
    sampleRoles: ["AWS Cert Welder", "Pipe Welder (6G)", "CWI Inspector"],
    certCode: "OAP-WELD-XXXXXX-YYYY",
  },
  {
    slug: "construction",
    name: "Construction & Carpentry",
    icon: HardHat,
    blurb: "Apprentice through master carpenter, foremen, superintendents.",
    sampleRoles: ["Journeyman Carpenter", "Site Foreman", "Superintendent"],
    certCode: "OAP-CON-XXXXXX-YYYY",
  },
  {
    slug: "electrical",
    name: "Electrical",
    icon: Zap,
    blurb: "Apprentice → master electrician, industrial PLC, low-voltage techs.",
    sampleRoles: ["Master Electrician", "Industrial Electrician", "Low-Voltage Tech"],
    certCode: "OAP-ELEC-XXXXXX-YYYY",
  },
  {
    slug: "plumbing",
    name: "Plumbing & Pipefitting",
    icon: Droplets,
    blurb: "Journeyman & master plumbers, pipefitters, gas fitters.",
    sampleRoles: ["Master Plumber", "Pipefitter", "Gas Fitter"],
    certCode: "OAP-PLM-XXXXXX-YYYY",
  },
  {
    slug: "hvac",
    name: "HVAC & Refrigeration",
    icon: Wind,
    blurb: "Installers, service techs, controls, commercial refrigeration.",
    sampleRoles: ["Master HVAC Tech", "Controls Tech", "Refrigeration Tech"],
    certCode: "OAP-HVAC-XXXXXX-YYYY",
  },
];

interface Props {
  bare?: boolean;
  heading?: string;
  subheading?: string;
}

export function VerticalsShowcase({
  bare = false,
  heading = "One credential platform. Every skilled trade.",
  subheading = "OAP started with machining and now issues portable, verifiable credentials across the trades. Every vertical lives on the same verified-cert + Talent Profile rails.",
}: Props) {
  const inner = (
    <div className="space-y-10">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <Badge variant="outline" className="uppercase tracking-wider">Multi-vertical OAP</Badge>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{heading}</h2>
        <p className="text-muted-foreground text-lg">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VERTICALS.map((v) => {
          const Icon = v.icon;
          return (
            <Card key={v.slug} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold leading-tight">{v.name}</div>
                </div>
                <p className="text-sm text-muted-foreground">{v.blurb}</p>
                <div className="flex flex-wrap gap-1">
                  {v.sampleRoles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground pt-1 border-t">
                  {v.certCode}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button asChild size="lg">
          <Link to="/oap">
            Explore OAP for your trade <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/talent">Browse the talent directory</Link>
        </Button>
      </div>
    </div>
  );

  if (bare) return inner;
  return <section className="py-16 md:py-20 bg-muted/30"><div className="container mx-auto px-4">{inner}</div></section>;
}

export default VerticalsShowcase;
