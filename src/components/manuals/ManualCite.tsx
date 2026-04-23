import { FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMachineManual } from "@/hooks/useMachineManuals";
import { Skeleton } from "@/components/ui/skeleton";

interface ManualCiteProps {
  slug: string;
  page?: number;
}

export function ManualCite({ slug, page }: ManualCiteProps) {
  const { data, isLoading } = useMachineManual(slug);
  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (!data) return null;
  const href = `/manuals/${data.slug}${page ? `?page=${page}` : ""}`;
  return (
    <Card className="border-l-4 border-l-primary/60 bg-muted/30">
      <CardContent className="p-3">
        <Link to={href} className="flex items-start gap-2 hover:underline">
          <FileText className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm truncate">{data.title}</span>
              <Badge variant="secondary" className="text-xs">{data.manufacturer}</Badge>
              {page && <Badge variant="outline" className="text-xs">Page {page}</Badge>}
            </div>
            {data.machine_model && (
              <p className="text-xs text-muted-foreground">
                {data.machine_model}{data.controller_family ? ` • ${data.controller_family}` : ""}
              </p>
            )}
          </div>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </Link>
      </CardContent>
    </Card>
  );
}
