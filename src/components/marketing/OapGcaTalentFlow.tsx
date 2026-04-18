import { Link } from "react-router-dom";
import { GraduationCap, ShieldCheck, UserCircle2, ArrowRight, Building2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OapGcaTalentFlowProps {
  /** Optional eyebrow + heading override for different page contexts */
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  /** Hide the outer section padding when embedding inside another section */
  bare?: boolean;
  className?: string;
}

const NODES = [
  {
    icon: GraduationCap,
    label: "GCA Academy",
    sub: "Learn & train",
    desc: "Operators complete machinist coursework, safety modules, and shop-floor fundamentals through GCA Academy.",
    href: "/gca-academy",
    accent: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-700 dark:text-blue-300",
  },
  {
    icon: ShieldCheck,
    label: "OAP Certification",
    sub: "Verify on real machines",
    desc: "Employers run the Operator Acceptance Program — qualifying operators on specific machines, controls, and GD&T.",
    href: "/oap",
    accent: "from-primary/20 to-primary/5 border-primary/30 text-primary",
  },
  {
    icon: UserCircle2,
    label: "Talent Profile",
    sub: "Carry it for life",
    desc: "Every passed cert auto-syncs to the operator's portable JobLine Talent profile — verifiable by any future employer.",
    href: "/talent",
    accent: "from-green-500/20 to-green-500/5 border-green-500/30 text-green-700 dark:text-green-300",
  },
];

export function OapGcaTalentFlow({
  eyebrow = "How it connects",
  heading = "GCA Academy → OAP → Talent Profile",
  subheading = "One verified credential pipeline. Operators learn, get qualified on real machines, and carry every certificate with them — automatically.",
  bare = false,
  className,
}: OapGcaTalentFlowProps) {
  return (
    <section className={cn(!bare && "container py-16 max-w-6xl", className)}>
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge variant="outline" className="mb-3 gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> {eyebrow}
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{heading}</h2>
        <p className="mt-3 text-muted-foreground">{subheading}</p>
      </div>

      {/* Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-2 items-stretch relative">
        {NODES.map((n, i) => (
          <div key={n.label} className="flex items-stretch md:items-center gap-2">
            <Card
              className={cn(
                "flex-1 border-2 bg-gradient-to-br transition-all hover:shadow-lg",
                n.accent,
              )}
            >
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background/80 flex items-center justify-center shrink-0">
                    <n.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold leading-tight">{n.label}</p>
                    <p className="text-xs opacity-80">{n.sub}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80">{n.desc}</p>
                <Link
                  to={n.href}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
            {i < NODES.length - 1 && (
              <ArrowRight
                className="hidden md:block w-6 h-6 text-muted-foreground shrink-0"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>

      {/* Dual audience footer */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <UserCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">For operators</p>
              <p className="text-sm text-muted-foreground mt-1">
                Every GCA course you finish and every OAP cert you pass lands on your profile — no PDFs to chase, no resumes to rewrite.
              </p>
              <Button asChild variant="link" className="px-0 h-auto mt-2">
                <Link to="/talent">Build my profile <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <Building2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">For employers</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hire from a pipeline of operators already trained on GCA fundamentals and OAP-qualified on real equipment — credentials cryptographically verifiable.
              </p>
              <Button asChild variant="link" className="px-0 h-auto mt-2">
                <Link to="/talent/search">Search talent <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default OapGcaTalentFlow;
