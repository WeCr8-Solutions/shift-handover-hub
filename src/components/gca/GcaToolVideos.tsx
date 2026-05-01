import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Ruler, Gauge, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainingMedia } from "@/components/training/TrainingMedia";

interface ToolRow {
  id: string;
  slug: string;
  name: string;
}

interface Props {
  /** inspection_tools.slug values */
  slugs: string[];
}

/**
 * Renders embedded YouTube tutorials for the inspection tools that back a
 * GCA Measurement Tools test. Stays on the test page so learners don't lose
 * progress or in-flight answers.
 */
export function GcaToolVideos({ slugs }: Props) {
  const cleanSlugs = slugs.filter(Boolean);

  const { data: tools, isLoading } = useQuery({
    queryKey: ["gca-tool-videos", cleanSlugs],
    enabled: cleanSlugs.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_tools")
        .select("id, slug, name")
        .in("slug", cleanSlugs)
        .eq("is_canonical", true);
      if (error) throw error;
      // Preserve the order the caller passed in
      const order = new Map(cleanSlugs.map((s, i) => [s, i]));
      return (data ?? [])
        .slice()
        .sort(
          (a, b) =>
            (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999),
        ) as ToolRow[];
    },
  });

  if (cleanSlugs.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" aria-hidden />
          Watch the tool in action
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tutorials play right here — your test progress stays put.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="aspect-video w-full rounded-md" />
        ) : !tools || tools.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Tutorial videos coming soon for this tool.
          </p>
        ) : tools.length === 1 ? (
          <TrainingMedia
            entityType="inspection_tool"
            entityId={tools[0].id}
            emptyHint="Tutorial coming soon."
          />
        ) : (
          <Tabs defaultValue={tools[0].id}>
            <TabsList className="flex flex-wrap h-auto">
              {tools.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {tools.map((t) => (
              <TabsContent key={t.id} value={t.id} className="mt-3">
                <TrainingMedia
                  entityType="inspection_tool"
                  entityId={t.id}
                  emptyHint={`Tutorial for ${t.name} coming soon.`}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="flex flex-wrap gap-2 pt-1 border-t">
          <Button asChild size="sm" variant="outline" className="gap-1">
            <Link to="/resources/measuring-tools" target="_blank" rel="noopener">
              <Ruler className="w-3.5 h-3.5" /> Full tool library
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1">
            <Link to="/oap/proficiency" target="_blank" rel="noopener">
              <Gauge className="w-3.5 h-3.5" /> Mentor-graded proficiency test
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
