import { cn } from "@/lib/utils";
import { JobState } from "@/types/handoff";

interface StatusBadgeProps {
  status: "ok" | "warning" | "critical" | "waiting" | "info";
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ status, children, className, pulse }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "status-badge",
        status === "ok" && "status-ok",
        status === "warning" && "status-warning",
        status === "critical" && "status-critical",
        status === "waiting" && "status-waiting",
        status === "info" && "status-info",
        pulse && "animate-pulse-glow",
        className
      )}
    >
      {children}
    </span>
  );
}

export function getJobStateStatus(state: JobState): "ok" | "warning" | "critical" | "waiting" | "info" {
  switch (state) {
    case "Part Running":
      return "ok";
    case "Setup in Progress":
    case "First Article in Process":
      return "warning";
    case "Waiting on QA":
    case "Waiting on Tooling":
    case "Waiting on Material":
      return "waiting";
    case "Machine Down / Issue":
      return "critical";
    default:
      return "info";
  }
}

export function getJobStateShortName(state: JobState): string {
  switch (state) {
    case "Part Running":
      return "Running";
    case "Setup in Progress":
      return "Setup";
    case "First Article in Process":
      return "First Article";
    case "Waiting on QA":
      return "QA Hold";
    case "Waiting on Tooling":
      return "Tooling";
    case "Waiting on Material":
      return "Material";
    case "Machine Down / Issue":
      return "Down";
    default:
      return state;
  }
}
