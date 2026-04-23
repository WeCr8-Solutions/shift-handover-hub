import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink, Flag } from "lucide-react";
import { useMachineManual, useManualSignedUrl } from "@/hooks/useMachineManuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ManualViewer() {
  const { slug } = useParams<{ slug: string }>();
  const { data: manual, isLoading } = useMachineManual(slug);
  const { data: signedUrl } = useManualSignedUrl(manual?.storage_path);

  if (isLoading) return <div className="container mx-auto px-4 py-8">Loading…</div>;
  if (!manual)
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Manual not found.</p>
        <Button asChild variant="link">
          <Link to="/manuals">← Back to library</Link>
        </Button>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
      <Helmet>
        <title>{manual.title} — Manuals — JobLine</title>
      </Helmet>

      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link to="/manuals">
            <ArrowLeft className="h-4 w-4 mr-1" /> All manuals
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{manual.title}</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline">{manual.manufacturer}</Badge>
              <Badge variant="secondary">{manual.manual_type}</Badge>
              {manual.machine_model && <Badge variant="outline">{manual.machine_model}</Badge>}
              {manual.controller_family && <Badge variant="outline">{manual.controller_family}</Badge>}
              {manual.edition && <Badge variant="outline">{manual.edition}</Badge>}
            </div>
          </div>
          {manual.source_url && (
            <Button asChild variant="outline" size="sm">
              <a href={manual.source_url} target="_blank" rel="noopener noreferrer">
                OEM source <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {signedUrl ? (
            <iframe
              src={signedUrl}
              title={manual.title}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">Loading PDF…</div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-3 text-xs text-muted-foreground border-t pt-2 flex items-center justify-between">
        <span>{manual.copyright_notice}</span>
        <Button variant="ghost" size="sm" asChild>
          <a href={`mailto:support@jobline.ai?subject=Report manual: ${manual.slug}`}>
            <Flag className="h-3 w-3 mr-1" /> Report
          </a>
        </Button>
      </footer>
    </div>
  );
}
