import { Link } from "react-router-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface TutorialTermDefinition {
  title: string;
  body: string;
  href?: string;
}

const tutorialTermDefinitions: Record<string, TutorialTermDefinition> = {
  "gateway token": {
    title: "Gateway token",
    body: "A gateway token is a temporary access key used to prove you are allowed to open or use a protected local service.",
  },
  "health endpoint": {
    title: "Health endpoint",
    body: "A health endpoint is a simple URL you call to confirm the service is alive and responding before you trust the rest of the workflow.",
  },
  "openai-compatible api": {
    title: "OpenAI-compatible API",
    body: "This means the tool exposes an API that follows a familiar request and response shape many AI clients already know how to call.",
  },
  "agentic workflow": {
    title: "Agentic workflow",
    body: "An agentic workflow is a multi-step AI flow that does more than answer once. It can move through tasks, use tools, and work toward an outcome.",
  },
  "agentic system": {
    title: "Agentic system",
    body: "An agentic system is the larger setup around an AI workflow, including tools, rules, context, and the steps it takes to get work done.",
  },
  onboarding: {
    title: "Onboarding",
    body: "Onboarding is the guided first-run setup that configures the tool, checks your environment, and gets you to a usable starting point.",
  },
  sandbox: {
    title: "Sandbox",
    body: "A sandbox is a controlled environment where you can test an AI workflow with clearer boundaries before trusting it with bigger jobs.",
  },
  provider: {
    title: "Provider",
    body: "A provider is the service supplying the model or inference behind the AI behavior, such as the company or platform answering your requests.",
  },
  policy: {
    title: "Policy",
    body: "A policy is a rule or preset that controls what the system can do, what it can reach, and how much freedom it has while working.",
  },
  endpoint: {
    title: "Endpoint",
    body: "An endpoint is an address another tool or script can call to talk to the AI service.",
  },
  daemon: {
    title: "Daemon",
    body: "A daemon is a background service that keeps running after setup so the tool is available without you manually starting it every time.",
  },
  cli: {
    title: "CLI",
    body: "A CLI is a command-line interface where you type commands instead of clicking through screens.",
    href: "/learn/glossary/cli",
  },
  agent: {
    title: "Agent",
    body: "An agent is an AI workflow that can use tools and move through steps toward a goal instead of only answering once.",
    href: "/learn/glossary/agent",
  },
};

const orderedTerms = Object.keys(tutorialTermDefinitions).sort((left, right) => right.length - left.length);
const escapedTerms = orderedTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const termPattern = new RegExp(`(${escapedTerms.join("|")})`, "gi");

function renderPart(part: string, index: number) {
  const definition = tutorialTermDefinitions[part.toLowerCase()];

  if (!definition) {
    return <span key={`${part}-${index}`}>{part}</span>;
  }

  return (
    <HoverCard key={`${part}-${index}`} openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <span className="cursor-help rounded-sm underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground">
          {part}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 space-y-2">
        <p className="text-sm font-semibold text-foreground">{definition.title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{definition.body}</p>
        {definition.href && (
          <Link to={definition.href} className="text-sm font-medium text-primary hover:underline">
            Open glossary entry
          </Link>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

export function TutorialGlossaryText({ text }: { text: string }) {
  const parts = text.split(termPattern);

  return <>{parts.filter(Boolean).map((part, index) => renderPart(part, index))}</>;
}