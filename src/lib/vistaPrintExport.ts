/**
 * Vista Print mailing list exporter.
 *
 * Generates an .xlsx that matches Vista Print's official "Mailing List Template"
 * (Vista_ListTemplate.xlsx) so the file can be uploaded directly to Vista's
 * postcard / direct-mail upload flow with no remapping.
 *
 * Template columns (exact header text, preserve the newline):
 *   1. "Recipient\n(Required if Company is empty)"
 *   2. "Company\n(Required if Recipient is empty)"
 *   3. "Address"
 *   4. "City"
 *   5. "State"
 *   6. "Zip code"
 */
import ExcelJS from "exceljs";

export interface VistaRecipient {
  /** Person name. Blank if you only have a company. */
  recipient?: string | null;
  /** Company / business name. Blank if you only have a person. */
  company?: string | null;
  /** Street address (line 1, optionally "line 1, line 2"). */
  address?: string | null;
  city?: string | null;
  /** 2-letter US state code, e.g. "CA". */
  state?: string | null;
  /** 5- or 9-digit US zip. */
  zip?: string | null;
}

/**
 * Parse a single-line address like
 *   "123 Main St, Santee, CA 92071"
 *   "123 Main St Suite 4, San Diego, CA 92101-1234"
 * into address / city / state / zip parts.
 *
 * Returns whatever could be parsed; unparseable input is returned with the
 * full string in `address` so the row is still usable by Vista's UI.
 */
export function parseUsAddressLine(line: string): {
  address: string;
  city: string;
  state: string;
  zip: string;
} {
  const trimmed = (line ?? "").trim();
  if (!trimmed) return { address: "", city: "", state: "", zip: "" };

  // street, city, ST zip[-zip4]
  const m = trimmed.match(
    /^(.+?),\s*([^,]+?),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/,
  );
  if (m) {
    return {
      address: m[1].trim(),
      city: m[2].trim(),
      state: m[3].toUpperCase(),
      zip: m[4],
    };
  }
  return { address: trimmed, city: "", state: "", zip: "" };
}

/**
 * Build a Vista-compatible workbook and return it as a Blob ready for download.
 */
export async function buildVistaPrintXlsx(
  rows: VistaRecipient[],
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "JobLine.ai";
  wb.created = new Date();
  const ws = wb.addWorksheet("Mailing List");

  const headers = [
    "Recipient\n(Required if Company is empty)",
    "Company\n(Required if Recipient is empty)",
    "Address",
    "City",
    "State",
    "Zip code",
  ];

  ws.columns = headers.map((h, i) => ({
    header: h,
    key: `c${i}`,
    width: i < 3 ? 40 : 20,
  }));

  const head = ws.getRow(1);
  head.height = 32;
  head.font = { bold: true };
  head.alignment = { wrapText: true, vertical: "middle" };
  head.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  };

  for (const r of rows) {
    ws.addRow({
      c0: r.recipient ?? "",
      c1: r.company ?? "",
      c2: r.address ?? "",
      c3: r.city ?? "",
      c4: r.state ?? "",
      c5: r.zip ?? "",
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Convenience helper: build + trigger a browser download with a dated filename.
 */
export async function downloadVistaPrintXlsx(
  rows: VistaRecipient[],
  filenameBase = "vista_mailing_list",
): Promise<number> {
  const blob = await buildVistaPrintXlsx(rows);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filenameBase}_${date}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
  return rows.length;
}
