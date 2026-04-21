import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ArrowRight, LucideIcon } from "lucide-react";

export interface HubCard {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  cta?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface HubLayoutProps {
  title: string;
  metaDescription: string;
  heading: string;
  subheading: string;
  cards: HubCard[];
}

export function HubLayout({ title, metaDescription, heading, subheading, cards }: HubLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <Header />
      <main className="container py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-foreground">{subheading}</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const content = (
              <Card className={`h-full transition-shadow ${card.disabled ? "opacity-60" : "hover:shadow-md hover:border-primary/40"}`}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    {!card.disabled && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {card.disabled ? card.disabledReason ?? card.description : card.description}
                  </CardDescription>
                </CardHeader>
                {card.cta && !card.disabled && (
                  <CardContent className="pt-0">
                    <Button variant="secondary" size="sm" className="w-full">
                      {card.cta}
                    </Button>
                  </CardContent>
                )}
              </Card>
            );

            if (card.disabled) {
              return <div key={card.title}>{content}</div>;
            }
            return (
              <Link key={card.title} to={card.to} className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
                {content}
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
