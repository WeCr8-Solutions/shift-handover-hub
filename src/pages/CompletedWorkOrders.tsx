import { CheckCircle2 } from "lucide-react";
import { WorkOrderStatusList } from "@/components/work-orders/WorkOrderStatusList";

export default function CompletedWorkOrders() {
  return (
    <WorkOrderStatusList
      config={{
        status: "completed",
        title: "Completed Work Orders",
        metaDescription: "Search and audit completed work orders with the closing station and timestamp.",
        icon: CheckCircle2,
        iconClassName: "text-success",
        timestampField: "completed_at",
        timestampLabel: "Closed",
        actorField: null,
        reasonField: null,
        banner: "Closed jobs. For full export and routing detail use Work Order History.",
        csvPrefix: "completed-work-orders",
      }}
    />
  );
}
