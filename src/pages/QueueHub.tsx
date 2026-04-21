import { HubLayout, HubCard } from "@/components/hubs/HubLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ListTodo, Kanban, Calendar, Sparkles, PlusCircle, ArrowRightLeft } from "lucide-react";

export default function QueueHub() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  if (!user) return null;

  const cards: HubCard[] = [
    {
      title: "Add to Queue",
      description: "Create a queue item: work order, station task, or support ticket.",
      to: "/?new=work_order",
      icon: PlusCircle,
      cta: "New item",
    },
    {
      title: "List View",
      description: "Sortable, filterable list of all queue items across the org.",
      to: "/queue?view=list",
      icon: ListTodo,
    },
    {
      title: "Kanban Board",
      description: "Drag items across Queued, In Progress, On Hold, and Completed.",
      to: "/queue?view=kanban",
      icon: Kanban,
    },
    {
      title: "Calendar",
      description: "Scheduled work and due dates on a visual calendar.",
      to: "/queue?view=calendar",
      icon: Calendar,
    },
    {
      title: "Handoffs & Deliveries",
      description: "Active station handoffs and material delivery requests.",
      to: "/queue?tab=handoffs",
      icon: ArrowRightLeft,
    },
    {
      title: "AI Planning Assistant",
      description: "Get suggestions on capability, workload, and station availability.",
      to: "/queue?assistant=open",
      icon: Sparkles,
    },
  ];

  return (
    <HubLayout
      title="Queue | JobLine.ai"
      metaDescription="Central hub for the production queue: list, kanban, calendar, handoffs, and AI planning."
      heading="Production Queue"
      subheading="Everything moving through the shop, in one place."
      cards={cards}
    />
  );
}
