import jsPDF from "jspdf";
import type { DocContent } from "../templates/contracts";

/**
 * Render a DocContent into a Letter-sized PDF using jsPDF text APIs
 * (no html2canvas — faster, smaller, selectable text).
 */
export function renderDocPdf(doc: DocContent, footer?: string): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginX = 54;
  const marginY = 60;
  const maxW = pageW - marginX * 2;
  let y = marginY;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - marginY) {
      pdf.addPage();
      y = marginY;
    }
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(doc.title, marginX, y);
  y += 22;

  if (doc.subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(doc.subtitle, maxW) as string[];
    lines.forEach((l) => { ensureSpace(14); pdf.text(l, marginX, y); y += 13; });
    y += 6;
  }

  doc.sections.forEach((s) => {
    if (s.heading) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      ensureSpace(18);
      pdf.text(s.heading, marginX, y);
      y += 14;
    }
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    s.body.forEach((p) => {
      const lines = pdf.splitTextToSize(p, maxW) as string[];
      lines.forEach((l) => { ensureSpace(14); pdf.text(l, marginX, y); y += 13; });
      y += 4;
    });
    if (s.list?.length) {
      s.list.forEach((item, i) => {
        const bullet = s.listType === "decimal" ? `${i + 1}.` : "•";
        const lines = pdf.splitTextToSize(`${bullet} ${item}`, maxW - 16) as string[];
        lines.forEach((l, idx) => {
          ensureSpace(14);
          pdf.text(l, marginX + (idx === 0 ? 0 : 14), y);
          y += 13;
        });
      });
      y += 4;
    }
    y += 4;
  });

  if (doc.signatureBlock) {
    y += 16;
    ensureSpace(120);
    const colW = (maxW - 24) / 2;
    const drawSig = (x: number, label: string) => {
      pdf.setDrawColor(0);
      pdf.line(x, y + 24, x + colW, y + 24);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(label, x, y + 38);
      pdf.line(x, y + 64, x + colW, y + 64);
      pdf.text("Printed name & title", x, y + 78);
      pdf.line(x, y + 100, x + colW * 0.5, y + 100);
      pdf.text("Date", x, y + 114);
    };
    drawSig(marginX, "Customer signature");
    drawSig(marginX + colW + 24, "JobLine representative signature");
    y += 130;
  }

  // Footer on every page
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    const footerText = footer ?? "Confidential — JobLine AI, Inc.";
    pdf.text(footerText, marginX, pageH - 30);
    pdf.text(`Page ${i} of ${pages}`, pageW - marginX, pageH - 30, { align: "right" });
  }

  return pdf.output("blob");
}
