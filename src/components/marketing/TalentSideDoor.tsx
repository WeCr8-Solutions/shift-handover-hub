import { Link } from "react-router-dom";
import { ArrowRight, Users, Sparkles, Wrench, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Dual-pillar "side door" CTA: shops landing for expeditor/downtime/visibility
 * discover the talent network without us advertising "find jobs".
 *
 * Left pillar  → Find Skilled Manufacturing Talent (shop owners / supervisors)
 * Right pillar → Showcase Your Skills (operators / programmers / inspectors)
 *
 * SEO intent: keep h2 keywords specific ("manufacturing talent", "CNC operator
 * profile") so the section indexes for both audiences.
 */
export function TalentSideDoor({ className }: { className?: string }) {
  return (
    <section
      className={cn("container my-12 sm:my-16", className)}
      aria-label="Manufacturing talent network"
    >
      <div className="mx-auto max-w-3xl text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <Users className="h-3.5 w-3.5" aria-hidden /> Talent network
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Work, machines, and skilled talent — one platform
        </h2>
        <p className="mt-2 text-muted-foreground">
          JobLine.ai connects shop-floor execution to the people who run it.
          Free profiles for operators. Verified, searchable talent for shops.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Shop owner pillar */}
        <article className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2.5 text-primary">
              <Wrench className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                Find Skilled Manufacturing Talent
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search CNC operators, programmers, and inspectors by machine,
                control (Haas / Fanuc / Siemens / Mazatrol), software
                (Mastercam, Fusion, NX, Hypermill), and certifications.
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <li>• Operators</li>
                <li>• Programmers</li>
                <li>• Inspectors</li>
                <li>• 5-axis, mill-turn, FAI</li>
              </ul>
              <Button asChild size="sm" className="mt-4 gap-1">
                <Link to="/talent">
                  Browse talent <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </article>

        {/* Operator pillar */}
        <article className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 transition-colors hover:border-primary/40">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2.5 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Free forever for operators
              </div>
              <h3 className="mt-1 text-lg font-semibold">Showcase Your Skills</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Build a public manufacturing profile — resume, machines,
                controls, software, certifications, OAP &amp; GCA badges. Your
                own shareable URL like{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  jobline.ai/talent/your-name
                </code>
                .
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {[
                  "Haas VF2",
                  "Fanuc",
                  "Mastercam",
                  "5-Axis",
                  "GD&T",
                  "FAI",
                ].map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    <Cpu className="mr-1 inline h-2.5 w-2.5" aria-hidden />
                    {tag}
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" className="mt-4 gap-1">
                <Link to="/auth?intent=talent&mode=signup">
                  Claim your profile <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default TalentSideDoor;
