import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Printer, ArrowLeft } from "lucide-react";
import { useEngagement } from "@/hooks/useOnboardingEngagements";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentLibrary } from "@/components/admin/concierge/DocumentLibrary";
import { useConciergePrefill } from "@/hooks/useConciergePrefill";

/**
 * Printable Concierge Sales Pack — platform-admin only.
 * Layout uses Tailwind print: utilities so the browser handles PDF export.
 * Optional :engagementId param fills in customer + engagement details;
 * without it the pack renders as a generic blank packet for in-person sales calls.
 */
const blankRows = (n: number) => Array.from({ length: n });

function PrintPage({
  title,
  children,
  initials = false,
}: { title: string; children: React.ReactNode; initials?: boolean }) {
  return (
    <section className="page bg-white text-black mx-auto my-8 p-10 max-w-[8.5in] min-h-[10.5in] border print:border-0 print:my-0 print:p-[0.75in] print:break-after-page relative">
      <header className="flex items-center justify-between border-b border-black/30 pb-3 mb-6">
        <div className="font-bold text-lg tracking-tight">JobLine.ai · Concierge Onboarding</div>
        <div className="text-xs uppercase tracking-wider">{title}</div>
      </header>
      {children}
      {initials && (
        <footer className="absolute bottom-6 left-10 right-10 flex items-end justify-between text-[10px] text-black/60 print:bottom-[0.5in] print:left-[0.75in] print:right-[0.75in]">
          <div>Confidential — JobLine AI, Inc. & Customer</div>
          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className="border-b border-black w-16 h-5" />
              <div>Customer initials</div>
            </div>
            <div className="text-right">
              <div className="border-b border-black w-16 h-5" />
              <div>JobLine initials</div>
            </div>
          </div>
        </footer>
      )}
    </section>
  );
}

