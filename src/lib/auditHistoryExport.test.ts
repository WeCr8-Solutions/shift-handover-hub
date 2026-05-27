import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuditBundle } from "@/hooks/useAuditExportBundle";

const { saveAsMock, pdfSave } = vi.hoisted(() => ({
  saveAsMock: vi.fn(),
  pdfSave: vi.fn(),
}));

// jsdom doesn't implement URL.createObjectURL / msSaveBlob; stub file-saver so
// we can assert what would be saved without touching the DOM download path.
vi.mock("file-saver", () => ({ saveAs: saveAsMock }));

// Stub jsPDF — we only need to assert `save()` is called with a sensible name.
vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    save: pdfSave,
  })),
}));

import {
  exportAuditBundleToExcel,
  exportAuditBundleToCSVZip,
  exportAuditBundleToQuickBooksCSV,
  exportAuditBundleToJSON,
  exportAuditBundleToPDF,
  printAuditBundleHTML,
} from "./auditHistoryExport";

// ---------- Seed ----------

function seedBundle(): AuditBundle {
  return {
    meta: {
      organization_id: "org-1",
      organization_name: "Acme Aerospace, Inc.",
      month: "2026-04",
      date_from: "2026-04-01",
      date_to: "2026-04-30",
      standard: "AS9100",
      generated_at: "2026-05-01T12:00:00.000Z",
      generated_by: "qa@acme.test",
      record_types: ["work_orders", "ncrs", "handoffs"],
    },
    data: {
      work_orders: [
        {
          id: "wo-1-uuid-1234",
          work_order: "WO-1001",
          part_number: "PN-A",
          title: "Bracket, fwd",
          status: "completed",
          priority: "normal",
          quantity: 25,
          completed_at: "2026-04-14T10:00:00.000Z",
          created_at: "2026-04-10T08:00:00.000Z",
        },
        {
          id: "wo-2-uuid-5678",
          work_order: "WO-1002",
          part_number: "PN-B",
          title: 'Strut "AFT"', // quote -> CSV escape
          status: "in_progress",
          priority: "high",
          quantity: 3,
          completed_at: null,
          created_at: "2026-04-12T08:00:00.000Z",
        },
      ],
      ncrs: [
        {
          id: "ncr-1",
          ncr_number: "NCR-2026-007",
          work_order_number: "WO-1001",
          defect_type: "dimensional",
          disposition: "rework",
          quantity_affected: 2,
          created_at: "2026-04-15T11:00:00.000Z",
        },
      ],
      handoffs: [],
    },
  };
}

// jsdom Blob doesn't round-trip binary parts through .text()/.arrayBuffer(),
// so we wrap the global to capture the raw input parts at construction time.
const RealBlob = globalThis.Blob;
class CapturingBlob extends RealBlob {
  __parts: any[];
  constructor(parts: any[] = [], opts?: BlobPropertyBag) {
    super(parts, opts);
    this.__parts = parts;
  }
}
(globalThis as any).Blob = CapturingBlob;

async function readBlobText(blob: any): Promise<string> {
  const parts = (blob.__parts ?? []) as any[];
  let out = "";
  for (const p of parts) {
    if (typeof p === "string") out += p;
    else if (p instanceof Uint8Array) out += new TextDecoder().decode(p);
    else if (p instanceof ArrayBuffer) out += new TextDecoder().decode(new Uint8Array(p));
  }
  return out;
}

async function readBlobBytes(blob: any): Promise<Uint8Array> {
  const parts = (blob.__parts ?? []) as any[];
  const chunks: Uint8Array[] = [];
  for (const p of parts) {
    if (p instanceof Uint8Array) chunks.push(p);
    else if (p instanceof ArrayBuffer) chunks.push(new Uint8Array(p));
    else if (typeof p === "string") chunks.push(new TextEncoder().encode(p));
  }
  const total = chunks.reduce((s, c) => s + c.byteLength, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.byteLength;
  }
  return out;
}

beforeEach(() => {
  saveAsMock.mockClear();
  pdfSave.mockClear();
});

describe("exportAuditBundleToJSON", () => {
  it("saves a JSON blob with the full bundle and audit-friendly filename", async () => {
    exportAuditBundleToJSON(seedBundle());
    expect(saveAsMock).toHaveBeenCalledTimes(1);
    const [blob, filename] = saveAsMock.mock.calls[0];
    expect(filename).toBe("JobLineAudit_acme-aerospace-inc_2026-04_bundle.json");
    expect(blob).toBeInstanceOf(Blob);
    const text = await new Response(blob as Blob).text();
    const parsed = JSON.parse(text);
    expect(parsed.meta.organization_name).toBe("Acme Aerospace, Inc.");
    expect(parsed.data.work_orders).toHaveLength(2);
  });
});

