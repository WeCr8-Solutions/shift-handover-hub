import { useMemo, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import {
  useActiveEngagement,
  useIntakeResponses,
  useCustomerChecklist,
  useSubmitIntakeStep,
  type IntakeModuleKey,
} from "@/hooks/useIntakeResponses";
import { IntakeWizardShell, IntakeStepCard, INTAKE_STEPS } from "@/components/onboarding/intake/IntakeWizardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SeedBasicShopButton } from "@/components/admin/onboarding/SeedBasicShopButton";
import { InviteCodeGenerator } from "@/components/InviteCodeGenerator";

interface FormState {
  org_profile: { confirmed_name: string; address: string; itar: boolean; quality_systems: string };
  equipment: { count: string; notes: string };
  stations: { count: string; departments: string };
  users_roles: { invitees: string };
  routing: { templates: string };
  quality: { checkpoints: string };
  erp: { system: "native" | "jobboss" | "sap"; persistence: "read_through" | "write_through" };
  training: { programs: string };
  documents: { uploaded: boolean; notes: string };
  review: { confirmed: boolean; expectations: string };
}

const DEFAULTS: FormState = {
  org_profile: { confirmed_name: "", address: "", itar: false, quality_systems: "" },
  equipment: { count: "", notes: "" },
  stations: { count: "", departments: "" },
  users_roles: { invitees: "" },
  routing: { templates: "" },
  quality: { checkpoints: "" },
  erp: { system: "native", persistence: "read_through" },
  training: { programs: "" },
  documents: { uploaded: false, notes: "" },
  review: { confirmed: false, expectations: "" },
};

export default function OnboardingIntake() {
  const { user, loading: authLoading } = useAuth();
  const { organizationId } = useOrganization();
  const [activeKey, setActiveKey] = useState<IntakeModuleKey>("org_profile");
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [orgName, setOrgName] = useState("");
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  const { data: engagement, isLoading: eLoading } = useActiveEngagement(organizationId);
  const { data: responses } = useIntakeResponses(engagement?.id ?? null);
  const { data: checklist = [] } = useCustomerChecklist(engagement?.id ?? null);
  const submit = useSubmitIntakeStep();

  useEffect(() => {
    if (!user || !organizationId) { setAccessChecked(true); return; }
    (async () => {
      const [{ data: org }, { data: mem }] = await Promise.all([
        supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
        supabase
          .from("organization_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("organization_id", organizationId)
          .maybeSingle(),
      ]);
      setOrgName((org as any)?.name ?? "");
      setIsOrgAdmin(["admin", "owner"].includes(String((mem as any)?.role ?? "")));
      setAccessChecked(true);
    })();
  }, [user, organizationId]);

  // Hydrate form from saved responses
  useEffect(() => {
    if (!responses) return;
    setForm((prev) => {
      const next = { ...prev };
      for (const r of responses) {
        if ((next as any)[r.module_key]) {
          (next as any)[r.module_key] = { ...(next as any)[r.module_key], ...r.payload };
        }
      }
      return next;
    });
  }, [responses]);

  const submittedKeys = useMemo(
    () => new Set((responses ?? []).map((r) => r.module_key as IntakeModuleKey)),
    [responses],
  );

  if (authLoading || eLoading || !accessChecked) {
    return <div className="p-8"><Skeleton className="h-96 w-full max-w-4xl mx-auto" /></div>;
  }
  if (!user) return <Navigate to="/auth?redirect=/onboarding/intake" replace />;
  if (!organizationId) return <Navigate to="/setup" replace />;
  if (!isOrgAdmin) return <Navigate to="/" replace />;
  if (!engagement) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">No active concierge engagement</h1>
          <p className="text-sm text-muted-foreground">
            Your organization doesn't have an active onboarding engagement.
          </p>
          <Button asChild><a href="/onboarding-service">Learn about Concierge Onboarding</a></Button>
        </div>
      </div>
    );
  }

  const activeIdx = INTAKE_STEPS.findIndex((s) => s.key === activeKey);
  const activeMeta = INTAKE_STEPS[activeIdx];
  const activeChecklist = checklist.find((c: any) => c.module_key === activeKey);

  function saveAndAdvance() {
    submit.mutate(
      { engagementId: engagement!.id, moduleKey: activeKey, payload: (form as any)[activeKey] },
      {
        onSuccess: () => {
          if (activeIdx < INTAKE_STEPS.length - 1) {
            setActiveKey(INTAKE_STEPS[activeIdx + 1].key);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        },
      },
    );
  }
  function saveOnly() {
    submit.mutate({ engagementId: engagement!.id, moduleKey: activeKey, payload: (form as any)[activeKey] });
  }

  return (
    <IntakeWizardShell
      activeKey={activeKey}
      onSelect={setActiveKey}
      checklist={checklist}
      responses={submittedKeys}
      percentComplete={engagement.percent_complete ?? 0}
      orgName={orgName}
      isSaving={submit.isPending}
    >
      <IntakeStepCard
        title={activeMeta.label}
        description={activeMeta.description}
        blocker={activeChecklist?.customer_blocker_note}
        status={activeChecklist?.status}
        footer={
          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              disabled={activeIdx === 0}
              onClick={() => setActiveKey(INTAKE_STEPS[activeIdx - 1].key)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveOnly} disabled={submit.isPending}>
                Save
              </Button>
              {activeIdx < INTAKE_STEPS.length - 1 ? (
                <Button onClick={saveAndAdvance} disabled={submit.isPending} className="gap-2">
                  Save & continue <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={saveAndAdvance}
                  disabled={submit.isPending || !form.review.confirmed}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit intake
                </Button>
              )}
            </div>
          </div>
        }
      >
        <StepFields activeKey={activeKey} form={form} setForm={setForm} />
      </IntakeStepCard>
    </IntakeWizardShell>
  );
}

function StepFields({
  activeKey, form, setForm,
}: { activeKey: IntakeModuleKey; form: FormState; setForm: (f: FormState) => void }) {
  const upd = <K extends keyof FormState>(k: K, patch: Partial<FormState[K]>) =>
    setForm({ ...form, [k]: { ...form[k], ...patch } });

  switch (activeKey) {
    case "org_profile":
      return (
        <>
          <div><Label>Confirmed company name</Label>
            <Input value={form.org_profile.confirmed_name}
              onChange={(e) => upd("org_profile", { confirmed_name: e.target.value })} /></div>
          <div><Label>Primary shop address</Label>
            <Textarea rows={2} value={form.org_profile.address}
              onChange={(e) => upd("org_profile", { address: e.target.value })} /></div>
          <div className="flex items-center gap-2">
            <Checkbox id="itar" checked={form.org_profile.itar}
              onCheckedChange={(v) => upd("org_profile", { itar: !!v })} />
            <Label htmlFor="itar" className="text-sm">We handle ITAR / export-controlled work</Label>
          </div>
          <div><Label>Quality systems (AS9100, ISO 9001, etc.)</Label>
            <Input value={form.org_profile.quality_systems}
              onChange={(e) => upd("org_profile", { quality_systems: e.target.value })} /></div>
        </>
      );
    case "equipment":
      return (
        <>
          <div><Label>Approximate # of machines</Label>
            <Input type="number" value={form.equipment.count}
              onChange={(e) => upd("equipment", { count: e.target.value })} /></div>
          <div><Label>Machine list / notes (paste a list, or note "JobLine will gather over Zoom")</Label>
            <Textarea rows={5} value={form.equipment.notes}
              onChange={(e) => upd("equipment", { notes: e.target.value })} /></div>
          <p className="text-xs text-muted-foreground">
            We'll import these into your equipment registry. CSV upload is available on the next visit.
          </p>
        </>
      );
    case "stations":
      return (
        <>
          <div className="rounded border bg-muted/30 p-3 space-y-2">
            <div className="text-sm font-medium">Quick start: basic shop layout</div>
            <p className="text-xs text-muted-foreground">
              One click creates a sensible default: Office, CNC Operations, Welding &amp; Assembly,
              Shipping &amp; Receiving, and Quality / Inspection — plus one station per machine you've imported.
              Safe to re-run.
            </p>
          </div>
          <div><Label># of work stations (optional override)</Label>
            <Input type="number" value={form.stations.count}
              onChange={(e) => upd("stations", { count: e.target.value })} /></div>
          <div><Label>Additional departments beyond the defaults (one per line)</Label>
            <Textarea rows={3} placeholder={"Water Jet\nPunch Press\nPaint Booth"}
              value={form.stations.departments}
              onChange={(e) => upd("stations", { departments: e.target.value })} /></div>
        </>
      );
    case "users_roles":
      return (
        <>
          <p className="text-xs text-muted-foreground">
            Generate invite codes below. Each invite shows a QR code you can print or share, and a link
            you can email. Operators redeem at <code>/auth?invite=CODE</code>.
          </p>
          <InviteCodeGenerator />
          <div>
            <Label className="text-xs">Notes for the concierge team about your roster</Label>
            <Textarea rows={3} className="mt-1" placeholder="e.g. Jane is shift lead; John handles inspection."
              value={form.users_roles.invitees}
              onChange={(e) => upd("users_roles", { invitees: e.target.value })} />
          </div>
        </>
      );
    case "routing":
      return (
        <div><Label>Standard routings (one per line)</Label>
          <Textarea rows={6}
            placeholder={"Receive → Mill → Turn → Inspect → Ship\nReceive → Saw → Deburr → Anodize → Inspect → Ship"}
            value={form.routing.templates}
            onChange={(e) => upd("routing", { templates: e.target.value })} /></div>
      );
    case "quality":
      return (
        <div><Label>Inspection checkpoints you need</Label>
          <Textarea rows={5} placeholder={"First-article inspection\nIn-process sampling\nFinal CMM"}
            value={form.quality.checkpoints}
            onChange={(e) => upd("quality", { checkpoints: e.target.value })} /></div>
      );
    case "erp":
      return (
        <>
          <div><Label>ERP system</Label>
            <RadioGroup value={form.erp.system}
              onValueChange={(v: any) => upd("erp", { system: v })} className="mt-2 space-y-1">
              {[
                ["native", "Jobline native (no external ERP)"],
                ["jobboss", "JobBOSS / E2"],
                ["sap", "SAP S/4HANA"],
              ].map(([v, label]) => (
                <div key={v} className="flex items-center gap-2">
                  <RadioGroupItem value={v} id={`erp-${v}`} /><Label htmlFor={`erp-${v}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          {form.erp.system !== "native" && (
            <div><Label>Persistence mode</Label>
              <RadioGroup value={form.erp.persistence}
                onValueChange={(v: any) => upd("erp", { persistence: v })} className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="read_through" id="p-rt" />
                  <Label htmlFor="p-rt">Read-through (recommended, required for ITAR)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="write_through" id="p-wt" />
                  <Label htmlFor="p-wt">Write-through (mirror to Jobline)</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </>
      );
    case "training":
      return (
        <div><Label>OAP role programs (operator → program, one per line)</Label>
          <Textarea rows={5}
            placeholder={"jane@shop.com → CNC Mill Operator\njohn@shop.com → Supervisor"}
            value={form.training.programs}
            onChange={(e) => upd("training", { programs: e.target.value })} /></div>
      );
    case "documents":
      return (
        <>
          <div className="flex items-center gap-2">
            <Checkbox id="docs" checked={form.documents.uploaded}
              onCheckedChange={(v) => upd("documents", { uploaded: !!v })} />
            <Label htmlFor="docs">I've shared our quality manual / setup sheets with JobLine</Label>
          </div>
          <div><Label>Notes for the concierge team</Label>
            <Textarea rows={4} value={form.documents.notes}
              onChange={(e) => upd("documents", { notes: e.target.value })} /></div>
          <p className="text-xs text-muted-foreground">
            Direct uploads land in the Documents tab after activation.
          </p>
        </>
      );
    case "review":
      return (
        <>
          <div className="rounded border bg-muted/40 p-3 text-sm space-y-1">
            <div className="font-medium">What happens next</div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>JobLine reviews your answers, builds out equipment, stations, routing, and quality gates.</li>
              <li>We run a production smoke test against your data.</li>
              <li>You receive a release certificate + email when your shop is live.</li>
            </ul>
          </div>
          <div><Label>Anything specific we should know? (deadlines, audits, ship dates)</Label>
            <Textarea rows={3} value={form.review.expectations}
              onChange={(e) => upd("review", { expectations: e.target.value })} /></div>
          <div className="flex items-center gap-2">
            <Checkbox id="confirm" checked={form.review.confirmed}
              onCheckedChange={(v) => upd("review", { confirmed: !!v })} />
            <Label htmlFor="confirm" className="text-sm">
              I confirm the information above is accurate and JobLine may proceed with setup.
            </Label>
          </div>
        </>
      );
  }
}
