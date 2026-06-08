/**
 * Reusable contract & SOP source text. Plain-text sections so a single
 * source feeds PDF preview, DOCX export, and the in-app print pack.
 */
export interface ContractContext {
  customerName: string;
  planTier: string;
  amount: string;
  effectiveDate: string;
  engagementId?: string | null;
  signerName?: string;
  signerTitle?: string;
}

export interface DocSection {
  heading?: string;
  body: string[]; // paragraphs
  list?: string[]; // optional bullet/numbered list after body
  listType?: "bullet" | "decimal";
}

export interface DocContent {
  title: string;
  subtitle?: string;
  sections: DocSection[];
  signatureBlock?: boolean;
}

export function msa(ctx: ContractContext): DocContent {
  return {
    title: "Concierge Onboarding Master Services Agreement",
    subtitle: `Between JobLine AI, Inc. and ${ctx.customerName}, effective ${ctx.effectiveDate}.`,
    sections: [
      { heading: "1. Services", body: [
        "JobLine will configure Customer's JobLine.ai facility, including: equipment & station registry, departments, user invites & roles, routing templates & quality checkpoints, OAP training program assignments, ERP / JobBOSS / SAP connector configuration (where applicable), ITAR / US-Person posture verification, and a final walkthrough call with Customer's supervisor.",
      ]},
      { heading: "2. Fee", body: [
        `Customer agrees to pay JobLine the one-time concierge fee of ${ctx.amount}. Payment may be made by Stripe, check (payable to "JobLine AI, Inc."), ACH, wire, or purchase order. Production access to JobLine.ai is gated and will not be activated until the fee is recorded as paid (or waived in writing by JobLine).`,
      ]},
      { heading: "3. Term", body: [
        "Engagement begins on the Effective Date and concludes when Customer is activated for production use. Either party may terminate for material breach with 10 days' written notice.",
      ]},
      { heading: "4. Data handling", body: [
        "Customer data is stored in JobLine's multi-tenant Cloud backend with row-level security and org-scoped isolation. For ITAR-controlled facilities, ERP-sourced data defaults to read-through mode (no JobLine persistence).",
      ]},
      { heading: "5. Confidentiality", body: [
        "Each party will protect the other's confidential information with the same care it uses for its own, and use it solely to perform under this Agreement.",
      ]},
      { heading: "6. Warranties; Limitation of Liability", body: [
        "Services are provided as-is. JobLine's aggregate liability arising out of this Agreement will not exceed the fees paid hereunder.",
      ]},
      { heading: "7. Subscription", body: [
        "Concierge services do not include the JobLine.ai monthly subscription, which is billed separately.",
      ]},
      { heading: "8. Governing law", body: [
        "This Agreement is governed by the laws of the State of Delaware.",
      ]},
    ],
    signatureBlock: true,
  };
}

export function itar(ctx: ContractContext): DocContent {
  return {
    title: "ITAR / US-Person Declaration",
    subtitle: `Customer: ${ctx.customerName}`,
    sections: [
      { body: ["Required if Customer handles ITAR-controlled work. Check one box and sign."] },
      { body: ["☐  Customer is NOT ITAR-controlled. JobLine may persist ERP-sourced data normally."] },
      { body: ["☐  Customer IS ITAR-controlled. JobLine must operate in read-through mode (no ERP-sourced persistence). All JobLine staff with access must be US persons."] },
    ],
    signatureBlock: true,
  };
}

export function nda(ctx: ContractContext): DocContent {
  return {
    title: "Mutual Non-Disclosure Agreement",
    subtitle: `Between JobLine AI, Inc. and ${ctx.customerName}, effective ${ctx.effectiveDate}.`,
    sections: [
      { heading: "1. Confidential Information", body: [
        "Each party (a \"Discloser\") may disclose to the other (a \"Recipient\") information that is marked confidential or that a reasonable person would consider confidential given its nature and the circumstances of disclosure.",
      ]},
      { heading: "2. Obligations", body: [
        "Recipient will (a) use Confidential Information solely to evaluate or perform under the Concierge engagement, (b) protect it with the same care as its own confidential information (and at minimum reasonable care), and (c) not disclose it to third parties without Discloser's prior written consent.",
      ]},
      { heading: "3. Exclusions", body: [
        "Obligations do not apply to information that is or becomes public through no fault of Recipient, was already lawfully known, is independently developed without use of Confidential Information, or is rightfully received from a third party without restriction.",
      ]},
      { heading: "4. Term", body: [
        "This NDA remains in effect for two (2) years from the Effective Date. Trade secrets remain protected for as long as they qualify as such under applicable law.",
      ]},
      { heading: "5. No license", body: [
        "Nothing in this NDA grants any license or other right to either party's intellectual property.",
      ]},
      { heading: "6. Governing law", body: [
        "This NDA is governed by the laws of the State of Delaware.",
      ]},
    ],
    signatureBlock: true,
  };
}

