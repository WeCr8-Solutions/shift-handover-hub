import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Monitor, ChevronDown, Globe, Smartphone, Laptop, Tablet } from "lucide-react";
import { useState } from "react";

interface EnvironmentContextProps {
  metadata: Record<string, unknown> | null;
  userAgent: string | null;
  environment: string | null;
  appVersion: string | null;
  buildId: string | null;
  commitHash: string | null;
}

interface ParsedUA {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
}

export function EnvironmentContext({
  metadata,
  userAgent,
  environment,
  appVersion,
  buildId,
  commitHash,
}: EnvironmentContextProps) {
  const [isOpen, setIsOpen] = useState(false);

  const parsedUA = useMemo(() => (userAgent ? parseUserAgent(userAgent) : null), [userAgent]);

  const screenWidth = metadata?.screen_width as number | undefined;
  const screenHeight = metadata?.screen_height as number | undefined;
  const timezone = metadata?.timezone as string | undefined;
  const language = metadata?.language as string | undefined;

  const hasAnyData = environment || appVersion || buildId || commitHash || parsedUA || screenWidth;
  if (!hasAnyData) return null;

  const DeviceIcon = parsedUA?.deviceType === "mobile" 
    ? Smartphone 
    : parsedUA?.deviceType === "tablet" 
    ? Tablet 
    : Laptop;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-muted/50">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Monitor className="w-4 h-4" />
            Environment & Device
            {environment && (
              <Badge variant="outline" className="text-xs font-mono">
                {environment}
              </Badge>
            )}
            {parsedUA && (
              <Badge variant="secondary" className="text-xs">
                <DeviceIcon className="w-3 h-3 mr-1" />
                {parsedUA.browser}
              </Badge>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border rounded-lg bg-muted/20 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Build Info */}
            {(appVersion || buildId || commitHash) && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Build Info
                </h5>
                <div className="space-y-1.5">
                  {appVersion && (
                    <InfoRow label="Version" value={appVersion} mono />
                  )}
                  {buildId && (
                    <InfoRow label="Build" value={buildId} mono />
                  )}
                  {commitHash && (
                    <InfoRow
                      label="Commit"
                      value={commitHash.length > 8 ? commitHash.slice(0, 8) : commitHash}
                      mono
                    />
                  )}
                  {environment && (
                    <InfoRow label="Env" value={environment} />
                  )}
                </div>
              </div>
            )}

            {/* Browser/Device */}
            {parsedUA && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Browser & Device
                </h5>
                <div className="space-y-1.5">
                  <InfoRow label="Browser" value={parsedUA.browser} />
                  <InfoRow label="OS" value={parsedUA.os} />
                  <InfoRow label="Type" value={parsedUA.deviceType} />
                </div>
              </div>
            )}

            {/* Screen */}
            {(screenWidth || screenHeight) && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Screen
                </h5>
                <div className="space-y-1.5">
                  {screenWidth && screenHeight && (
                    <InfoRow label="Resolution" value={`${screenWidth}×${screenHeight}`} mono />
                  )}
                </div>
              </div>
            )}

            {/* Locale */}
            {(timezone || language) && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Locale
                </h5>
                <div className="space-y-1.5">
                  {timezone && <InfoRow label="Timezone" value={timezone} />}
                  {language && <InfoRow label="Language" value={language} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-16 shrink-0">{label}</span>
      <span className={`text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function parseUserAgent(ua: string): ParsedUA {
  let browser = "Unknown";
  let os = "Unknown";
  let deviceType: ParsedUA["deviceType"] = "desktop";

  // Browser detection
  if (ua.includes("Firefox/")) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${match?.[1]?.split(".")[0] || ""}`.trim();
  } else if (ua.includes("Edg/")) {
    const match = ua.match(/Edg\/([\d.]+)/);
    browser = `Edge ${match?.[1]?.split(".")[0] || ""}`.trim();
  } else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${match?.[1]?.split(".")[0] || ""}`.trim();
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    const match = ua.match(/Version\/([\d.]+)/);
    browser = `Safari ${match?.[1]?.split(".")[0] || ""}`.trim();
  }

  // OS detection
  if (ua.includes("Windows NT 10")) os = "Windows 10/11";
  else if (ua.includes("Windows NT")) os = "Windows";
  else if (ua.includes("Mac OS X")) {
    const match = ua.match(/Mac OS X ([\d_]+)/);
    os = `macOS ${match?.[1]?.replace(/_/g, ".") || ""}`.trim();
  } else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Device type
  if (ua.includes("Mobile") || ua.includes("iPhone") || ua.includes("Android")) {
    deviceType = ua.includes("iPad") || ua.includes("Tablet") ? "tablet" : "mobile";
  }

  return { browser, os, deviceType };
}
