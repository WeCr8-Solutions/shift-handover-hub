import { Link } from "react-router-dom";
import { Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  className?: string;
  variant?: "default" | "compact";
}

/**
 * Cross-link block for marketing surfaces (Talent, Learn, etc.).
 * Promotes the Manufacturing Visibility 100 nomination funnel.
 */
export function MfgVisibility100Callout({ className = "", variant = "default" }: Props) {
  if (variant === "compact") {
    return (
      <Link
        to="/manufacturing-100"
        className={`group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted/50 transition ${className}`}
      >
        <Award className="h-4 w-4 text-primary" />
        <span>Manufacturing Visibility 100 — nominations open</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition" />
      </Link>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-6 md:p-8 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary/15 p-3 shrink-0">
          <Award className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">
            Know someone who should be on the Manufacturing Visibility 100?
          </h3>
          <p className="text-muted-foreground mb-4">
            Programmers, operators, shop owners, educators, and software builders pushing manufacturing forward. Nominations are free and reviewed editorially.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/manufacturing-100/nominate">
                Nominate someone <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/manufacturing-100">About the list</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MfgVisibility100Callout;
