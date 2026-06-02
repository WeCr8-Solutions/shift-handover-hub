/**
 * WorkOrderTraveler — dedicated printable route at /work-orders/:id/traveler.
 * Renders one or more TravelerSheet pages, hides app chrome, and auto-prints
 * when ?print=1 is passed.
 *
 * Color override via ?color=red|orange|yellow|white|blue|green|pink.
 * Multiple WOs via ?ids=uuid1,uuid2,...  (falls back to :id when not present).
 */
import { useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useWorkOrderTraveler } from "@/hooks/useWorkOrderTraveler";
import { useTravelerSettings, type PriorityColor } from "@/hooks/useTravelerSettings";
import { useOrgContext } from "@/contexts/OrgContext";
import { TravelerSheet } from "@/components/work-orders/traveler/TravelerSheet";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

const VALID_COLORS: PriorityColor[] = ["red", "orange", "yellow", "white", "blue", "green", "pink"];

function TravelerOne({ workOrderId, color }: { workOrderId: string; color?: PriorityColor }) {
  const { data } = useWorkOrderTraveler(workOrderId);
  const { settings, logoUrl } = useTravelerSettings();
  const { organization } = useOrgContext();

  if (!data) return (
    <div className="p-8 text-center text-sm text-muted-foreground">Loading work order {workOrderId}…</div>
  );

  return (
    <TravelerSheet
      data={data}
      settings={settings}
      logoUrl={logoUrl}
      colorOverride={color}
      orgName={organization?.name ?? "Organization"}
      itarFlag={!!organization?.requires_us_person_declaration}
    />
  );
}

export default function WorkOrderTraveler() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();

  const ids = useMemo(() => {
    const csv = params.get("ids");
    if (csv) return csv.split(",").map((s) => s.trim()).filter(Boolean);
    return id ? [id] : [];
  }, [id, params]);

  const colorParam = params.get("color")?.toLowerCase() as PriorityColor | undefined;
  const color = colorParam && VALID_COLORS.includes(colorParam) ? colorParam : undefined;
  const autoPrint = params.get("print") !== "0";

  useEffect(() => {
    if (!autoPrint || ids.length === 0) return;
    // Wait one tick after paint so canvases (barcodes/QR) render before the
    // browser print dialog snapshots the page.
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, [autoPrint, ids.length]);

  return (
    <>
      <style>{`
        @media print {
          .traveler-toolbar { display: none !important; }
          body { background: white !important; }
          .traveler-sheet { box-shadow: none !important; margin: 0 !important; }
          @page { margin: 0; size: auto; }
        }
        body { background: #f3f4f6; }
        .traveler-sheet { margin: 16px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      `}</style>

      <div className="traveler-toolbar sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <Link to="/queue" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>
        <div className="text-xs text-muted-foreground">
          {ids.length} traveler{ids.length === 1 ? "" : "s"}{color ? ` · ${color.toUpperCase()} paper` : ""}
        </div>
        <Button size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      <main>
        {ids.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No work order specified.</div>
        ) : (
          ids.map((wid) => <TravelerOne key={wid} workOrderId={wid} color={color} />)
        )}
      </main>
    </>
  );
}
