import { Compass, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TutorialGlossaryText } from "./TutorialGlossaryText";

const pathOptions = [
  {
    name: "OpenClaw",
    fit: "Best first stop when you want the fastest official install path to a working local OpenClaw agent.",
    benefits: [
      "Official installer is the recommended path for most users and can install Node automatically.",
      "Supports macOS, Linux, Windows, and WSL2, with onboarding launched as part of the fast path.",
      "You can verify quickly with openclaw --version, openclaw doctor, and openclaw gateway status.",
    ],
    drawbacks: [
      "The docs explicitly say WSL2 is more stable than native Windows, so Windows users may still hit a platform tradeoff.",
      "If you want everything isolated under a local prefix instead of the default npm-style flow, the official docs push you toward a different installer path.",
    ],
  },
  {
    name: "NemoClaw",
    fit: "Best when you want the official guided wizard to create a fresh sandboxed OpenClaw environment with provider and policy choices built in.",
    benefits: [
      "Official quickstart walks you through provider selection, sandbox naming, optional web search, messaging channels, and network policy presets.",
      "Provider credentials stay on the host while the agent inside the sandbox talks to inference.local.",
      "The install summary gives you both browser and terminal paths for the first agent prompt.",
    ],
    drawbacks: [
      "The official docs mark NemoClaw as alpha software and not for production use.",
      "It has materially heavier prerequisites, including Docker, more disk and memory, and a sandbox build that can take 5 to 15 minutes.",
    ],
  },
  {
    name: "Hermes",
    fit: "Best when you specifically want the official Hermes sandbox flow and its OpenAI-compatible API endpoint instead of the standard OpenClaw browser dashboard path.",
    benefits: [
      "The official Hermes quickstart gives you a nemohermes alias, guided onboarding, and an OpenAI-compatible API on port 8642.",
      "You can keep Hermes and OpenClaw side by side by choosing a separate sandbox name.",
      "It is the clearest documented path here when your consumer app needs to call an API endpoint rather than use a local browser dashboard.",
    ],
    drawbacks: [
      "The official docs call Hermes experimental, say defaults may change without notice, and do not recommend it for production use.",
      "The first Hermes build can take several minutes because the sandbox base image may need to be built.",
      "Hermes does not give you the OpenClaw browser dashboard flow, so it is a worse first experience if you expected a UI-first setup.",
    ],
  },
];

export function TutorialPathPickerCard({ currentPath }: { currentPath: string }) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Step 0: choose the right path</CardTitle>
        <CardDescription>Do not start with the wrong tutorial just because it sounded impressive in a video title.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <Compass className="h-4 w-4 text-primary" />
            <span>Fast recommendation</span>
          </div>
          Start with <strong>OpenClaw</strong> if you want the fastest proof of value. Start with <strong>NemoClaw</strong> if you want more guardrails.
          Start with <strong>Hermes</strong> only if you specifically want its <TutorialGlossaryText text="sandboxed endpoint" /> pattern and are fine with extra setup.
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {pathOptions.map((option) => {
            const isCurrent = option.name === currentPath;

            return (
              <div key={option.name} className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{option.name}</p>
                  {isCurrent && (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      You are here
                    </Badge>
                  )}
                </div>
                <p className="mb-3 text-sm leading-6 text-muted-foreground"><TutorialGlossaryText text={option.fit} /></p>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">Benefits</p>
                    <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
                      {option.benefits.map((item) => (
                        <li key={item}>+ <TutorialGlossaryText text={item} /></li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">Drawbacks</p>
                    <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
                      {option.drawbacks.map((item) => (
                        <li key={item}>- <TutorialGlossaryText text={item} /></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}