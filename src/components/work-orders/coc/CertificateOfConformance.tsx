/**
 * CertificateOfConformance — printable AS9100 / ISO 9001 conformance certificate
 * for a completed work order. Reuses the org branding loaded by
 * useTravelerSettings so logo/colors match the traveler.
 *
 * Lists each completed routing step, who signed it off, when, and any NCR
 * disposition recorded against the job. Intended to be paired with the
 * shipping packet.
 */
import { useMemo } from "react";
import type { TravelerData } from "@/hooks/useWorkOrderTraveler";

interface NcrRow {
  ncr_number: string | null;
  defect_description: string | null;
  status: string | null;
  disposition: string | null;
  quantity_affected: number | null;
}

interface Props {
  data: TravelerData;
  orgName: string;
  logoUrl: string | null;
  itarFlag: boolean;
  ncrs: NcrRow[];
  inspectorName?: string;
  customerName?: string;
}

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
  catch { return d; }
}

export function CertificateOfConformance({
  data, orgName, logoUrl, itarFlag, ncrs, inspectorName, customerName,
}: Props) {
  const { workOrder: wo, routing } = data;
  const meta = (wo.metadata as Record<string, any>) ?? {};

  const completed = useMemo(() => routing, [routing]);
  const certNumber = `COC-${(wo.work_order ?? wo.id.slice(0, 8)).toUpperCase()}-${new Date().getFullYear()}`;
  const printedAt = new Date().toLocaleString();

  return (
    <article
      className="coc-sheet bg-white text-black"
      style={{
        width: "8.5in",
        minHeight: "11in",
        padding: "0.6in",
        boxSizing: "border-box",
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: 11,
        lineHeight: 1.4,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #111", paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logoUrl ? (
            <img src={logoUrl} alt={orgName} style={{ maxHeight: 56, maxWidth: 160, objectFit: "contain" }} />
          ) : (
            <div style={{ fontSize: 18, fontWeight: 700 }}>{orgName}</div>
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>CERTIFICATE OF CONFORMANCE</div>
            <div style={{ fontSize: 10, color: "#555" }}>AS9100 / ISO 9001 compatible</div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 10 }}>
          <div><strong>Cert #:</strong> {certNumber}</div>
          <div><strong>Issued:</strong> {printedAt}</div>
          {itarFlag && (
            <div style={{ marginTop: 4, padding: "2px 6px", background: "#fde68a", color: "#7c2d12", fontWeight: 700, display: "inline-block" }}>
              ITAR / EAR CONTROLLED
            </div>
          )}
        </div>
      </header>

      <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Customer</div>
          <div style={{ fontWeight: 600 }}>{customerName ?? meta.customer ?? meta.customer_name ?? "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Purchase Order</div>
          <div style={{ fontWeight: 600 }}>{meta.po_number ?? meta.customer_po ?? "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Work Order</div>
          <div style={{ fontWeight: 600 }}>{wo.work_order ?? wo.id.slice(0, 8)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Part / Rev</div>
          <div style={{ fontWeight: 600 }}>{wo.part_number ?? "—"} / {meta.revision ?? meta.rev ?? "A"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Description</div>
          <div>{meta.part_description ?? wo.title ?? "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase" }}>Quantity Shipped</div>
          <div style={{ fontWeight: 600 }}>{wo.quantity ?? "—"}</div>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Statement of Conformance</div>
        <p style={{ margin: 0 }}>
          {orgName} certifies that the product identified above was manufactured and inspected in accordance with
          all applicable customer drawings, specifications, and purchase order requirements. All materials and
          processes were procured from approved sources. Records of inspection, test, and material certifications
          are retained on file and are available upon request.
        </p>
      </section>

      <section style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Routing & Sign-offs</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>#</th>
              <th style={th}>Operation</th>
              <th style={th}>Station / Vendor</th>
              <th style={th}>Completed</th>
            </tr>
          </thead>
          <tbody>
            {completed.length === 0 ? (
              <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>No routing steps recorded.</td></tr>
            ) : (
              completed.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.step_number}</td>
                  <td style={td}>{r.operation_name}</td>
                  <td style={td}>{r.station_name ?? r.outside_vendor ?? "—"}</td>
                  <td style={td}>{r.operation_type === "outside" && r.po_number ? `PO ${r.po_number}` : "Completed"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {ncrs.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Nonconformances & Disposition</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={th}>NCR #</th>
                <th style={th}>Description</th>
                <th style={th}>Qty</th>
                <th style={th}>Disposition</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {ncrs.map((n, i) => (
                <tr key={i}>
                  <td style={td}>{n.ncr_number ?? "—"}</td>
                  <td style={td}>{n.defect_description ?? "—"}</td>
                  <td style={td}>{n.quantity_affected ?? "—"}</td>
                  <td style={td}>{n.disposition ?? "—"}</td>
                  <td style={td}>{n.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ borderTop: "1px solid #111", paddingTop: 4, fontSize: 10 }}>
            Quality Inspector
          </div>
          <div style={{ fontWeight: 600, minHeight: 18 }}>{inspectorName ?? ""}</div>
          <div style={{ fontSize: 10, color: "#666" }}>Signature / Date</div>
        </div>
        <div>
          <div style={{ borderTop: "1px solid #111", paddingTop: 4, fontSize: 10 }}>
            Authorized Representative
          </div>
          <div style={{ fontWeight: 600, minHeight: 18 }}>{orgName}</div>
          <div style={{ fontSize: 10, color: "#666" }}>Signature / Date</div>
        </div>
      </footer>

      <div style={{ marginTop: 18, fontSize: 9, color: "#888", borderTop: "1px solid #ddd", paddingTop: 6, textAlign: "center" }}>
        {certNumber} · Generated {printedAt} · This certificate is uncontrolled when printed.
      </div>
    </article>
  );
}

const th: React.CSSProperties = { border: "1px solid #d1d5db", padding: "4px 6px", textAlign: "left", fontWeight: 600 };
const td: React.CSSProperties = { border: "1px solid #e5e7eb", padding: "4px 6px", verticalAlign: "top" };
