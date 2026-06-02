/**
 * TravelerSheet — fully-rendered printable single-page Work Order Traveler.
 * - Uses inline print CSS so it stays consistent across screen preview & print.
 * - Pulls org branding from useTravelerSettings.
 * - Auto-fits Letter (8.5"x11") or A4.
 *
 * Print color note: the priority stripe uses fixed hex values (not semantic
 * tokens) because operators need the same red on every printer, and shadcn
 * tokens are HSL var-based which Chromium sometimes drops in print mode.
 */
import { useMemo } from "react";
import { Code128, QR } from "./TravelerBarcodes";
import type { TravelerData } from "@/hooks/useWorkOrderTraveler";
import type { TravelerSettings, PriorityColor } from "@/hooks/useTravelerSettings";

interface Props {
  data: TravelerData;
  settings: TravelerSettings;
  logoUrl: string | null;
  colorOverride?: PriorityColor;
  orgName: string;
  itarFlag: boolean;
  qrTarget?: string;
}

const COLOR_HEX: Record<PriorityColor, { stripe: string; band: string; ink: string; label: string }> = {
  red:    { stripe: "#c0392b", band: "#fdecea", ink: "#7f1f17", label: "RED PAPER" },
  orange: { stripe: "#d97706", band: "#fff3e0", ink: "#7a3e04", label: "ORANGE PAPER" },
  yellow: { stripe: "#ca8a04", band: "#fef9c3", ink: "#713f12", label: "YELLOW PAPER" },
  green:  { stripe: "#16a34a", band: "#dcfce7", ink: "#14532d", label: "GREEN PAPER" },
  blue:   { stripe: "#1d4ed8", band: "#dbeafe", ink: "#1e3a8a", label: "BLUE PAPER" },
  pink:   { stripe: "#db2777", band: "#fce7f3", ink: "#831843", label: "PINK PAPER" },
  white:  { stripe: "#374151", band: "#f3f4f6", ink: "#111827", label: "WHITE PAPER" },
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" }); }
  catch { return d; }
}

