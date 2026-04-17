import jsPDF from "jspdf";
import type {
  WalkthroughSection,
  WalkthroughItem,
  WalkthroughSession,
  WalkthroughCheckoff,
} from "@/hooks/useOapWalkthrough";

interface ExportInput {
  organizationName: string;
  session: WalkthroughSession;
  sections: WalkthroughSection[];
  items: WalkthroughItem[];
  checkoffs: WalkthroughCheckoff[];
}

const RESULT_LABEL: Record<string, string> = {
  pass: "PASS",
  needs_practice: "NEEDS PRACTICE",
  fail: "FAIL",
};

/**
 * AS9100 / ISO 9001 / OSHA-styled walkthrough compliance export.
 * Generates a portrait letter PDF and triggers a browser download.
 */
export function exportWalkthroughPdf(input: ExportInput) {
  const { organizationName, session, sections, items, checkoffs } = input;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const itemsBySection: Record<string, WalkthroughItem[]> = {};
  items.forEach((it) => (itemsBySection[it.section_id] ??= []).push(it));

  const checkoffByItem: Record<string, WalkthroughCheckoff> = {};
  checkoffs.forEach((c) => (checkoffByItem[c.item_id] = c));

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("OAP Mentor Walkthrough — Compliance Record", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "AS9100 Rev D · ISO 9001:2015 · OSHA 29 CFR 1910 — Operator Acceptance Program (OAP)",
    margin,
    50,
  );
  y = 90;

  // Meta block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(organizationName, margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const metaLines = [
    `Operator: ${session.operator_name ?? session.operator_id}`,
    `Primary mentor: ${session.primary_mentor_name ?? "—"}`,
    `Started: ${new Date(session.started_at).toLocaleString()}`,
    `Completed: ${session.completed_at ? new Date(session.completed_at).toLocaleString() : "In progress"}`,
    `Session ID: ${session.id}`,
  ];
  metaLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 13;
  });
  y += 8;

  // Summary
  const requiredItems = items.filter((i) => i.is_required);
  const passed = requiredItems.filter(
    (i) => checkoffByItem[i.id]?.result === "pass",
  ).length;
  doc.setFont("helvetica", "bold");
  doc.text(
    `Required items passed: ${passed} / ${requiredItems.length}`,
    margin,
    y,
  );
  y += 20;

  // Sections
  for (const section of sections) {
    const list = (itemsBySection[section.id] ?? []).sort(
      (a, b) => a.item_order - b.item_order,
    );
    if (!list.length) continue;
    ensureSpace(40);

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 12, pageWidth - margin * 2, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${section.section_order}. ${section.title}`, margin + 6, y + 3);
    y += 22;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    for (const item of list) {
      const c = checkoffByItem[item.id];
      const status = c ? RESULT_LABEL[c.result] : "NOT EVALUATED";
      const wrapped = doc.splitTextToSize(
        `• ${item.title}${item.is_required ? "  [Required]" : ""}`,
        pageWidth - margin * 2 - 110,
      );
      ensureSpace(wrapped.length * 12 + 18);

      doc.setTextColor(15, 23, 42);
      doc.text(wrapped, margin + 6, y);
      // Status pill
      const pillColor: [number, number, number] = c
        ? c.result === "pass"
          ? [22, 163, 74]
          : c.result === "needs_practice"
            ? [202, 138, 4]
            : [220, 38, 38]
        : [148, 163, 184];
      doc.setFillColor(...pillColor);
      doc.roundedRect(pageWidth - margin - 100, y - 9, 100, 14, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(status, pageWidth - margin - 50, y + 1, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);

      y += wrapped.length * 12;

      if (c) {
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        const sig = `Mentor: ${c.mentor_name} · Signed: ${c.mentor_signature} · ${new Date(c.signed_at).toLocaleString()}`;
        doc.text(sig, margin + 18, y + 2);
        y += 12;
        if (c.notes) {
          const noteLines = doc.splitTextToSize(
            `Notes: ${c.notes}`,
            pageWidth - margin * 2 - 18,
          );
          ensureSpace(noteLines.length * 10);
          doc.text(noteLines, margin + 18, y + 2);
          y += noteLines.length * 10;
        }
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
      }
      y += 8;
    }
    y += 6;
  }

  // Footer attestation on last page
  ensureSpace(80);
  y = Math.max(y, pageHeight - 110);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const attestation =
    "This record certifies that the above operator was evaluated against the organization's documented OAP " +
    "walkthrough criteria. Each check-off was authored by a designated mentor with a typed signature retained " +
    "in the system of record. Retention complies with AS9100 Rev D §7.5.3, ISO 9001:2015 §7.5, and applicable " +
    "OSHA 29 CFR 1910 documentation requirements.";
  const lines = doc.splitTextToSize(attestation, pageWidth - margin * 2);
  doc.text(lines, margin, y);

  // Page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${pages} · Generated ${new Date().toLocaleString()}`,
      pageWidth - margin,
      pageHeight - 24,
      { align: "right" },
    );
  }

  const safeName =
    (session.operator_name ?? "operator").replace(/[^a-z0-9]+/gi, "_") ||
    "operator";
  doc.save(`OAP-Walkthrough-${safeName}-${session.id.slice(0, 8)}.pdf`);
}
