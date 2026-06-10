import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, CheckCircle2, Printer, Rocket, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
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
import { PaymentPanel } from "./PaymentPanel";
import { ContractPanel } from "./ContractPanel";
import { RefundPanel } from "./RefundPanel";
import { AccountingExportPanel } from "./AccountingExportPanel";
import { ConciergeAuditTimeline } from "./ConciergeAuditTimeline";
import { OwnerInvitePanel } from "./OwnerInvitePanel";
import { InvitesRolesBoard } from "./InvitesRolesBoard";
import { IntakeMembersEditor } from "./IntakeMembersEditor";
import { IntakeErpEditor } from "./IntakeErpEditor";
import { DocumentLibrary } from "@/components/admin/concierge/DocumentLibrary";
import { IntakeTileGrid } from "./IntakeTileGrid";
import { OapMentorPolicyCard } from "./OapMentorPolicyCard";
import { OrgMembersPanel } from "./OrgMembersPanel";
import { StationMachineMatrix } from "./StationMachineMatrix";
import { hasTileGridConfig } from "@/lib/concierge/intakeModuleSchema";


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

  const paymentOk = ["paid", "waived"].includes(engagement.payment_status);
  const contractOk =
    engagement.purchased_via === "stripe" ||
    engagement.payment_status === "waived" ||
    !!engagement.contract_signed_at;
  const readyBlocked = requiredOpen > 0 || (readiness ? !readiness.ready : false) || !paymentOk || !contractOk;
  const activateBlocked = !paymentOk || !contractOk;

  const blockReasons: string[] = [];
  if (requiredOpen > 0) blockReasons.push(`${requiredOpen} required checklist item${requiredOpen === 1 ? "" : "s"} open`);
  if (readiness && !readiness.ready) blockReasons.push("Production readiness checks failing");
  if (!paymentOk) blockReasons.push(`Payment status: ${engagement.payment_status}`);
  if (!contractOk) blockReasons.push("Signed contract not on file");

  const readyLabel = requiredOpen > 0
    ? `${requiredOpen} item${requiredOpen === 1 ? "" : "s"} left`
    : !paymentOk
      ? "Payment required"
      : !contractOk
        ? "Signed contract required"
        : readiness && !readiness.ready
          ? `${readiness.blockers.length} blocker${readiness.blockers.length === 1 ? "" : "s"}`
          : "Mark ready for production";

  const MarkReadyBtn = (
    <Button
      onClick={() => markReady.mutate(engagementId)}
      disabled={readyBlocked || markReady.isPending}
      className="gap-2"
    >
      <CheckCircle2 className="w-4 h-4" /> {readyLabel}
    </Button>
  );
  const ActivateBtn = (
    <Button
      onClick={() => activate.mutate(engagementId)}
      disabled={activate.isPending || activateBlocked}
      className="gap-2"
    >
      <Rocket className="w-4 h-4" /> Activate customer login
    </Button>
  );

  return (
    <TooltipProvider delayDuration={150}>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to engagements
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to={`/admin/concierge/print/${engagementId}`}>
              <Printer className="w-4 h-4" /> Print sales pack
            </Link>
          </Button>
          {engagement.status !== "ready_for_production" && engagement.status !== "live" && (
            blockReasons.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild><span>{MarkReadyBtn}</span></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <ul className="text-xs space-y-0.5">
                    {blockReasons.map((r) => <li key={r}>• {r}</li>)}
                  </ul>
                </TooltipContent>
              </Tooltip>
            ) : MarkReadyBtn
          )}
          {engagement.status === "ready_for_production" && (
            activateBlocked ? (
              <Tooltip>
                <TooltipTrigger asChild><span>{ActivateBtn}</span></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <ul className="text-xs space-y-0.5">
                    {blockReasons.map((r) => <li key={r}>• {r}</li>)}
                  </ul>
                </TooltipContent>
              </Tooltip>
            ) : ActivateBtn
          )}
        </div>
      </div>

      <div id="payment-panel" className="rounded transition-shadow">
        <PaymentPanel engagement={engagement as any} />
      </div>

      <div id="contract-panel" className="rounded transition-shadow">
        <ContractPanel engagement={engagement as any} />
      </div>

      <RefundPanel engagement={engagement as any} />

      <AccountingExportPanel
        engagementId={engagement.id}
        lastExportedAt={(engagement as any).exported_to_accounting_at}
      />

      <div id="readiness-panel" className="rounded transition-shadow">
        <ReadinessPanel organizationId={engagement.organization_id} engagement={engagement} />
      </div>

      <div id="owner-invite-panel" className="rounded transition-shadow">
        <OwnerInvitePanel
          engagementId={engagement.id}
          organizationId={engagement.organization_id}
          organizationName={engagement.organizations?.name ?? undefined}
        />
      </div>

      <InvitesRolesBoard
        engagementId={engagement.id}
        organizationId={engagement.organization_id}
        organizationName={engagement.organizations?.name ?? undefined}
      />

      <DocumentLibrary audience="all" engagement={engagement} />

      <OapMentorPolicyCard orgId={engagement.organization_id} canEdit />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shop structure</CardTitle>
          <CardDescription>
            Build out the org chart that production depends on: teams group departments, departments group stations, and stations hold one purchased machine each. All edits write to live tables and audit to the concierge log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teams" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto justify-start">
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="stations">Stations</TabsTrigger>
              <TabsTrigger value="machines">Station ↔ Machines</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>
            <TabsContent value="teams">
              <IntakeTileGrid module={"teams"} orgId={engagement.organization_id} />
            </TabsContent>
            <TabsContent value="departments">
              <IntakeTileGrid module={"departments"} orgId={engagement.organization_id} />
            </TabsContent>
            <TabsContent value="stations">
              <IntakeTileGrid module={"stations"} orgId={engagement.organization_id} />
            </TabsContent>
            <TabsContent value="machines">
              <StationMachineMatrix organizationId={engagement.organization_id} />
            </TabsContent>
            <TabsContent value="members">
              <OrgMembersPanel organizationId={engagement.organization_id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConciergeAuditTimeline engagementId={engagement.id} />




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
            {item.module_key === "users_roles" && (
              <IntakeMembersEditor
                engagementId={engagement.id}
                organizationId={engagement.organization_id}
                organizationSlug={engagement.organizations?.slug}
              />
            )}
            {item.module_key === "erp" && (
              <IntakeErpEditor
                engagementId={engagement.id}
                organizationId={engagement.organization_id}
                isItar={isItar}
              />
            )}
            {MODULE_HELP[item.module_key]?.templateColumns && (
              <UploadUtility
                engagementId={engagement.id}
                organizationId={engagement.organization_id}
                moduleKey={item.module_key}
                templateColumns={MODULE_HELP[item.module_key]!.templateColumns!}
              />
            )}
            {hasTileGridConfig(item.module_key) && (
              <IntakeTileGrid
                module={item.module_key}
                orgId={engagement.organization_id}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
