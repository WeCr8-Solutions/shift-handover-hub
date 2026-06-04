import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useEngagement } from "@/hooks/useOnboardingEngagements";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Printable Concierge Sales Pack — platform-admin only.
 * Layout uses Tailwind print: utilities so the browser handles PDF export.
 * Optional :engagementId param fills in customer + engagement details;
 * without it the pack renders as a generic blank packet for in-person sales calls.
 */
const blankRows = (n: number) => Array.from({ length: n });

function PrintPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="page bg-white text-black mx-auto my-8 p-10 max-w-[8.5in] min-h-[10.5in] border print:border-0 print:my-0 print:p-[0.75in] print:break-after-page">
      <header className="flex items-center justify-between border-b border-black/30 pb-3 mb-6">
        <div className="font-bold text-lg tracking-tight">JobLine.ai · Concierge Onboarding</div>
        <div className="text-xs uppercase tracking-wider">{title}</div>
      </header>
      {children}
    </section>
  );
}

function WorksheetTable({ columns, rows = 10 }: { columns: string[]; rows?: number }) {
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
        {blankRows(rows).map((_, r) => (
          <tr key={r}>
            {columns.map((c) => (
              <td key={c} className="border border-black/30 h-7 px-2 align-top">&nbsp;</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ConciergeSalesPack() {
  const { engagementId } = useParams<{ engagementId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin: isPlatformAdmin, isDeveloper, loading: rolesLoading } = useAdminAccess();
  const { data: engagement, isLoading } = useEngagement(engagementId ?? null);

  useEffect(() => { document.title = "Concierge Sales Pack · JobLine.ai"; }, []);

  const today = useMemo(() => new Date().toLocaleDateString(), []);
  const orgName = engagement?.organizations?.name ?? "_________________________";
  const tier = engagement?.plan_tier ?? "standard";
  const amount = tier === "enterprise" ? "$4,500" : tier === "complimentary" ? "Complimentary" : "$1,500";

  if (authLoading || rolesLoading) return <Skeleton className="h-screen w-full" />;
  if (!user || !(isPlatformAdmin || isDeveloper)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Restricted to JobLine platform admins.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`@media print { @page { size: Letter; margin: 0; } body { background: white; } .no-print { display: none !important; } }`}</style>
      </Helmet>

      <div className="no-print sticky top-0 z-10 bg-background border-b px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Print preview · use your browser's print dialog to export PDF.
        </div>
        <Button size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      {isLoading && engagementId ? (
        <div className="p-8"><Skeleton className="h-96 w-full" /></div>
      ) : (
        <>
          {/* 1. Cover */}
          <PrintPage title="Cover">
            <div className="flex flex-col items-center justify-center text-center pt-16 space-y-6">
              <div className="text-5xl font-bold tracking-tight">Concierge Onboarding</div>
              <div className="text-xl">White-glove setup for your CNC shop</div>
              <div className="border-t border-b border-black/30 py-6 mt-12 w-full max-w-md">
                <div className="grid grid-cols-2 gap-y-2 text-sm text-left">
                  <div className="font-semibold">Customer</div><div>{orgName}</div>
                  <div className="font-semibold">Plan</div><div className="capitalize">{tier} — {amount}</div>
                  <div className="font-semibold">Date</div><div>{today}</div>
                  <div className="font-semibold">Sales rep</div><div>_________________________</div>
                  <div className="font-semibold">Engagement ID</div><div>{engagement?.id ?? "(assigned at signing)"}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-16 max-w-md">
                Return completed worksheets to onboarding@jobline.ai or upload via the Concierge workspace.
              </p>
            </div>
          </PrintPage>

          {/* 2. Master Services Agreement */}
          <PrintPage title="Master Services Agreement">
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
          </PrintPage>

          {/* 3. Payment instructions */}
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
          </PrintPage>

          {/* 4. ITAR / US-Person Declaration */}
          <PrintPage title="ITAR / US-Person Declaration">
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
          </PrintPage>

          {/* 5. Equipment */}
          <PrintPage title="Equipment Intake">
            <h1 className="text-xl font-bold mb-3">Equipment & machine registry</h1>
            <p className="text-xs mb-3">List every machine. Use one row per asset. Sales rep will upload these as the equipment CSV.</p>
            <WorksheetTable rows={18} columns={["asset_tag","name","equipment_type","manufacturer","model","serial_number","controller","machine_type"]} />
          </PrintPage>

          {/* 6. Stations & Departments */}
          <PrintPage title="Stations & Departments">
            <h1 className="text-xl font-bold mb-3">Departments & stations</h1>
            <p className="text-xs mb-3">Each station belongs to one department. Capacity is concurrent jobs; shift pattern is "day", "swing", or "24/7".</p>
            <WorksheetTable rows={18} columns={["department","station_name","station_id","station_type","capacity","shift_pattern"]} />
          </PrintPage>

          {/* 7. Users & Roles */}
          <PrintPage title="Users & Roles">
            <h1 className="text-xl font-bold mb-3">Users, roles & invites</h1>
            <p className="text-xs mb-3">Roles: <b>admin</b>, <b>supervisor</b>, <b>operator</b>. Mark "Send invite now" Y/N; QR/email invites expire in 15 days.</p>
            <WorksheetTable rows={18} columns={["email","first_name","last_name","role","department","default_station","phone","send_invite_now"]} />
          </PrintPage>

          {/* 8. Routing templates */}
          <PrintPage title="Routing Templates">
            <h1 className="text-xl font-bold mb-3">Routing templates</h1>
            <p className="text-xs mb-3">Group by template_name. Operations: turning, milling, drilling, grinding, finishing, inspection, assembly, packout.</p>
            <WorksheetTable rows={20} columns={["template_name","step_number","operation","work_center","setup_minutes","run_minutes_per_unit","dimension_spec","quality_checkpoint"]} />
          </PrintPage>

          {/* 9. Quality / Inspection */}
          <PrintPage title="Quality & Inspection">
            <h1 className="text-xl font-bold mb-3">Quality checkpoints &amp; inspection tools</h1>
            <WorksheetTable rows={12} columns={["checkpoint_name","operation_after","tool_required","frequency","sample_size"]} />
            <h2 className="text-sm font-semibold mt-6 mb-2">Notes</h2>
            <div className="border border-black/40 h-40" />
          </PrintPage>

          {/* 10. ERP integration */}
          <PrintPage title="ERP Integration">
            <h1 className="text-xl font-bold mb-3">ERP connector questionnaire</h1>
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2"><span className="border border-black w-4 h-4 inline-block" /> Native (no ERP — JobLine is the system of record)</label>
              <label className="flex items-center gap-2"><span className="border border-black w-4 h-4 inline-block" /> JobBOSS</label>
              <label className="flex items-center gap-2"><span className="border border-black w-4 h-4 inline-block" /> SAP S/4HANA</label>
              <div className="mt-4">
                <div>Base URL: ______________________________________________</div>
                <div className="mt-2">Auth method: ______________________________________________</div>
                <div className="mt-2">Persistence mode: <label className="ml-2"><input type="checkbox" /> read-through (ITAR default)</label> <label className="ml-4"><input type="checkbox" /> write-through (non-ITAR only)</label></div>
              </div>
              <div className="mt-4">Notes: ____________________________________________________________</div>
              <div>____________________________________________________________</div>
            </div>
          </PrintPage>

          {/* 11. Go-live checklist */}
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
          </PrintPage>
        </>
      )}
    </div>
  );
}