export function TravelerSheet({ data, settings, logoUrl, colorOverride, orgName, itarFlag, qrTarget }: Props) {
  const { workOrder: wo, routing, serials } = data;

  const resolvedColor: PriorityColor =
    colorOverride ?? (settings.priority_color_map[wo.priority] as PriorityColor) ?? "white";
  const color = COLOR_HEX[resolvedColor];

  const meta = (wo.metadata as Record<string, any>) ?? {};
  const part = {
    description: meta.part_description ?? meta.part_name ?? wo.title ?? "",
    material_group: meta.material_group ?? meta.material ?? "—",
    product_group: meta.product_group ?? meta.group ?? "—",
  };

  const counter = meta.counter ?? meta.cycle_counter ?? "—";
  const releaseDate = meta.release_date ?? wo.created_at;
  const startDate = meta.start_date ?? wo.scheduled_start;
  const firstOpNumber = wo.operation_number ?? routing[0]?.step_number?.toString() ?? "—";

  const serialRows = useMemo(() => {
    const qty = Math.min(Math.max(wo.quantity ?? 0, 0), 60);
    if (serials.length) return serials.slice(0, 60);
    return Array.from({ length: qty }, (_, i) => "");
  }, [serials, wo.quantity]);

  const qrValue = qrTarget ?? `${typeof window !== "undefined" ? window.location.origin : ""}/queue?wo=${encodeURIComponent(wo.work_order ?? wo.id)}`;
  const woBarcode = wo.work_order ?? wo.id.slice(0, 10).toUpperCase();
  const partBarcode = wo.part_number ?? "—";

  const printedAt = new Date().toLocaleString();
  const rev = (meta.revision ?? meta.rev ?? "A").toString();

  return (
    <article
      className="traveler-sheet bg-white text-black"
      style={{
        width: settings.paper_size === "a4" ? "210mm" : "8.5in",
        minHeight: settings.paper_size === "a4" ? "297mm" : "11in",
        padding: "0.35in",
        boxSizing: "border-box",
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: 11,
        lineHeight: 1.35,
        position: "relative",
      }}
    >
      {/* Priority side stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 14, background: color.stripe }} />

      {/* Header */}
      <header style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingLeft: 24 }}>
        <div style={{ width: 110, height: 70, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ddd", background: "#fff" }}>
          {logoUrl ? (
            <img src={logoUrl} alt={orgName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ fontSize: 9, color: "#888", textAlign: "center" }}>{orgName}</div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>
            {settings.company_name_line ?? orgName}
          </div>
          <h1 style={{ fontSize: 22, margin: "2px 0 4px", letterSpacing: 1, fontWeight: 800 }}>
            WORK ORDER TRAVELER
          </h1>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: color.band, color: color.ink, padding: "2px 10px", border: `1px solid ${color.stripe}`, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
            PRIORITY: {wo.priority.toUpperCase()} · PRINT ON {color.label}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <QR value={qrValue} size={92} />
          <Code128 value={woBarcode} label={`WO ${woBarcode}`} height={10} scale={1.6} />
        </div>
      </header>

      {/* Work Order Info */}
      <SectionTitle>Work Order Info</SectionTitle>
      <Grid cols={4}>
        <Field label="Work Order #" value={wo.work_order ?? "—"} mono />
        <Field label="First Op #" value={firstOpNumber} />
        <Field label="Release Date" value={fmtDate(releaseDate)} />
        <Field label="Due Date" value={fmtDate(wo.due_date)} />
        <Field label="Group" value={part.product_group} />
        <Field label="Counter" value={counter} />
        <Field label="Order Qty" value={wo.quantity?.toString() ?? "—"} />
        <Field label="Start Date" value={fmtDate(startDate)} />
      </Grid>

      {/* Part Info */}
      <SectionTitle>Part Info</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12 }}>
        <Grid cols={3}>
          <Field label="Part Number" value={wo.part_number ?? "—"} mono />
          <Field label="Material Group" value={part.material_group} />
          <Field label="Revision" value={rev} />
          <Field label="Description" value={part.description} colSpan={3} />
        </Grid>
        <Code128 value={partBarcode} label={`PART ${partBarcode}`} height={10} scale={1.6} />
      </div>

      {/* Product Grouping */}
      <SectionTitle>Product Grouping</SectionTitle>
      <Grid cols={3}>
        <Field label="Product Group" value={part.product_group} />
        <Field label="Customer" value={meta.customer ?? meta.customer_name ?? "—"} />
        <Field label="Job / Lot" value={meta.lot ?? meta.lot_number ?? wo.work_order ?? "—"} />
      </Grid>

      {/* Routing */}
      {settings.show_routing && (
        <>
          <SectionTitle>Routing & Operations</SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <Th w={28}>#</Th>
                <Th>Operation</Th>
                <Th w={120}>Work Center</Th>
                <Th w={50}>Est. Min</Th>
                <Th w={50}>Qty Good</Th>
                <Th w={50}>Qty Scrap</Th>
                <Th w={80}>Operator</Th>
                <Th w={70}>Date</Th>
              </tr>
            </thead>
            <tbody>
              {routing.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 12, textAlign: "center", color: "#666", border: "1px solid #ddd" }}>No routing steps defined</td></tr>
              ) : (
                routing.map((s) => (
                  <tr key={s.id}>
                    <Td>{s.step_number}</Td>
                    <Td>
                      {s.operation_name}
                      {s.operation_type === "outside_processing" && s.outside_vendor && (
                        <div style={{ fontSize: 9, color: "#666" }}>
                          OP @ {s.outside_vendor}{s.po_number ? ` · PO ${s.po_number}` : ""}{s.expected_return_date ? ` · ret ${fmtDate(s.expected_return_date)}` : ""}
                        </div>
                      )}
                    </Td>
                    <Td>{s.station_name ?? "—"}</Td>
                    <Td>{s.estimated_duration ?? ""}</Td>
                    <Td>&nbsp;</Td>
                    <Td>&nbsp;</Td>
                    <Td>&nbsp;</Td>
                    <Td>&nbsp;</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* Serial Numbers */}
      {settings.show_serials && serialRows.length > 0 && (
        <>
          <SectionTitle>Serial Numbers ({serialRows.length})</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, fontSize: 9 }}>
            {serialRows.map((sn, i) => (
              <div key={i} style={{ border: "1px solid #ddd", padding: "3px 5px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>{(i + 1).toString().padStart(3, "0")}</span>
                <span style={{ fontFamily: "ui-monospace, monospace" }}>{sn || "_____________"}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Comments / Special Instructions */}
      <SectionTitle>Comments & Special Instructions</SectionTitle>
      <div style={{ border: "1px solid #ddd", padding: 8, minHeight: 70, fontSize: 10, whiteSpace: "pre-wrap" }}>
        {wo.description || meta.special_instructions || ""}
        {/* Always leave ruled blank lines for floor notes */}
        <div style={{ marginTop: 8, borderTop: "1px dotted #ccc", height: 14 }} />
        <div style={{ borderTop: "1px dotted #ccc", height: 14 }} />
        <div style={{ borderTop: "1px dotted #ccc", height: 14 }} />
      </div>

      {/* Sign-off */}
      {settings.show_signoff && (
        <>
          <SectionTitle>ISO 9001 Sign-Off</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontSize: 10 }}>
            <SignoffBox label="Released By" />
            <SignoffBox label="Inspected By" />
            <SignoffBox label="Closed By" />
          </div>
        </>
      )}

      {/* Footer */}
      <footer style={{ marginTop: 14, paddingTop: 6, borderTop: "1px solid #ddd", display: "flex", justifyContent: "space-between", fontSize: 8, color: "#666" }}>
        <div>
          {settings.footer_text || `${orgName} · Controlled document`}
          {itarFlag && <span style={{ color: "#b91c1c", fontWeight: 700, marginLeft: 8 }}>ITAR — US PERSONS ONLY</span>}
        </div>
        <div>Rev {rev} · Printed {printedAt}</div>
      </footer>

      {/* Page break helper for multi-traveler print runs */}
      <div className="page-break" style={{ pageBreakAfter: "always" }} />
    </article>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "10px 0 4px", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", borderBottom: "2px solid #111", paddingBottom: 2 }}>
      {children}
    </h2>
  );
}

function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>{children}</div>;
}

function Field({ label, value, mono, colSpan }: { label: string; value: React.ReactNode; mono?: boolean; colSpan?: number }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", padding: "4px 6px", gridColumn: colSpan ? `span ${colSpan}` : undefined }}>
      <div style={{ fontSize: 8, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 600, fontFamily: mono ? "ui-monospace, monospace" : undefined }}>{value || "—"}</div>
    </div>
  );
}

function Th({ children, w }: { children: React.ReactNode; w?: number }) {
  return <th style={{ border: "1px solid #ddd", padding: "3px 5px", textAlign: "left", width: w }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ border: "1px solid #ddd", padding: "4px 5px", verticalAlign: "top", minHeight: 18 }}>{children}</td>;
}
function SignoffBox({ label }: { label: string }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 8 }}>
      <div style={{ fontSize: 8, color: "#666", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 18, borderTop: "1px solid #111", display: "flex", justifyContent: "space-between", fontSize: 8, color: "#666" }}>
        <span>Signature</span><span>Date</span>
      </div>
    </div>
  );
}
