/**
 * WorkOrderCoC — printable Certificate of Conformance route at
 * /work-orders/:id/coc. Auto-prints unless ?print=0.
 */
import { useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkOrderTraveler } from "@/hooks/useWorkOrderTraveler";
import { useTravelerSettings } from "@/hooks/useTravelerSettings";
import { useOrgContext } from "@/contexts/OrgContext";
import { CertificateOfConformance } from "@/components/work-orders/coc/CertificateOfConformance";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export default function WorkOrderCoC() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const autoPrint = params.get("print") !== "0";

  const { data: traveler } = useWorkOrderTraveler(id);
  const { logoUrl } = useTravelerSettings();
  const { organization } = useOrgContext();

  const { data: ncrs = [] } = useQuery({
    enabled: !!id,
    queryKey: ["coc-ncrs", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ncrs")
        .select("ncr_number, defect_description, status, disposition, quantity_affected")
        .eq("queue_item_id", id!);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!autoPrint || !traveler) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [autoPrint, traveler]);

  return (
    <>
      <style>{`
        @media print {
          .coc-toolbar { display: none !important; }
          body { background: white !important; }
          .coc-sheet { box-shadow: none !important; margin: 0 !important; }
          @page { margin: 0; size: auto; }
        }
        body { background: #f3f4f6; }
        .coc-sheet { margin: 16px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      `}</style>

      <div className="coc-toolbar sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <Link to="/queue" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>
        <div className="text-xs text-muted-foreground">Certificate of Conformance</div>
        <Button size="sm" onClick={() => window.print()} className="gap-2" data-testid="coc-print">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      <main>
        {!traveler ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading work order…</div>
        ) : (
          <CertificateOfConformance
            data={traveler}
            orgName={organization?.name ?? "Organization"}
            logoUrl={logoUrl}
            itarFlag={!!organization?.requires_us_person_declaration}
            ncrs={ncrs as any}
          />
        )}
      </main>
    </>
  );
}