export function paymentInstructions(ctx: ContractContext): DocContent {
  return {
    title: "Payment Instructions",
    subtitle: `Total due: ${ctx.amount}. Production access is blocked until payment is recorded.`,
    sections: [
      { heading: "Credit card (online)", body: [
        "Pay instantly at https://jobline.ai/onboarding-service after logging in. Stripe receipt is issued automatically; engagement activates on webhook confirmation.",
      ]},
      { heading: "Check", body: [
        `Payable to "JobLine AI, Inc."`,
        "Mail to: JobLine AI, Inc., [mailing address on file]",
        `Memo: Concierge — ${ctx.customerName}`,
      ]},
      { heading: "ACH / Wire", body: [
        "Bank, routing, and account details are provided on the wire instructions sheet sent separately for security.",
        `Reference: Concierge — ${ctx.customerName}`,
      ]},
      { heading: "Purchase order", body: [
        "Email PO to billing@jobline.ai. Include the engagement ID and the customer name on the memo line.",
      ]},
      { heading: "Internal note", body: [
        "After deposit, the assigned sales rep opens this engagement in the Concierge workspace and records the payment on the Payment & Contract panel, attaching a scan/photo of the check or wire receipt as proof.",
      ]},
    ],
  };
}

export function employeeOnboardingSop(_ctx: ContractContext): DocContent {
  return {
    title: "JobLine Concierge Onboarding SOP",
    subtitle: "Internal use only — for JobLine staff running new-customer setup.",
    sections: [
      { heading: "Before the kickoff call", body: [
        "Verify the engagement exists in /admin/concierge with a signed contract OR Stripe payment recorded. Confirm ITAR posture in the org profile; if true, plan all data flows as read-through.",
      ]},
      { heading: "Kickoff call agenda (30 min)", body: [], list: [
        "Confirm primary admin contact, billing contact, and shop supervisor",
        "Walk the customer through the 10 intake modules in the Concierge workspace",
        "Decide upload path: Excel template, paper worksheets, or direct entry",
        "Set go-live target date and walkthrough call",
      ], listType: "decimal" },
      { heading: "During setup", body: [], list: [
        "Run all bulk imports via the Upload Utility (dedup is automatic)",
        "Verify Invites & Roles board shows every operator with an invite or claim",
        "Confirm Production Readiness blockers are all green or marked customer-pending",
        "Record any deviations in the engagement's audit timeline",
      ], listType: "decimal" },
      { heading: "Handoff to production", body: [
        "Click \"Mark ready for production\" only after readiness is green, payment is recorded, and contract is on file. Then click \"Activate customer login\" and email the customer their first-login instructions.",
      ]},
    ],
  };
}

export function employeeHandoffSop(_ctx: ContractContext): DocContent {
  return {
    title: "JobLine Post-Go-Live Handoff SOP",
    subtitle: "Internal use only — for JobLine staff transitioning a customer to Customer Success.",
    sections: [
      { heading: "Day 0 (go-live)", body: [], list: [
        "Confirm first operator login and first work-order pass through a station",
        "Send the customer the Documents pack (MSA copy, ITAR declaration, worksheets they completed)",
        "Open a 7-day check-in task in the Concierge workspace",
      ], listType: "decimal" },
      { heading: "Day 7 check-in", body: [], list: [
        "Review handoff records, NCRs, and downtime events for the first week",
        "Confirm subscription billing is active and the customer's seat count matches contract",
        "Transfer engagement ownership to Customer Success in the audit log",
      ], listType: "decimal" },
      { heading: "Escalation", body: [
        "ITAR data leak, billing dispute, or production blocker > 4 hours: page the on-call platform admin immediately and open a dev_issue_queue ticket with the engagement ID.",
      ]},
    ],
  };
}
