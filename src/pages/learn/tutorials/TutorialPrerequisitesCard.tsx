import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TutorialGlossaryText } from "./TutorialGlossaryText";

export interface TutorialPrerequisitesData {
  title: string;
  description: string;
  items: string[];
}

export function TutorialPrerequisitesCard({ data }: { data: TutorialPrerequisitesData }) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Step 2: {data.title}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {data.items.map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
              <span><TutorialGlossaryText text={item} /></span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}