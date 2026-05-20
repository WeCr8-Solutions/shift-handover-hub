import { CheckCircle2, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TutorialGlossaryText } from "./TutorialGlossaryText";

export interface TutorialFirstWorkflowData {
  title: string;
  scenario: string;
  whyItMatters: string;
  steps: string[];
  starterPrompt: string;
  successChecks: string[];
}

export function TutorialFirstWorkflowCard({ data }: { data: TutorialFirstWorkflowData }) {
  return (
    <Card className="border-border/70 bg-primary/5">
      <CardHeader>
        <CardTitle>Step 5: your first agentic workflow</CardTitle>
        <CardDescription>Do one useful workflow immediately so the install turns into value instead of shelfware.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="mb-2 text-base font-semibold text-foreground">{data.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground"><TutorialGlossaryText text={data.scenario} /></p>
        </div>

        <div className="rounded-lg border border-border bg-background/90 p-4 text-sm leading-6 text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">Why this matters</p>
          <p><TutorialGlossaryText text={data.whyItMatters} /></p>
        </div>

        <div className="rounded-lg border border-border bg-background/90 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <PlayCircle className="h-4 w-4 text-primary" />
            <span>Run it in this order</span>
          </div>
          <ol className="space-y-2 text-sm leading-6 text-muted-foreground">
            {data.steps.map((step) => (
              <li key={step}><TutorialGlossaryText text={step} /></li>
            ))}
          </ol>
        </div>

        <div className="rounded-lg border border-border bg-background/90 p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Starter prompt</p>
          <p className="text-sm leading-6 text-muted-foreground"><TutorialGlossaryText text={data.starterPrompt} /></p>
        </div>

        <div className="rounded-lg border border-border bg-background/90 p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">You know it worked when...</p>
          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
            {data.successChecks.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                <span><TutorialGlossaryText text={item} /></span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}