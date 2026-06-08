import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageOrientation, LevelFormat,
} from "docx";
import type { DocContent } from "../templates/contracts";

/** Render a DocContent into an editable .docx Blob. */
export async function renderDocDocx(doc: DocContent, footer?: string): Promise<Blob> {
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: doc.title, bold: true, size: 32, font: "Arial" })],
  }));

  if (doc.subtitle) {
    children.push(new Paragraph({
      children: [new TextRun({ text: doc.subtitle, italics: true, size: 20, font: "Arial" })],
      spacing: { after: 200 },
    }));
  }

  doc.sections.forEach((s) => {
    if (s.heading) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: s.heading, bold: true, size: 24, font: "Arial" })],
        spacing: { before: 200, after: 100 },
      }));
    }
    s.body.forEach((p) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: p, size: 22, font: "Arial" })],
        spacing: { after: 120 },
      }));
    });
    if (s.list?.length) {
      s.list.forEach((item) => {
        children.push(new Paragraph({
          numbering: s.listType === "decimal"
            ? { reference: "numbers", level: 0 }
            : { reference: "bullets", level: 0 },
          children: [new TextRun({ text: item, size: 22, font: "Arial" })],
        }));
      });
    }
  });

  if (doc.signatureBlock) {
    children.push(new Paragraph({ children: [new TextRun("")], spacing: { before: 400 } }));
    ["Customer signature: ____________________________   Date: ____________",
     "Printed name & title: ____________________________",
     "",
     "JobLine representative: ____________________________   Date: ____________",
     "Printed name & title: ____________________________"].forEach((line) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: line, size: 22, font: "Arial" })],
        spacing: { after: 100 },
      }));
    });
  }

  if (footer) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: footer, size: 16, color: "888888", italics: true, font: "Arial" })],
      spacing: { before: 400 },
    }));
  }

  const docx = new Document({
    numbering: {
      config: [
        { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
      children,
    }],
  });

  const buffer = await Packer.toBlob(docx);
  return buffer;
}
