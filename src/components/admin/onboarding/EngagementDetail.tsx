import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, Rocket, ShieldAlert } from "lucide-react";
import {
  useChecklist,
  useEngagement,
  useMarkReady,
  useActivateOrg,
  useProductionReadiness,
} from "@/hooks/useOnboardingEngagements";
import { ChecklistModule } from "./ChecklistModule";
import { UploadUtility } from "./UploadUtility";
import { ReadinessPanel } from "./ReadinessPanel";

const MODULE_HELP: Record<string, { description: string; templateColumns?: string[] }> = {
  org_profile:  { description: "Capture company name, address, branding, ITAR posture, subscription tier, and seat count." },
  equipment:    { description: "Bulk upload machines and link to verified library entries.", templateColumns: ["asset_tag","name","equipment_type","manufacturer","model","serial_number","controller","machine_type","location","notes"] },
  stations:     { description: "Define departments and stations, then map equipment to stations.", templateColumns: ["department","station_name","station_id","station_type","capacity","shift_pattern"] },
  users_roles:  { description: "Generate invites for operators, supervisors, and admins.", templateColumns: ["email","first_name","last_name","role","department","default_station","phone","send_invite_now"] },
  routing:      { description: "Load starter routing templates with operations and standard times.", templateColumns: ["template_name","step_number","operation","work_center","setup_minutes","run_minutes_per_unit","dimension_spec","quality_checkpoint"] },
  quality:      { description: "Configure quality checkpoints and pick inspection tool overrides.", templateColumns: ["checkpoint_name","operation_after","tool_required","frequency","sample_size"] },
  erp:          { description: "Configure ERP connector (Native, JobBOSS, or SAP). ITAR orgs are locked to read-through.", templateColumns: ["system","base_url","auth_method","persistence_mode","notes"] },
  training:     { description: "Seed role programs and assign mandatory OAP courses.", templateColumns: ["email","program","required_by"] },
  documents:    { description: "Upload AS9100 / ISO / ITAR policies, equipment manuals, setup sheets." },
  review:       { description: "Final verification before flipping the org to ready-for-production." },
};

export function EngagementDetail({ engagementId, onBack }: { engagementId: string; onBack: () => void }) {
  const { data: engagement, isLoading: loadingE } = useEngagement(engagementId);
  const { data: items, isLoading: loadingI } = useChecklist(engagementId);
  const { data: readiness } = useProductionReadiness(engagement?.organization_id ?? null);
  const markReady = useMarkReady();
  const activate = useActivateOrg();

  const requiredOpen = useMemo(
    () => (items ?? []).filter((i) => i.required && i.status !== "done").length,
    [items],
  );
  const isItar = engagement?.organizations?.requires_us_person_declaration === true;

  if (loadingE || loadingI) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (!engagement) {
    return (
      <Card><CardContent className="py-12 text-center text-sm">Engagement not found.</CardContent></Card>
    );
  }

  const readyBlocked = requiredOpen > 0 || (readiness ? !readiness.ready : false);
  const readyLabel = requiredOpen > 0
    ? `${requiredOpen} item${requiredOpen === 1 ? "" : "s"} left`
    : readiness && !readiness.ready
      ? `${readiness.blockers.length} blocker${readiness.blockers.length === 1 ? "" : "s"}`
      : "Mark ready for production";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to engagements
        </Button>
        <div className="flex items-center gap-2">
          {engagement.status !== "ready_for_production" && engagement.status !== "live" && (
            <Button
              onClick={() => markReady.mutate(engagementId)}
              disabled={readyBlocked || markReady.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> {readyLabel}
            </Button>
          )}
          {engagement.status === "ready_for_production" && (
            <Button onClick={() => activate.mutate(engagementId)} disabled={activate.isPending} className="gap-2">
              <Rocket className="w-4 h-4" /> Activate customer login
            </Button>
          )}
        </div>
      </div>

      <ReadinessPanel organizationId={engagement.organization_id} />


      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {engagement.organizations?.name ?? "—"}
                {isItar && (
                  <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                    <ShieldAlert className="w-3 h-3" /> ITAR
                  </Badge>
                )}
                <Badge variant="secondary" className="capitalize">{engagement.status.replace(/_/g, " ")}</Badge>
              </CardTitle>
              <CardDescription>
                Tier: <span className="capitalize">{engagement.plan_tier}</span> · Started{" "}
                {new Date(engagement.started_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-semibold">{engagement.percent_complete}%</div>
              <div className="text-xs text-muted-foreground">Required completion</div>
            </div>
          </div>
          <Progress value={engagement.percent_complete} className="h-2 mt-2" />
        </CardHeader>
      </Card>

      <Tabs defaultValue={items?.[0]?.module_key ?? "org_profile"} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto justify-start">
          {items?.map((i) => (
            <TabsTrigger key={i.id} value={i.module_key} className="capitalize">
              {i.module_key.replace(/_/g, " ")}
              {i.status === "done" && <CheckCircle2 className="w-3 h-3 ml-1 text-status-ok" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {items?.map((item) => (
          <TabsContent key={item.id} value={item.module_key} className="space-y-4">
            <ChecklistModule
              item={item}
              description={MODULE_HELP[item.module_key]?.description ?? ""}
              itarLocked={isItar && item.module_key === "erp"}
            />
            {MODULE_HELP[item.module_key]?.templateColumns && (
              <UploadUtility
                engagementId={engagement.id}
                organizationId={engagement.organization_id}
                moduleKey={item.module_key}
                templateColumns={MODULE_HELP[item.module_key]!.templateColumns!}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
