import { useState } from "react";
import { GlobalUpdate } from "@/hooks/useGlobalUpdates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import {
  Rocket, Bug, Lightbulb, AlertTriangle, Shield, Wrench, ChevronDown, ChevronUp, Check
} from "lucide-react";

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  feature: { label: "Feature", icon: Rocket, color: "bg-blue-500/10 text-blue-600 border-blue-300" },
  improvement: { label: "Improvement", icon: Lightbulb, color: "bg-amber-500/10 text-amber-600 border-amber-300" },
  bug_fix: { label: "Bug Fix", icon: Bug, color: "bg-red-500/10 text-red-600 border-red-300" },
  system_notice: { label: "System Notice", icon: AlertTriangle, color: "bg-orange-500/10 text-orange-600 border-orange-300" },
  security: { label: "Security", icon: Shield, color: "bg-purple-500/10 text-purple-600 border-purple-300" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "bg-muted text-muted-foreground border-border" },
};

const impactColors: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const statusBadgeColors: Record<string, string> = {
  live: "bg-green-500/10 text-green-600 border-green-300",
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-300",
  investigating: "bg-orange-500/10 text-orange-600 border-orange-300",
  resolved: "bg-muted text-muted-foreground border-border",
  deprecated: "bg-muted text-muted-foreground border-border",
};

interface UpdateCardProps {
  update: GlobalUpdate;
  isAcknowledged: boolean;
  onAcknowledge?: (id: string) => void;
}

export function UpdateCard({ update, isAcknowledged, onAcknowledge }: UpdateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = categoryConfig[update.category] || categoryConfig.improvement;
  const Icon = cfg.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Impact indicator */}
          <div className={`w-1 self-stretch rounded-full ${impactColors[update.impact_level]}`} />

          {/* Category icon */}
          <div className={`p-2 rounded-lg shrink-0 ${cfg.color}`}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              {update.version_number && (
                <Badge variant="outline" className="text-xs font-mono">{update.version_number}</Badge>
              )}
              <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
              <Badge variant="outline" className={`text-xs ${statusBadgeColors[update.status]}`}>
                {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {update.published_at
                  ? format(new Date(update.published_at), "MMM d, yyyy")
                  : format(new Date(update.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {/* Title + summary */}
            <h3 className="font-semibold text-sm">{update.title}</h3>
            {update.summary && <p className="text-sm text-muted-foreground">{update.summary}</p>}

            {/* Affected modules */}
            {update.affected_modules?.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {update.affected_modules.map((mod) => (
                  <Badge key={mod} variant="secondary" className="text-xs">{mod}</Badge>
                ))}
              </div>
            )}

            {/* Expandable section */}
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-0 h-7 text-xs text-muted-foreground">
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? "Less" : "Full Details"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                {update.full_description && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{update.full_description}</ReactMarkdown>
                  </div>
                )}
                {update.how_it_helps_users && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1">How This Helps You</p>
                    <p className="text-sm text-foreground">{update.how_it_helps_users}</p>
                  </div>
                )}
                {update.issues_addressed?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Issues Resolved</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                      {update.issues_addressed.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Acknowledge button */}
            {update.requires_acknowledgement && !isAcknowledged && onAcknowledge && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => onAcknowledge(update.id)}>
                <Check className="w-3 h-3" /> Acknowledge
              </Button>
            )}
            {update.requires_acknowledgement && isAcknowledged && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                <Check className="w-3 h-3 mr-1" /> Acknowledged
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
