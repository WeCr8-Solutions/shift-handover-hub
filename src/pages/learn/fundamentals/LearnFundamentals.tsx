import { Link } from "react-router-dom";
import { ArrowRight, Bot, Camera, CheckCircle2, Monitor, ShieldCheck, UserCog } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const topics = [
  {
    title: "AI basics for manufacturing teams",
    description: "Start with the language, limits, and practical expectations that help people use AI without hype.",
    icon: Bot,
    summary:
      "AI is best treated like a fast first-pass assistant. It can summarize, classify, retrieve, rewrite, and explain, but it still needs good context and human judgment when the answer matters.",
    bullets: [
      "Good AI usually comes from better inputs and guardrails, not magic prompts.",
      "It helps most when people are wasting time searching, repeating, rewriting, or triaging.",
      "It should speed understanding, not remove responsibility.",
    ],
    links: [
      { label: "Read AI terms in plain language", href: "/learn/glossary" },
      { label: "See planning-assistant context", href: "/features/ai-planning-assistant" },
    ],
  },
  {
    title: "Why retrieval improves correct answers",
    description: "Show how document grounding helps AI pull from real SOPs, setup sheets, and reference material instead of guessing.",
    icon: ShieldCheck,
    summary:
      "Retrieval matters because AI is stronger when it can look at the right source material before it answers. Without that grounding, it can sound confident while still being wrong.",
    bullets: [
      "Grounded answers are usually better than generic answers.",
      "The value comes from pulling the right document at the right moment.",
      "This is one of the clearest ways to improve trust without pretending the model knows everything.",
    ],
    links: [
      { label: "See glossary terms like RAG and vector search", href: "/learn/glossary" },
      { label: "Browse handbook reference content", href: "/handbook" },
    ],
  },
  {
    title: "Why vision systems help inspection",
    description: "Explain where cameras, models, and human review work well together for repeatability, speed, and defect awareness.",
    icon: Camera,
    summary:
      "Vision systems are useful when people need repeatable visual checks at a pace or frequency that is hard to sustain manually. They are strongest when paired with clear acceptance rules and human escalation.",
    bullets: [
      "They can help catch repeated defect patterns earlier.",
      "They improve consistency when the same check happens over and over.",
      "They still need a process for edge cases, bad lighting, setup drift, and final review.",
    ],
    links: [
      { label: "Connect this to quality and inspection content", href: "/resources/quality" },
      { label: "See role-based explainers", href: "/learn/professions" },
    ],
  },
  {
    title: "Human in the loop vs human on the loop",
    description: "Teach the difference between direct approval workflows and monitored automation so teams know where human judgment belongs.",
    icon: UserCog,
    summary:
      "These two ideas sound similar, but they solve different control problems. Human in the loop means the system pauses for meaningful human review. Human on the loop means the system can continue while a person watches it, reviews exceptions, and intervenes when needed.",
    bullets: [
      "Use human in the loop when the decision is high risk, irreversible, or needs explicit approval.",
      "Use human on the loop when the system needs to move faster, but oversight, alerts, and intervention still matter.",
      "Neither model removes accountability. They just place the person at different points in the workflow.",
    ],
    links: [
      { label: "Open the glossary entries", href: "/learn/glossary" },
      { label: "See supervisor and quality role guides", href: "/learn/professions" },
    ],
  },
  {
    title: "CLI vs IDE vs web vs mobile environments",
    description: "Explain how the same AI feels different depending on whether it runs in a terminal, coding workspace, browser, or phone.",
    icon: Monitor,
    summary:
      "The model may be similar underneath, but the environment changes what the interaction is good at. CLI environments are command-heavy and fast for text operations. IDE environments add files, symbols, and tests. Web environments work through pages, forms, and shared workflows. Mobile environments trade screen space for quick updates, camera, voice, and field use.",
    benefits: [
      "CLI is excellent for precise repeatable commands and scripted work.",
      "IDE is excellent for file-aware coding, debugging, and validation.",
      "Web is excellent for shared workflows, forms, and broad accessibility.",
      "Mobile is excellent for quick field use, camera input, voice, and short updates.",
    ],
    drawbacks: [
      "CLI can be hard for beginners and usually feels weak on a phone.",
      "IDE is powerful but mainly suited to builders with a desktop workspace.",
      "Web can feel narrower than CLI or IDE for deep technical control.",
      "Mobile can get cramped when the task needs long reading, dense comparison, or careful review.",
    ],
    bullets: [
      "CLI is strongest when the user wants direct text commands, scripts, and fast keyboard-driven work.",
      "IDE is strongest when the user needs project awareness, code navigation, and tight edit-test loops.",
      "Web and mobile are strongest when the work needs accessibility, shared workflows, quick forms, photos, voice, or on-the-floor updates.",
    ],
    links: [
      { label: "Open environment in the glossary", href: "/learn/glossary" },
      { label: "See role-based guides", href: "/learn/professions" },
    ],
  },
  {
    title: "How phone-based agents work in Slack, Telegram, and Teams",
    description: "Show how chat agents can reach people on their phones without forcing every workflow into a separate app first.",
    icon: Bot,
    summary:
      "Phone-based agents work best when they meet people inside tools they already use. Slack apps can publish into channels, DMs, threads, and interactive Block Kit messages. Telegram bots can work in private chats, groups, and web apps with webhook or polling delivery. Teams bots and agents can work as personal, group, or channel bots, including notification and workflow patterns.",
    benefits: [
      "People can use the agent from messaging apps they already check on their phones.",
      "Short approvals, alerts, follow-up questions, and quick status checks fit chat well.",
      "Messaging surfaces reduce friction because the conversation already exists where the team coordinates work.",
    ],
    drawbacks: [
      "Long or technical workflows can become noisy when too much context is buried in chat history.",
      "Permissions, privacy, and channel visibility need careful design before the agent is trusted.",
      "Some surfaces have temporary or limited message behavior, such as Slack ephemeral messages that do not persist across sessions or devices.",
    ],
    bullets: [
      "Use chat agents for timely questions, alerts, and next-step actions, not for every dense workflow.",
      "Threads, buttons, and short forms help keep phone interactions structured instead of chaotic.",
      "When the task becomes too complex for a phone, the agent should hand off to a web app or deeper workspace instead of forcing everything into chat.",
    ],
    references: [
      { label: "Slack messaging docs", href: "https://docs.slack.dev/messaging/" },
      { label: "Telegram Bot API", href: "https://core.telegram.org/bots/api" },
      { label: "Microsoft Teams bot overview", href: "https://learn.microsoft.com/en-us/microsoftteams/platform/bots/what-are-bots" },
    ],
    links: [
      { label: "Open chat agent in the glossary", href: "/learn/glossary" },
      { label: "See tutorial tracks", href: "/learn/tutorials" },
    ],
  },
  {
    title: "Robotics and the 3 Ds",
    description: "Frame automation around dirty, dull, and dangerous work so teams understand where robotics adds value first.",
    icon: CheckCircle2,
    summary:
      "The 3 Ds are a practical way to explain where robotics often belongs first: dirty work people avoid, dull work that repeats constantly, and dangerous work that exposes people to unnecessary risk.",
    bullets: [
      "This helps teams talk about automation in concrete terms instead of hype terms.",
      "It keeps the conversation focused on task fit, not novelty.",
      "It also makes it easier to explain why some jobs should stay human-led.",
    ],
    links: [
      { label: "See tutorial tracks for adjacent AI tools", href: "/learn/tutorials" },
      { label: "Return to the learning hub", href: "/learn" },
    ],
  },
];

