import { Badge } from "@/components/ui/badge";
import { releaseInfo } from "@/generated/release";

export function ReleaseBadge() {
  const label = `Build ${releaseInfo.shortSha}`;
  const details = `${releaseInfo.releaseStamp} • ${releaseInfo.deployTarget}`;

  return (
    <a
      href="/release.json"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-4 right-4 z-50 hidden sm:block"
      aria-label={`Open release manifest for ${releaseInfo.releaseStamp}`}
      title={`${details} • ${releaseInfo.buildTime}`}
    >
      <Badge
        variant="outline"
        className="border-primary/30 bg-background/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75"
      >
        <span className="text-foreground">{label}</span>
        <span className="ml-2 text-muted-foreground">{details}</span>
      </Badge>
    </a>
  );
}