function WorksheetTable({
  columns,
  rows = 10,
  data,
}: { columns: string[]; rows?: number; data?: string[][] }) {
  const filled = data ?? [];
  const minRows = Math.max(rows, filled.length);
  const blanks = Math.max(0, minRows - filled.length);
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} className="border border-black/40 px-2 py-1 text-left bg-black/5 font-semibold">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filled.map((row, r) => (
          <tr key={`d-${r}`}>
            {columns.map((c, ci) => (
              <td key={c} className="border border-black/30 h-7 px-2 align-top">{row[ci] || "\u00A0"}</td>
            ))}
          </tr>
        ))}
        {blankRows(blanks).map((_, r) => (
          <tr key={`b-${r}`}>
            {columns.map((c) => (
              <td key={c} className="border border-black/30 h-7 px-2 align-top">&nbsp;</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


export default function ConciergeSalesPack({ publicMode = false }: { publicMode?: boolean }) {
  const { engagementId } = useParams<{ engagementId?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin: isPlatformAdmin, isDeveloper, loading: rolesLoading } = useAdminAccess();
  const hasStaffAccess = !!user && (isPlatformAdmin || isDeveloper);
  const { data: engagement, isLoading } = useEngagement(hasStaffAccess ? engagementId ?? null : null);
  const { data: prefill } = useConciergePrefill(
    hasStaffAccess ? (engagement?.organizations as any)?.id ?? null : null,
    hasStaffAccess ? engagementId ?? null : null,
  );

  useEffect(() => { document.title = "Concierge Sales Pack · JobLine.ai"; }, []);

  const today = useMemo(() => new Date().toLocaleDateString(), []);
  const org = engagement?.organizations as any;
  const orgName = org?.name ?? "_________________________";
  const billingEmail = org?.billing_email ?? "_________________________";
  const tier = engagement?.plan_tier ?? "standard";
  const amount = tier === "enterprise" ? "$4,500" : tier === "complimentary" ? "Complimentary" : "$1,500";
  const billingAddress = (engagement as any)?.customer_billing_address as { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string } | null | undefined;
  const formattedAddress = billingAddress
    ? [billingAddress.line1, billingAddress.line2, [billingAddress.city, billingAddress.state, billingAddress.postal_code].filter(Boolean).join(", "), billingAddress.country].filter(Boolean).join(" · ")
    : "_________________________";
  const taxId = (engagement as any)?.customer_tax_id ?? "_________________________";
  const invoiceNumber = (engagement as any)?.invoice_number ?? "(assigned on invoice)";
  const backTarget = engagementId ? `/admin?tab=concierge&engagement=${engagementId}` : "/admin?tab=concierge";
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(backTarget);
  };

  const SECTIONS: { key: string; label: string }[] = [
    { key: "cover", label: "Cover" },
    { key: "msa", label: "Master Services Agreement" },
    { key: "payment", label: "Payment Instructions" },
    { key: "itar", label: "ITAR / US-Person Declaration" },
    { key: "equipment", label: "Equipment Intake" },
    { key: "stations", label: "Stations & Departments" },
    { key: "users", label: "Users & Roles" },
    { key: "routing", label: "Routing Templates" },
    { key: "quality", label: "Quality & Inspection" },
    { key: "erp", label: "ERP Integration" },
    { key: "golive", label: "Go-Live Checklist" },
    { key: "signature", label: "Signature Page" },
  ];
  const [selected, setSelected] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SECTIONS.map((s) => [s.key, true]))
  );
  const [paperSize, setPaperSize] = useState<"Letter" | "A4" | "Legal">("Letter");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [copies, setCopies] = useState(1);
  const isOn = (key: string) => selected[key] !== false;
  const toggle = (key: string) => setSelected((s) => ({ ...s, [key]: !isOn(key) }));
  const setAll = (val: boolean) =>
    setSelected(Object.fromEntries(SECTIONS.map((s) => [s.key, val])));
  const isGenericPublicPack = publicMode && !engagementId;

  if (!isGenericPublicPack && (authLoading || rolesLoading)) return <Skeleton className="h-screen w-full" />;
  if (!isGenericPublicPack && !hasStaffAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Restricted to JobLine platform admins.
      </div>
    );
  }

  const handlePrint = () => {
    for (let i = 0; i < Math.max(1, copies); i++) window.print();
  };

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`@media print { @page { size: ${paperSize} ${orientation}; margin: 0; } body { background: white; } .no-print { display: none !important; } }`}</style>
      </Helmet>

      <div className="no-print sticky top-0 z-10 bg-background border-b px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleBack} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="text-sm text-muted-foreground">
              {engagement ? <>Pack for <b>{orgName}</b> — {tier} ({amount})</> : "Select sections + printer options, then print or download below."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setAll(true)}>Select all</Button>
            <Button size="sm" variant="outline" onClick={() => setAll(false)}>Clear</Button>
            <Button size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print selected
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SECTIONS.map((s) => (
            <label key={s.key} className="flex items-center gap-2 text-xs">
              <Checkbox checked={isOn(s.key)} onCheckedChange={() => toggle(s.key)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs border-t pt-2">
          <div className="font-semibold text-muted-foreground uppercase tracking-wider">Printer</div>
          <Label className="flex items-center gap-2">
            Paper
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as "Letter" | "A4" | "Legal")}
              className="border rounded px-2 py-1 bg-background"
            >
              <option value="Letter">Letter (8.5×11)</option>
              <option value="A4">A4</option>
              <option value="Legal">Legal (8.5×14)</option>
            </select>
          </Label>
          <Label className="flex items-center gap-2">
            Orientation
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
              className="border rounded px-2 py-1 bg-background"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </Label>
          <Label className="flex items-center gap-2">
            Copies
            <input
              type="number"
              min={1}
              max={10}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="border rounded px-2 py-1 w-16 bg-background"
            />
          </Label>
          <span className="text-muted-foreground">
            Tip: in the print dialog choose <b>two-sided</b> + <b>scale 100%</b> for wet-signature packs.
          </span>
        </div>
      </div>

      <div className="no-print max-w-6xl mx-auto px-4 pt-4">
        <DocumentLibrary
          audience={hasStaffAccess ? "all" : "customer"}
          engagement={engagement}
          title="Download & review materials"
          description="Per-document preview and download (PDF, editable DOCX, and Excel worksheets matching the in-app intake fields). Use these for paper onboarding or to email a customer pack ahead of the kickoff call."
        />
      </div>


      {isLoading && engagementId ? (
        <div className="p-8"><Skeleton className="h-96 w-full" /></div>
      ) : (
        <>
          {/* 1. Cover */}
          {isOn("cover") && (
          <PrintPage title="Cover">
            <div className="flex flex-col items-center justify-center text-center pt-12 space-y-6">
              <div className="text-5xl font-bold tracking-tight">Concierge Onboarding</div>
              <div className="text-xl">White-glove setup for your CNC shop</div>
              <div className="inline-block bg-black text-white text-xs uppercase tracking-widest px-3 py-1 rounded">
                Wet-signature contract package
              </div>
              <div className="border-t border-b border-black/30 py-6 mt-8 w-full max-w-md">
                <div className="grid grid-cols-2 gap-y-2 text-sm text-left">
                  <div className="font-semibold">Customer</div><div>{orgName}</div>
                  <div className="font-semibold">Billing email</div><div className="break-all">{billingEmail}</div>
                  <div className="font-semibold">Billing address</div><div>{formattedAddress}</div>
                  <div className="font-semibold">Tax ID / EIN</div><div>{taxId}</div>
                  <div className="font-semibold">Plan</div><div className="capitalize">{tier} — {amount}</div>
                  <div className="font-semibold">Invoice #</div><div>{invoiceNumber}</div>
                  <div className="font-semibold">Date</div><div>{today}</div>
                  <div className="font-semibold">Sales rep</div><div>_________________________</div>
                  <div className="font-semibold">Engagement ID</div><div className="font-mono text-xs">{engagement?.id ?? "(assigned at signing)"}</div>
                </div>
              </div>
              <p className="text-xs text-black/70 mt-4 max-w-md">
                <b>Instructions to signer:</b> initial every page in the bottom-right corner, then sign and date the final Signature Page. Return all pages to onboarding@jobline.ai or upload via the Concierge workspace.
              </p>
            </div>
          </PrintPage>)}

          {/* 2. Master Services Agreement */}
          {isOn("msa") && (
          <PrintPage title="Master Services Agreement" initials>
            <h1 className="text-2xl font-bold mb-2">Concierge Onboarding Services Agreement</h1>
            <p className="text-xs mb-4">Between JobLine AI, Inc. ("JobLine") and the Customer identified on the Cover Page ("Customer"), effective on the Effective Date below.</p>

            <ol className="list-decimal pl-5 space-y-2 text-xs">
              <li><b>Services.</b> JobLine will configure Customer's JobLine.ai facility, including: equipment & station registry, departments, user invites & roles, routing templates & quality checkpoints, OAP training program assignments, ERP / JobBOSS / SAP connector configuration (where applicable), ITAR / US-Person posture verification, and a final walkthrough call with Customer's supervisor.</li>
              <li><b>Fee.</b> Customer agrees to pay JobLine the one-time concierge fee of <b>{amount}</b>. Payment may be made by Stripe, check (payable to "JobLine AI, Inc."), ACH, wire, or purchase order. <b>Production access to JobLine.ai is gated and will not be activated until the fee is recorded as paid (or waived in writing by JobLine).</b></li>
              <li><b>Term.</b> Engagement begins on the Effective Date and concludes when Customer is activated for production use. Either party may terminate for material breach with 10 days' written notice.</li>
              <li><b>Data handling.</b> Customer data is stored in JobLine's multi-tenant Cloud backend with row-level security and org-scoped isolation. For ITAR-controlled facilities, ERP-sourced data defaults to read-through mode (no JobLine persistence).</li>
              <li><b>Confidentiality.</b> Each party will protect the other's confidential information with the same care it uses for its own, and use it solely to perform under this Agreement.</li>
              <li><b>Warranties; Limitation of Liability.</b> Services are provided as-is. JobLine's aggregate liability arising out of this Agreement will not exceed the fees paid hereunder.</li>
              <li><b>Subscription.</b> Concierge services do not include the JobLine.ai monthly subscription, which is billed separately.</li>
              <li><b>Governing law.</b> This Agreement is governed by the laws of the State of Delaware.</li>
            </ol>

            <div className="grid grid-cols-2 gap-8 mt-10 text-xs">
              <div>
                <div className="border-b border-black h-10" />
                <div className="mt-1">Customer signature</div>
                <div className="mt-4 border-b border-black h-7" />
                <div className="mt-1">Printed name &amp; title</div>
                <div className="mt-4 border-b border-black h-7 w-32" />
                <div className="mt-1">Effective date</div>
              </div>
              <div>
                <div className="border-b border-black h-10" />
                <div className="mt-1">JobLine representative signature</div>
                <div className="mt-4 border-b border-black h-7" />
                <div className="mt-1">Printed name &amp; title</div>
                <div className="mt-4 border-b border-black h-7 w-32" />
                <div className="mt-1">Date</div>
              </div>
            </div>
          </PrintPage>)}

          {/* 3. Payment instructions */}
          {isOn("payment") && (
          <PrintPage title="Payment Instructions">
            <h1 className="text-2xl font-bold mb-4">How to pay</h1>
            <p className="text-xs mb-4">Total due: <b>{amount}</b>. Production access is blocked until payment is recorded.</p>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="border border-black/40 p-4 rounded">
                <div className="font-semibold mb-1">Credit card (online)</div>
                <p>Pay instantly at <b>https://jobline.ai/onboarding-service</b> after logging in. Stripe receipt issued automatically; engagement activates on webhook confirmation.</p>
              </div>
              <div className="border border-black/40 p-4 rounded">
                <div className="font-semibold mb-1">Check</div>
                <p>Payable to <b>JobLine AI, Inc.</b><br/>Mail to: JobLine AI, Inc.<br/>__________________________<br/>__________________________</p>
                <p className="mt-2">Memo: Concierge — {orgName}</p>
              </div>
              <div className="border border-black/40 p-4 rounded">
                <div className="font-semibold mb-1">ACH / Wire</div>
                <p>Bank: __________________________<br/>Routing: ______________ · Account: ______________<br/>Reference: Concierge — {orgName}</p>
              </div>
              <div className="border border-black/40 p-4 rounded">
                <div className="font-semibold mb-1">Purchase order / Other</div>
                <p>PO #: __________________________<br/>Approver: ______________________<br/>Email PO to <b>billing@jobline.ai</b>.</p>
              </div>
            </div>
            <div className="mt-6 border border-black/40 p-3 text-xs">
              <b>Sales rep — for internal use:</b> after deposit, log into the Concierge workspace, open this engagement, and record the payment on the "Payment & Contract" panel. Upload a scan/photo of the check or wire receipt as proof.
            </div>
          </PrintPage>)}

          {/* 4. ITAR / US-Person Declaration */}
          {isOn("itar") && (
          <PrintPage title="ITAR / US-Person Declaration" initials>
            <h1 className="text-2xl font-bold mb-3">ITAR / US-Person Declaration</h1>
            <p className="text-xs mb-3">Required if Customer handles ITAR-controlled work. Check one and sign.</p>
            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-2"><span className="border border-black w-4 h-4 inline-block mt-0.5" /> Customer is <b>not</b> ITAR-controlled. JobLine may persist ERP-sourced data normally.</label>
              <label className="flex items-start gap-2"><span className="border border-black w-4 h-4 inline-block mt-0.5" /> Customer <b>is</b> ITAR-controlled. JobLine must operate in read-through mode (no ERP-sourced persistence). All JobLine staff with access must be US persons.</label>
            </div>
            <div className="mt-10 text-xs">
              <div className="border-b border-black h-8" />
              <div>Authorized signer (printed name &amp; title)</div>
              <div className="border-b border-black h-8 mt-4 w-48" />
              <div>Date</div>
            </div>
          </PrintPage>)}

          {/* 5. Equipment */}
          {isOn("equipment") && (
          <PrintPage title="Equipment Intake">
            <h1 className="text-xl font-bold mb-3">Equipment & machine registry</h1>
            <p className="text-xs mb-3">
              {prefill?.equipment.length
                ? <>Prefilled with <b>{prefill.equipment.length}</b> machine{prefill.equipment.length === 1 ? "" : "s"} on file for {orgName}. Verify & annotate corrections in the margin.</>
                : "List every machine. Use one row per asset. Sales rep will upload these as the equipment CSV."}
            </p>
            <WorksheetTable rows={18} data={prefill?.equipment} columns={["asset_tag","name","equipment_type","manufacturer","model","serial_number","controller","machine_type"]} />
          </PrintPage>)}

          {/* 6. Stations & Departments */}
          {isOn("stations") && (
          <PrintPage title="Stations & Departments">
            <h1 className="text-xl font-bold mb-3">Departments & stations</h1>
            <p className="text-xs mb-3">
              {prefill?.stations.length
                ? <>Prefilled with <b>{prefill.stations.length}</b> station{prefill.stations.length === 1 ? "" : "s"} across <b>{new Set(prefill.stations.map(r => r[0]).filter(Boolean)).size}</b> departments. Confirm shift patterns ("day", "swing", or "24/7") in the last column.</>
                : `Each station belongs to one department. Capacity is concurrent jobs; shift pattern is "day", "swing", or "24/7".`}
            </p>
            <WorksheetTable rows={18} data={prefill?.stations} columns={["department","station_name","station_id","station_type","capacity","shift_pattern"]} />
          </PrintPage>)}

          {/* 7. Users & Roles */}
          {isOn("users") && (
          <PrintPage title="Users & Roles">
            <h1 className="text-xl font-bold mb-3">Users, roles & invites</h1>
            <p className="text-xs mb-3">
              {prefill?.users.length
                ? <>Prefilled with <b>{prefill.users.length}</b> existing member{prefill.users.length === 1 ? "" : "s"}. Add any net-new invites below; QR/email invites expire in 15 days.</>
                : <>Roles: <b>admin</b>, <b>supervisor</b>, <b>operator</b>. Mark "Send invite now" Y/N; QR/email invites expire in 15 days.</>}
            </p>
            <WorksheetTable rows={18} data={prefill?.users} columns={["email","first_name","last_name","role","department","default_station","phone","send_invite_now"]} />
          </PrintPage>)}

          {/* 8. Routing templates */}
          {isOn("routing") && (
          <PrintPage title="Routing Templates">
            <h1 className="text-xl font-bold mb-3">Routing templates</h1>
            <p className="text-xs mb-3">
              {prefill?.routing.length
                ? <>Prefilled with <b>{prefill.routing.length}</b> step{prefill.routing.length === 1 ? "" : "s"} across configured templates. Add new templates in blank rows below.</>
                : "Group by template_name. Operations: turning, milling, drilling, grinding, finishing, inspection, assembly, packout."}
            </p>
            <WorksheetTable rows={20} data={prefill?.routing} columns={["template_name","step_number","operation","work_center","setup_minutes","run_minutes_per_unit","dimension_spec","quality_checkpoint"]} />
          </PrintPage>)}

          {/* 9. Quality / Inspection */}
          {isOn("quality") && (
          <PrintPage title="Quality & Inspection">
            <h1 className="text-xl font-bold mb-3">Quality checkpoints &amp; inspection tools</h1>
            {prefill?.quality.length
              ? <p className="text-xs mb-3">Prefilled with <b>{prefill.quality.length}</b> checkpoint{prefill.quality.length === 1 ? "" : "s"} on file.</p>
              : null}
            <WorksheetTable rows={12} data={prefill?.quality} columns={["checkpoint_name","operation_after","tool_required","frequency","sample_size"]} />
            <h2 className="text-sm font-semibold mt-6 mb-2">Notes</h2>
            <div className="border border-black/40 h-40" />
          </PrintPage>)}

          {/* 10. ERP integration */}
          {isOn("erp") && (
          <PrintPage title="ERP Integration">
            <h1 className="text-xl font-bold mb-3">ERP connector questionnaire</h1>
            {prefill?.erp ? (
              <div className="border border-black/40 p-3 text-xs mb-4 bg-black/5">
                <div className="font-semibold mb-1">Current on-file configuration</div>
                <div>Connector: <b className="capitalize">{prefill.erp.connector ?? "—"}</b></div>
                <div>Base URL: <b>{prefill.erp.baseUrl ?? "—"}</b></div>
                <div>Persistence mode: <b className="capitalize">{prefill.erp.persistenceMode?.replace("_", "-") ?? "—"}</b></div>
              </div>
            ) : null}
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2"><span className="border border-black w-4 h-4 inline-block" /> Native (no ERP — JobLine is the system of record)</label>
              <label className="flex items-center gap-2"><span className="border border-black w-4 h-4 inline-block" /> JobBOSS</label>
              <label className="flex items-center gap-2"><span className="border border-black w-4 h-4 inline-block" /> SAP S/4HANA</label>
              <div className="mt-4">
                <div>Base URL: {prefill?.erp?.baseUrl ?? "______________________________________________"}</div>
                <div className="mt-2">Auth method: ______________________________________________</div>
                <div className="mt-2">Persistence mode: <label className="ml-2"><input type="checkbox" defaultChecked={prefill?.erp?.persistenceMode === "read_through"} /> read-through (ITAR default)</label> <label className="ml-4"><input type="checkbox" defaultChecked={prefill?.erp?.persistenceMode === "write_through"} /> write-through (non-ITAR only)</label></div>
              </div>
              <div className="mt-4">Notes: ____________________________________________________________</div>
              <div>____________________________________________________________</div>
            </div>
          </PrintPage>)}

          {/* 11. Go-live checklist */}
          {isOn("golive") && (
          <PrintPage title="Go-Live Checklist">
            <h1 className="text-xl font-bold mb-3">Go-live checklist</h1>
            <p className="text-xs mb-3">Mirrors the in-app concierge checklist. Tick alongside customer on walkthrough.</p>
            <ul className="text-xs space-y-2">
              {[
                "Organization profile, branding, ITAR posture",
                "Equipment & machine registry uploaded",
                "Departments & stations configured",
                "Users, roles & invites generated",
                "Routing templates with operations",
                "Quality checkpoints & inspection tools",
                "Documents: AS9100/ISO/ITAR policies, manuals",
                "ERP / JobBOSS / SAP connector configured",
                "OAP training programs assigned",
                "Final review & customer walkthrough completed",
              ].map((label, idx) => (
                <li key={idx} className="flex items-center gap-3 border-b border-black/20 pb-1">
                  <span className="border border-black w-4 h-4 inline-block shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 text-xs">
              <div className="border-b border-black h-8" />
              <div>Customer sign-off</div>
              <div className="border-b border-black h-8 mt-4 w-48" />
              <div>Date</div>
            </div>
          </PrintPage>)}

          {/* 12. Final Signature Page (2-party wet signature) */}
          {isOn("signature") && (
          <PrintPage title="Signature Page">
            <h1 className="text-2xl font-bold mb-2">Signature Page</h1>
            <p className="text-xs mb-6">
              By signing below, both parties acknowledge they have read and agree to the Master Services Agreement, ITAR / US-Person Declaration (if applicable), and all attached worksheets included in this Concierge Onboarding package.
            </p>

            <div className="grid grid-cols-2 gap-10 text-xs mt-10">
              <div className="space-y-6">
                <div className="font-semibold uppercase tracking-wider text-[10px]">Customer</div>
                <div>
                  <div className="border-b border-black h-12" />
                  <div className="mt-1">Signature</div>
                </div>
                <div>
                  <div className="border-b border-black h-8" />
                  <div className="mt-1">Printed name</div>
                </div>
                <div>
                  <div className="border-b border-black h-8" />
                  <div className="mt-1">Title</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="border-b border-black h-8" />
                    <div className="mt-1">Date</div>
                  </div>
                  <div>
                    <div className="border-b border-black h-8" />
                    <div className="mt-1">Company</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="font-semibold uppercase tracking-wider text-[10px]">JobLine AI, Inc.</div>
                <div>
                  <div className="border-b border-black h-12" />
                  <div className="mt-1">Signature</div>
                </div>
                <div>
                  <div className="border-b border-black h-8" />
                  <div className="mt-1">Printed name</div>
                </div>
                <div>
                  <div className="border-b border-black h-8" />
                  <div className="mt-1">Title</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="border-b border-black h-8" />
                    <div className="mt-1">Date</div>
                  </div>
                  <div>
                    <div className="border-b border-black h-8" />
                    <div className="mt-1">Witness (optional)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 border border-black/40 p-3 text-[11px]">
              <b>For sales rep:</b> after both parties have signed, scan the entire package (including this page and all initialled pages) to a single PDF and upload it via the Concierge workspace → <i>Wet-signature contract</i> panel. Reference engagement ID:{" "}
              <span className="font-mono">{engagement?.id ?? "(blank until assigned)"}</span>
            </div>
          </PrintPage>)}
        </>
      )}
    </div>
  );
}
