/**
 * DataSourceBanner
 *
 * Surfaces the active data-source mode (Native / JobBOSS read-through /
 * SAP read-through / write-through) at the top of dashboard surfaces so
 * supervisors immediately understand whether the data they're acting on
 * lives in Lovable Cloud or in their ERP system of record.
 *
 * Renders nothing for plain native orgs (default) to avoid noise.
 */
import { Link } from "react-router-dom";
import { Cloud, Database, ShieldCheck, ExternalLink } from "lucide-react";
import { useDataSourceMode } from "@/hooks/useDataSourceMode";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function DataSourceBanner() {
  const { mode, vendor, isReadThrough, isItar, loading } = useDataSourceMode();

  if (loading || mode === "native") return null;

  const vendorLabel = vendor === "sap" ? "SAP S/4HANA" : "JobBOSS";
  const vendorRoute = `/settings/integrations/${vendor}`;

  return (
    <Alert className="border-info/40 bg-info/5">
      <div className="flex items-start gap-3">
        {isReadThrough ? (
          <ShieldCheck className="w-5 h-5 text-info shrink-0 mt-0.5" />
        ) : (
          <Database className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <AlertTitle className="flex items-center gap-2 flex-wrap">
            <span>{vendorLabel} is your system of record</span>
            <Badge variant={isReadThrough ? "secondary" : "outline"}>
              {isReadThrough ? "Read-through" : "Write-through"}
            </Badge>
            {isItar && (
              <Badge variant="outline" className="border-success/40 text-success">
                <Cloud className="w-3 h-3 mr-1" /> ITAR
              </Badge>
            )}
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            {isReadThrough
              ? `Work orders, queue, and routing are streamed live from ${vendorLabel}. Nothing is persisted to Lovable Cloud — your data stays in your ERP.`
              : `Work orders are synced from ${vendorLabel} into Lovable Cloud for offline access and analytics.`}
            {" "}
            <Link
              to={vendorRoute}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Manage <ExternalLink className="w-3 h-3" />
            </Link>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
