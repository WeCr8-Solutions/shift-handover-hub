import { mockMachines, mockHandoffRecords } from "@/lib/mockData";
import { Activity, AlertTriangle, Wrench, Clock } from "lucide-react";

export function ShiftStats() {
  const runningMachines = mockMachines.filter(
    (m) => m.currentJob?.state === "Part Running"
  ).length;
  
  const downMachines = mockMachines.filter(
    (m) => m.currentJob?.state === "Machine Down / Issue"
  ).length;
  
  const setupMachines = mockMachines.filter(
    (m) => m.currentJob?.state === "Setup in Progress" || m.currentJob?.state === "First Article in Process"
  ).length;

  const pendingHandoffs = mockHandoffRecords.length;

  const stats = [
    {
      label: "Running",
      value: runningMachines,
      total: mockMachines.length,
      icon: Activity,
      color: "text-status-ok",
      bgColor: "bg-status-ok/10",
    },
    {
      label: "Down",
      value: downMachines,
      total: mockMachines.length,
      icon: AlertTriangle,
      color: "text-status-critical",
      bgColor: "bg-status-critical/10",
    },
    {
      label: "In Setup",
      value: setupMachines,
      total: mockMachines.length,
      icon: Wrench,
      color: "text-status-warning",
      bgColor: "bg-status-warning/10",
    },
    {
      label: "Recent Handoffs",
      value: pendingHandoffs,
      icon: Clock,
      color: "text-status-info",
      bgColor: "bg-status-info/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border border-border rounded-lg p-4 bg-card"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {stat.value}
                {stat.total && (
                  <span className="text-sm text-muted-foreground font-normal">
                    /{stat.total}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
