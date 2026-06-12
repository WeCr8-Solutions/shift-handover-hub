import { HubLayout, HubCard } from "@/components/hubs/HubLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PlusCircle, ListTodo, History, Workflow, ClipboardList, BarChart3, XCircle, PauseCircle, CheckCircle2 } from "lucide-react";

export default function WorkOrdersHub() {
  const { user } = useAuth();
  const { hasAdminAccess, hasOrgSupervisorAccess } = useAdminAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  if (!user) return null;

  const canSeeHistory = hasAdminAccess || hasOrgSupervisorAccess;

  const cards: HubCard[] = [
    {
      title: "Create Work Order",
      description: "Start a new manufacturing job from scratch or a template.",
      to: "/?new=work_order",
      icon: PlusCircle,
      cta: "New work order",
    },
    {
      title: "Active Work Orders",
      description: "All open jobs (pending, queued, in-progress, on-hold) across every type.",
      to: "/queue?view=list&status=pending,queued,in_progress,on_hold",
      icon: ListTodo,
    },
    {
      title: "Pending Approval",
      description: "New work orders awaiting supervisor approval before release.",
      to: "/queue?view=list&status=pending",
      icon: ClipboardList,
    },
    {
      title: "Routing & Operations",
      description: "Inspect routing steps, outside processing, and step status.",
      to: "/queue?view=list&type=work_order",
      icon: Workflow,
    },
    {
      title: "Work Order History",
      description: "Search completed work orders and export to QuickBooks/Excel.",
      to: "/history",
      icon: History,
      disabled: !canSeeHistory,
      disabledReason: "Supervisor or admin access required.",
    },
    {
      title: "Closed / Completed",
      description: "Filter and search completed work orders by station and date.",
      to: "/work-orders/completed",
      icon: CheckCircle2,
    },
    {
      title: "On-Hold Work Orders",
      description: "Review jobs paused on the floor with hold reason and station.",
      to: "/work-orders/on-hold",
      icon: PauseCircle,
    },
    {
      title: "Cancelled Work Orders",
      description: "Audit cancelled jobs with reason, station, and who cancelled them.",
      to: "/work-orders/cancelled",
      icon: XCircle,
    },
    {
      title: "Capacity & Planning",
      description: "Daily load by station with AI planning assistant.",
      to: "/planning-center",
      icon: ClipboardList,
    },
    {
      title: "WO Performance",
      description: "Live completion %, setup variance, and schedule status across open work orders.",
      to: "/work-orders/performance",
      icon: BarChart3,
    },
    {
      title: "Production Analytics",
      description: "Throughput, on-time rate, and cycle time trends.",
      to: "/admin?tab=analytics",
      icon: BarChart3,
      disabled: !canSeeHistory,
      disabledReason: "Supervisor or admin access required.",
    },
  ];

  return (
    <HubLayout
      title="Work Orders | JobLine.ai"
      metaDescription="Central hub for creating, tracking, and reviewing manufacturing work orders, routing, and production history."
      heading="Work Orders"
      subheading="Create, track, and review every job moving through the shop."
      cards={cards}
    />
  );
}
