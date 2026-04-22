import { PauseCircle } from "lucide-react";
import { WorkOrderStatusList } from "@/components/work-orders/WorkOrderStatusList";

export default function OnHoldWorkOrders() {
  return (
    <WorkOrderStatusList
      config={{
        status: "on_hold",
        title: "On-Hold Work Orders",
        metaDescription: "Review work orders currently on hold with the reason, station, and who placed the hold.",
        icon: PauseCircle,
        iconClassName: "text-warning",
        timestampField: "on_hold_at",
        timestampLabel: "Held",
        actorField: "on_hold_by_name",
        actorLabel: "Held By",
        reasonField: "hold_reason",
        reasonLabel: "Hold Reason",
        banner: "Production paused. Resume from the queue when the block clears.",
        csvPrefix: "on-hold-work-orders",
      }}
    />
  );
}
