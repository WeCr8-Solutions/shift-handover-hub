import { renderDocPdf } from "./renderers/renderPdf";
import { renderDocDocx } from "./renderers/renderDocx";
import { renderWorksheetXlsx } from "./renderers/renderXlsx";
import {
  msa, itar, nda, paymentInstructions, employeeOnboardingSop, employeeHandoffSop,
  type ContractContext, type DocContent,
} from "./templates/contracts";
import { INTAKE_COLUMNS, WORKSHEET_TITLES, type IntakeWorksheetKey } from "./intakeColumns";

export type DocumentFormat = "pdf" | "docx" | "xlsx";
export type DocumentAudience = "customer" | "staff" | "both";
export type DocumentKind = "contract" | "worksheet" | "sop" | "reference";

export interface ConciergeDocument {
  key: string;
  title: string;
  description: string;
  audience: DocumentAudience;
  kind: DocumentKind;
  formats: DocumentFormat[];
  /** When true, the doc inlines engagement details; without an engagement it falls back to blanks. */
  engagementAware: boolean;
  /** Build content for preview + PDF/DOCX renderers. Worksheets ignore this and use xlsx renderer. */
  buildContent?: (ctx: ContractContext) => DocContent;
  /** Worksheet key when kind === "worksheet". */
  worksheet?: IntakeWorksheetKey;
}

export const CONCIERGE_DOCUMENTS: ConciergeDocument[] = [
  // Contracts
  { key: "msa", title: "Master Services Agreement", description: "Concierge onboarding contract with fee, term, and signature block.", audience: "both", kind: "contract", formats: ["pdf", "docx"], engagementAware: true, buildContent: msa },
  { key: "itar_declaration", title: "ITAR / US-Person Declaration", description: "Checkbox declaration for ITAR-controlled facilities.", audience: "both", kind: "contract", formats: ["pdf", "docx"], engagementAware: true, buildContent: itar },
  { key: "nda_mutual", title: "Mutual Non-Disclosure Agreement", description: "Two-year mutual NDA, used during evaluation or pre-contract calls.", audience: "both", kind: "contract", formats: ["pdf", "docx"], engagementAware: true, buildContent: nda },
  { key: "payment_instructions", title: "Payment Instructions", description: "Stripe, check, ACH/wire, and PO payment options.", audience: "both", kind: "reference", formats: ["pdf", "docx"], engagementAware: true, buildContent: paymentInstructions },

  // Intake worksheets — match the in-app fields + Excel master template
  ...(Object.keys(INTAKE_COLUMNS) as IntakeWorksheetKey[]).map((k): ConciergeDocument => ({
    key: `worksheet_${k}`,
    title: `${WORKSHEET_TITLES[k]} worksheet`,
    description: `Paper/Excel intake worksheet for ${WORKSHEET_TITLES[k].toLowerCase()}. Matches the in-app fields exactly.`,
    audience: "both",
    kind: "worksheet",
    formats: ["xlsx", "pdf"],
    engagementAware: false,
    worksheet: k,
    buildContent: () => ({
      title: `${WORKSHEET_TITLES[k]} — Intake Worksheet`,
      subtitle: `Columns: ${INTAKE_COLUMNS[k].join(", ")}`,
      sections: [{ body: ["Use one row per record. Sales rep will upload these as a CSV/Excel batch."] }],
    }),
  })),

  // Internal SOPs
  { key: "employee_onboarding_sop", title: "Concierge Onboarding SOP (Staff)", description: "Step-by-step kickoff and setup playbook for JobLine staff.", audience: "staff", kind: "sop", formats: ["pdf", "docx"], engagementAware: false, buildContent: employeeOnboardingSop },
  { key: "employee_handoff_sop", title: "Post-Go-Live Handoff SOP (Staff)", description: "Day-0 and Day-7 handoff to Customer Success.", audience: "staff", kind: "sop", formats: ["pdf", "docx"], engagementAware: false, buildContent: employeeHandoffSop },
];

export function defaultContext(): ContractContext {
  return {
    customerName: "_________________________",
    planTier: "standard",
    amount: "$1,500",
    effectiveDate: new Date().toLocaleDateString(),
  };
}

export function engagementContext(engagement: any | null | undefined): ContractContext {
  if (!engagement) return defaultContext();
  const tier = engagement.plan_tier ?? "standard";
  const amount = tier === "enterprise" ? "$4,500" : tier === "complimentary" ? "Complimentary" : "$1,500";
  return {
    customerName: engagement.organizations?.name ?? "_________________________",
    planTier: tier,
    amount,
    effectiveDate: new Date().toLocaleDateString(),
    engagementId: engagement.id,
  };
}

export function buildFooter(ctx: ContractContext): string {
  const parts = ["Confidential — JobLine AI, Inc."];
  if (ctx.engagementId) parts.push(`Engagement ${ctx.engagementId.slice(0, 8)}`);
  parts.push(`Generated ${new Date().toLocaleString()}`);
  return parts.join(" · ");
}

export async function renderDocument(
  doc: ConciergeDocument,
  format: DocumentFormat,
  ctx: ContractContext,
): Promise<Blob> {
  if (doc.kind === "worksheet" && doc.worksheet && format === "xlsx") {
    return renderWorksheetXlsx(doc.worksheet);
  }
  if (!doc.buildContent) throw new Error(`No content builder for ${doc.key}`);
  const content = doc.buildContent(ctx);
  const footer = buildFooter(ctx);
  if (format === "pdf") return renderDocPdf(content, footer);
  if (format === "docx") return renderDocDocx(content, footer);
  // Worksheet PDF fallback uses the same renderer
  return renderDocPdf(content, footer);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function filenameFor(doc: ConciergeDocument, format: DocumentFormat, ctx: ContractContext): string {
  const safeCustomer = (ctx.customerName || "blank").replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
  return `jobline_${doc.key}_${safeCustomer}.${format}`;
}
