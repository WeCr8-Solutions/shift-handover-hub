import { Card, CardContent } from "@/components/ui/card";
import { useEngagementsList } from "@/hooks/useOnboardingEngagements";

export function ConciergeKpiStrip() {
  const { data } = useEngagementsList();
  const rows = data ?? [];
  const active = rows.filter((r) => !["live", "cancelled"].includes(r.status)).length;
  const awaitingPayment = rows.filter((r) => !["paid", "waived"].includes(r.payment_status)).length;
  const awaitingContract = rows.filter(
    (r) => r.purchased_via !== "stripe" && r.payment_status !== "waived" && !r.contract_signed_at,
  ).length;
  const readyToActivate = rows.filter((r) => r.status === "ready_for_production").length;
  const live = rows.filter((r) => r.status === "live").length;

  const items = [
    { label: "Active", value: active },
    { label: "Awaiting payment", value: awaitingPayment },
    { label: "Awaiting contract", value: awaitingContract },
    { label: "Ready to activate", value: readyToActivate },
    { label: "Live", value: live },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {items.map((i) => (
        <Card key={i.label}>
          <CardContent className="py-3 px-3">
            <div className="text-2xl font-semibold leading-none">{i.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{i.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
