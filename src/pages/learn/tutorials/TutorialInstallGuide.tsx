import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Info, TerminalSquare } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TutorialFirstWorkflowCard, type TutorialFirstWorkflowData } from "./TutorialFirstWorkflowCard";
import { TutorialGlossaryText } from "./TutorialGlossaryText";
import { TutorialOrientationCard, type TutorialOrientationData } from "./TutorialOrientationCard";
import { TutorialPathPickerCard } from "./TutorialPathPickerCard";
import { TutorialPrerequisitesCard, type TutorialPrerequisitesData } from "./TutorialPrerequisitesCard";

interface TutorialStep {
  title: string;
  body: string;
  code?: string[];
}

interface TutorialLink {
  label: string;
  href: string;
}

export interface TutorialInstallGuideData {
  title: string;
  badge: string;
  description: string;
  canonical: string;
  keywords: string;
  searchIntent: string;
  note: string;
  pathLabel: string;
  orientation: TutorialOrientationData;
  prerequisites: TutorialPrerequisitesData;
  installMethods: Array<{ title: string; body: string; code: string[] }>;
  verification: string[];
  firstWorkflow: TutorialFirstWorkflowData;
  nextSteps: TutorialStep[];
  references: TutorialLink[];
  communityVideos?: TutorialLink[];
  creatorChannels?: TutorialLink[];
  relatedLinks: TutorialLink[];
  faq: Array<{ question: string; answer: string }>;
}

function buildJsonLd(data: TutorialInstallGuideData) {
  const pageUrl = `https://jobline.ai${data.canonical}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: data.title,
      description: data.description,
      url: pageUrl,
      about: data.badge,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}

export function TutorialInstallGuide({ data }: { data: TutorialInstallGuideData }) {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={data.title}
        description={data.description}
        canonical={data.canonical}
        keywords={data.keywords}
        jsonLd={buildJsonLd(data)}
      />
      <MarketingNav />

      <main>
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl space-y-6">
              <Badge variant="secondary">{data.badge}</Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">{data.title}</h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">{data.description}</p>
              </div>
              <div className="rounded-lg border border-border bg-card/60 p-4">
                <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">Search intent</p>
                <p className="text-sm leading-6 text-muted-foreground"><TutorialGlossaryText text={data.searchIntent} /></p>
              </div>
              <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
                  <p className="text-sm leading-6 text-amber-900"><TutorialGlossaryText text={data.note} /></p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/learn/tutorials">
                    Back to tutorial tracks
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/fundamentals">Review fundamentals</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-4 py-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <TutorialPathPickerCard currentPath={data.pathLabel} />

            <TutorialOrientationCard data={data.orientation} />

            <TutorialPrerequisitesCard data={data.prerequisites} />

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Step 3: install using one path</CardTitle>
                <CardDescription>Pick one install option below. These are alternatives, not steps you should all run in sequence.</CardDescription>
              </CardHeader>
            </Card>

            {data.installMethods.map((method, index) => (
              <Card key={method.title} className="border-border/70">
                <CardHeader>
                  <CardTitle>Option {index + 1}: {method.title}</CardTitle>
                  <CardDescription><TutorialGlossaryText text={method.body} /></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <pre className="overflow-x-auto text-xs leading-6 text-foreground"><code>{method.code.join("\n")}</code></pre>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Step 4: verify the install</CardTitle>
                <CardDescription>Use these checks to confirm the install worked before you move into onboarding or API setup.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                  {data.verification.map((item) => (
                    <li key={item} className="flex gap-2">
                      <TerminalSquare className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                      <span><TutorialGlossaryText text={item} /></span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <TutorialFirstWorkflowCard data={data.firstWorkflow} />

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Step 6: next steps</CardTitle>
                <CardDescription>These are the follow-on actions that usually matter immediately after a successful install.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.nextSteps.map((step) => (
                  <div key={step.title}>
                    <h3 className="mb-2 text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="mb-3 text-sm leading-6 text-muted-foreground"><TutorialGlossaryText text={step.body} /></p>
                    {step.code && (
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <pre className="overflow-x-auto text-xs leading-6 text-foreground"><code>{step.code.join("\n")}</code></pre>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Public reference points</CardTitle>
                <CardDescription>This page was written from public primary documentation surfaced through search, then rewritten into an original install guide.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.references.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                    <span>{link.label}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ))}
              </CardContent>
            </Card>

            {data.communityVideos && data.communityVideos.length > 0 && (
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Popular public video walkthroughs</CardTitle>
                  <CardDescription>These are outbound links to public YouTube videos surfaced through search. They are included as references only and are not copied into this guide.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.communityVideos.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                      <span>{link.label}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.creatorChannels && data.creatorChannels.length > 0 && (
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Popular AI creator channels</CardTitle>
                  <CardDescription>These are public creator channels worth watching for broader AI ideas and workflow context. They are outbound references only.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.creatorChannels.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                      <span>{link.label}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Bring this back into JobLine.ai</CardTitle>
                <CardDescription>
                  These links connect the educational path back into platform surfaces where people can keep learning, evaluate fit, or apply the workflow inside JobLine.ai.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.relatedLinks.map((link) => (
                  <Button key={link.href} asChild variant="outline" className="w-full justify-between">
                    <Link to={link.href}>
                      {link.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}