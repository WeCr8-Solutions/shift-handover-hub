import { useState, useEffect } from "react";
import { Clock, Bell, Shield, ListTodo, Settings, Users, FlaskConical, Bug, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentShift } from "@/lib/mockData";
import { StatusBadge } from "./StatusBadge";
import { UserMenu } from "./UserMenu";
import { TeamSelector } from "./TeamSelector";
import { IssueReportDialog } from "./IssueReportDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useGlobalUpdates } from "@/hooks/useGlobalUpdates";
import { SystemStatusIndicator } from "@/components/updates/SystemStatusIndicator";
import { UpdateAcknowledgeModal } from "@/components/updates/UpdateAcknowledgeModal";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import joblineLogo from "@/assets/jobline-logo.png";

export function Header() {
  const { user } = useAuth();
  const { 
    hasAdminAccess, 
    hasOrgAdminAccess, 
    hasOrgSupervisorAccess,
    hasTestingAccess 
  } = useAdminAccess();
  const { unreadCount, systemStatus, unacknowledgedRequired, acknowledgeUpdate } = useGlobalUpdates();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
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
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={joblineLogo} alt="JobLine.ai" className="h-8 w-auto" />
          </Link>

          {/* Status Bar */}
          <div className="flex items-center gap-4">
            {/* Team Selector */}
            {user && <TeamSelector />}

            {/* Queue Link */}
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/queue">
                      <ListTodo className="w-5 h-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Queue Management</TooltipContent>
              </Tooltip>
            )}

            {/* Teams Link - Org Admins & Supervisors */}
            {hasOrgSupervisorAccess && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/teams">
                      <Users className="w-5 h-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Team Management</TooltipContent>
              </Tooltip>
            )}

            {/* Settings Link */}
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/settings">
                      <Settings className="w-5 h-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            )}

            {/* Admin Link - Org Admins, Supervisors & Platform Admins */}
            {hasAdminAccess && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link to="/admin">
                      <Shield className="w-5 h-5 text-primary" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasOrgAdminAccess ? "Admin Dashboard" : "Supervisor Dashboard"}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Testing Link - Developers only */}
            {hasTestingAccess && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/testing">
                      <FlaskConical className="w-5 h-5 text-purple-500" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Testing Dashboard</TooltipContent>
              </Tooltip>
            )}

            {/* System Status */}
            <SystemStatusIndicator status={systemStatus} />

            {/* Updates Link */}
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link to="/updates">
                      <Megaphone className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>System Updates{unreadCount > 0 ? ` (${unreadCount} new)` : ""}</TooltipContent>
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

            {/* Report Issue Button - Only for authenticated users */}
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIssueDialogOpen(true)}
                  >
                    <Bug className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Report an Issue</TooltipContent>
              </Tooltip>
            )}

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

      {/* Issue Report Dialog */}
      <IssueReportDialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen} />

      {/* Acknowledge Modal */}
      <UpdateAcknowledgeModal updates={unacknowledgedRequired} onAcknowledge={acknowledgeUpdate} />
    </header>
  );
}
