import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Layers } from "lucide-react";

interface TestSuiteSelectorProps {
  suites: string[];
  selectedSuite: string | null;
  onSelectSuite: (suite: string | null) => void;
}

export function TestSuiteSelector({
  suites,
  selectedSuite,
  onSelectSuite,
}: TestSuiteSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Test Suites</CardTitle>
            <CardDescription>Select a suite to run specific tests</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant={selectedSuite === null ? "default" : "outline"}
          className="w-full justify-start gap-2"
          onClick={() => onSelectSuite(null)}
        >
          <CheckCircle2 className={cn(
            "w-4 h-4",
            selectedSuite === null ? "opacity-100" : "opacity-0"
          )} />
          All Suites
          <Badge variant="secondary" className="ml-auto">
            {suites.length}
          </Badge>
        </Button>
        
        {suites.map((suite) => (
          <Button
            key={suite}
            variant={selectedSuite === suite ? "default" : "outline"}
            className="w-full justify-start gap-2"
            onClick={() => onSelectSuite(suite)}
          >
            <CheckCircle2 className={cn(
              "w-4 h-4",
              selectedSuite === suite ? "opacity-100" : "opacity-0"
            )} />
            {suite}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
