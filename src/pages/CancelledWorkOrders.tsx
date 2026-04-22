import { XCircle } from "lucide-react";
import { WorkOrderStatusList } from "@/components/work-orders/WorkOrderStatusList";

export default function CancelledWorkOrders() {
  return (
    <WorkOrderStatusList
      config={{
        status: "cancelled",
        title: "Cancelled Work Orders",
        metaDescription: "Audit cancelled work orders with the reason, station, and who cancelled them.",
        icon: XCircle,
        iconClassName: "text-destructive",
        timestampField: "cancelled_at",
        timestampLabel: "Cancelled",
        actorField: "cancelled_by_name",
        actorLabel: "Cancelled By",
        reasonField: "cancellation_reason",
        reasonLabel: "Reason",
        banner: "Retained for audit. Cannot be deleted.",
        csvPrefix: "cancelled-work-orders",
      }}
    />
  );
}