export default function LearnFundamentals() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Manufacturing AI Fundamentals | Learning Center"
        description="Public manufacturing AI fundamentals covering practical AI basics, better answers from retrieval, vision inspection, and robotics guidance."
        canonical="/learn/fundamentals"
      />
      <MarketingNav />

      <main>
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl space-y-6">
              <Badge variant="secondary">Fundamentals</Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Manufacturing AI fundamentals, explained for practical shop use.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                  This section introduces the core ideas that help teams judge where AI is useful, where it needs grounded data,
                  and how it fits into real manufacturing work without pretending every task should be automated.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/learn/glossary">
                    Browse the AI glossary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/professions">See role-based guides</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-4 px-4 py-12 md:grid-cols-2">
          {topics.map((topic) => {
            const Icon = topic.icon;

            return (
              <Card key={topic.title} className="h-full border-border/70">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">{topic.summary}</p>
                  <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                    {topic.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {(topic.benefits || topic.drawbacks) && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {topic.benefits && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Benefits</p>
                          <ul className="space-y-2 text-sm leading-6 text-emerald-950">
                            {topic.benefits.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {topic.drawbacks && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Drawbacks</p>
                          <ul className="space-y-2 text-sm leading-6 text-amber-950">
                            {topic.drawbacks.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-600" aria-hidden="true" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {topic.references && (
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">Public reference points</p>
                      <div className="flex flex-col gap-2">
                        {topic.references.map((reference) => (
                          <a
                            key={reference.href}
                            href={reference.href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline-offset-4 hover:underline"
                          >
                            {reference.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {topic.links.map((link) => (
                      <Button key={link.href} asChild variant="outline" size="sm">
                        <Link to={link.href}>
                          {link.label}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="border-t border-border bg-muted/20">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Where to go next</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Use the glossary when you need term-by-term explanations. Use the tutorial tracks when you want practical setup guidance.
                Use the role-based section when you want the same ideas translated into a clearer real-world context.
                If you are deciding how much control a person should keep, start with the human-in-the-loop and human-on-the-loop concepts before automating anything important.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild>
                  <Link to="/learn/glossary">
                    Open the glossary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/tutorials">Open tutorial tracks</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/learn/professions">Open role-based guides</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}