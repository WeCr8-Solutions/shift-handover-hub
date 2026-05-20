import { Lightbulb, Target, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TutorialGlossaryText } from "./TutorialGlossaryText";

export interface TutorialOrientationData {
  eli5: string;
  outcome: string;
  idealFor: string[];
  avoidIf?: string[];
}

export function TutorialOrientationCard({ data }: { data: TutorialOrientationData }) {
  return (
    <Card className="border-border/70 bg-primary/5">
      <CardHeader>
        <CardTitle>Step 1: start here like you're new</CardTitle>
        <CardDescription>Plain-language context so you know what this tutorial is doing before you touch the terminal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-border bg-background/90 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span>ELI5</span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground"><TutorialGlossaryText text={data.eli5} /></p>
        </div>

        <div className="rounded-lg border border-border bg-background/90 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-primary" />
            <span>What you will end up with</span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground"><TutorialGlossaryText text={data.outcome} /></p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/90 p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">This is a good fit if...</p>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              {data.idealFor.map((item) => (
                <li key={item}>- <TutorialGlossaryText text={item} /></li>
              ))}
            </ul>
          </div>

          {data.avoidIf && data.avoidIf.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                <TriangleAlert className="h-4 w-4" />
                <span>Pause and choose another path if...</span>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-amber-900">
                {data.avoidIf.map((item) => (
                  <li key={item}>- <TutorialGlossaryText text={item} /></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}