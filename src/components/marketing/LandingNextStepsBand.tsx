import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Cpu, DollarSign, MessagesSquare } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * "Next steps" CTA band rendered just below the hero on the marketing landing.
 *
 * Why this exists:
 *   Analytics showed page_views/session collapsed from 6.6K → 1.9K month-over-month
 *   while active users grew 58%. Visitors land on `/` and bounce because the only
 *   nearby CTA is "Sign up / Pricing". This band gives every visitor four obvious
 *   places to go *deeper* into the site (Resources, Industry 4.0 content, Pricing,
 *   Demo) so pages/session recovers.
 *
 * Each click fires `landing_next_step_click` with a `destination` param so we can
 * measure which lane is doing the lifting.
 */
const CARDS = [
  {
    icon: BookOpen,
    title: "Manufacturing Resources",
    description: "Guides, G-code reference, glossary, and ERP selection.",
    destination: "resources",
    href: "/resources",
  },
  {
    icon: Cpu,
    title: "Industry 4.0 & MES",
    description: "How modern shops connect machines, routing, and quality.",
    destination: "industry_4_0",
    href: "/resources/mes-vs-erp",
  },
  {
    icon: DollarSign,
    title: "See Pricing",
    description: "Free forever for small shops — Team and Enterprise tiers.",
    destination: "pricing",
    href: "/pricing",
  },
  {
    icon: MessagesSquare,
    title: "Book a Demo",
    description: "30-minute walkthrough tailored to your operation.",
    destination: "demo",
    href: "/demo",
  },
] as const;

export function LandingNextStepsBand() {
  const navigate = useNavigate();

  const go = (destination: string, href: string) => {
    trackEvent("landing_next_step_click", { destination, source: "next_steps_band" });
    navigate(href);
  };

  return (
    <section className="py-10 sm:py-14 border-y border-border bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.destination}
                onClick={() => go(card.destination, card.href)}
                className="group text-left p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex flex-col gap-2 min-h-[140px]"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold leading-tight">{card.title}</h3>
                <p className="text-xs text-muted-foreground leading-snug flex-1">{card.description}</p>
                <span className="text-xs font-medium text-primary flex items-center gap-1 mt-1">
                  Open
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