describe("exportAuditBundleToQuickBooksCSV", () => {
  it("maps work orders to QB columns and CSV-escapes quoted titles", async () => {
    exportAuditBundleToQuickBooksCSV(seedBundle());
    expect(saveAsMock).toHaveBeenCalledTimes(1);
    const [blob, filename] = saveAsMock.mock.calls[0];
    expect(filename).toBe("JobLineAudit_acme-aerospace-inc_2026-04_quickbooks.csv");
    const csv = await new Response(blob as Blob).text();
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Invoice No,Customer,Item,Quantity,Memo");
    // first row -> completed_at present -> 04/14/2026
    expect(lines[1]).toMatch(/^04\/14\/2026,WO-1001,"?Bracket, fwd"?,PN-A,25,/);
    // second row -> completed_at null -> falls back to created_at 04/12/2026
    expect(lines[2]).toMatch(/^04\/12\/2026,WO-1002,/);
    // CSV escaping: title with internal quote becomes "Strut ""AFT"""
    expect(csv).toContain('"Strut ""AFT"""');
  });

  it("handles empty work-orders bundle without throwing", () => {
    const b = seedBundle();
    b.data.work_orders = [];
    expect(() => exportAuditBundleToQuickBooksCSV(b)).not.toThrow();
    expect(saveAsMock).toHaveBeenCalled();
  });
});

describe("exportAuditBundleToExcel", () => {
  it("produces a workbook with cover sheet + one sheet per record type", async () => {
    await exportAuditBundleToExcel(seedBundle());
    expect(saveAsMock).toHaveBeenCalledTimes(1);
    const [blob, filename] = saveAsMock.mock.calls[0];
    expect(filename).toBe("JobLineAudit_acme-aerospace-inc_2026-04_bundle.xlsx");
    expect(blob).toBeInstanceOf(Blob);
    // xlsx is a zip; first bytes are "PK"
    const buf = new Uint8Array(await new Response(blob as Blob).arrayBuffer());
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });
});

describe("exportAuditBundleToCSVZip", () => {
  it("zips one CSV per requested record type + a README", async () => {
    await exportAuditBundleToCSVZip(seedBundle());
    const [blob, filename] = saveAsMock.mock.calls[0];
    expect(filename).toBe("JobLineAudit_acme-aerospace-inc_2026-04_bundle.zip");
    expect(blob).toBeInstanceOf(Blob);
    // unzip and inspect entries
    const JSZip = (await import("jszip")).default;
    const z = await JSZip.loadAsync(await new Response(blob as Blob).arrayBuffer());
    const names = Object.keys(z.files).sort();
    expect(names).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/README\.txt$/),
        expect.stringMatching(/work_orders\.csv$/),
        expect.stringMatching(/ncrs\.csv$/),
        expect.stringMatching(/handoffs\.csv$/),
      ])
    );
    const wo = await z.file(/work_orders\.csv$/)![0].async("string");
    expect(wo.split("\n")[0]).toContain("work_order");
    const ho = await z.file(/handoffs\.csv$/)![0].async("string");
    expect(ho).toBe("no records");
  });
});

describe("exportAuditBundleToPDF", () => {
  it("saves with audit-stamped filename", () => {
    exportAuditBundleToPDF(seedBundle());
    expect(pdfSave).toHaveBeenCalledWith(
      "JobLineAudit_acme-aerospace-inc_2026-04_summary.pdf"
    );
  });
});

describe("printAuditBundleHTML", () => {
  it("opens a print window with bundle title and clause label", () => {
    const docMock = { write: vi.fn(), close: vi.fn() };
    const winMock = { document: docMock, focus: vi.fn(), print: vi.fn() };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(winMock as any);
    printAuditBundleHTML(seedBundle());
    expect(openSpy).toHaveBeenCalled();
    const html = docMock.write.mock.calls[0][0] as string;
    expect(html).toContain("JobLine.ai Audit Evidence");
    expect(html).toContain("Acme Aerospace, Inc.");
    expect(html).toContain("AS9100 Rev D");
    expect(html).toContain("Work Orders");
    openSpy.mockRestore();
  });

  it("no-ops gracefully when popup is blocked", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null as any);
    expect(() => printAuditBundleHTML(seedBundle())).not.toThrow();
    openSpy.mockRestore();
  });
});
