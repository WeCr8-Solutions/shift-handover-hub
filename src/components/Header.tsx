import { Clock, Factory, Bell, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentShift } from "@/lib/mockData";
import { StatusBadge } from "./StatusBadge";
import { UserMenu } from "./UserMenu";
import { TeamSelector } from "./TeamSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Header() {
  const { user } = useAuth();
  const { hasAdminAccess } = useAdminAccess();
  const [currentTime, setCurrentTime] = useState(new Date());
  const shift = getCurrentShift();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const shiftStatus = shift === "Day" ? "ok" : shift === "Swing" ? "warning" : "info";

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
              <Factory className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">JobLine<span className="text-primary">.ai</span></h1>
              <p className="text-xs text-muted-foreground">Manufacturing Handoff System</p>
            </div>
          </Link>

          {/* Status Bar */}
          <div className="flex items-center gap-4">
            {/* Team Selector */}
            {user && <TeamSelector />}

            {/* Admin Link */}
            {hasAdminAccess && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link to="/admin">
                      <Shield className="w-5 h-5 text-primary" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Admin Dashboard</TooltipContent>
              </Tooltip>
            )}

            {/* Current Shift */}
            <div className="flex items-center gap-2">
              <StatusBadge status={shiftStatus}>
                {shift} Shift
              </StatusBadge>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-status-critical rounded-full" />
            </button>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
