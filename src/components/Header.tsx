import { useState, useEffect } from "react";
import { Clock, Bell, Shield, ListTodo, Settings, Users, FlaskConical, Bug, Megaphone, Menu, Wrench } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import joblineLogo from "@/assets/jobline-logo.png";

function NavIconButton({ to, icon: Icon, label, iconClass }: { to: string; icon: React.ElementType; label: string; iconClass?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild>
          <Link to={to}>
            <Icon className={`w-5 h-5 ${iconClass || ""}`} />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function MobileNavLink({ to, icon: Icon, label, iconClass, onClose }: { to: string; icon: React.ElementType; label: string; iconClass?: string; onClose: () => void }) {
  return (
    <Link to={to} onClick={onClose} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-secondary transition-colors">
      <Icon className={`w-5 h-5 ${iconClass || "text-muted-foreground"}`} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export function Header() {
  const { user } = useAuth();
  const { hasAdminAccess, hasOrgAdminAccess, hasOrgSupervisorAccess, hasTestingAccess } = useAdminAccess();
  const { unreadCount, systemStatus, unacknowledgedRequired, acknowledgeUpdate } = useGlobalUpdates();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const shift = getCurrentShift();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const shiftStatus = shift === "Day" ? "ok" : shift === "Swing" ? "warning" : "info";

  const timeString = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
            <img src={joblineLogo} alt="JobLine.ai" className="h-8 lg:h-10 w-auto" />
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              {user && <TeamSelector />}
              {user && <NavIconButton to="/queue" icon={ListTodo} label="Queue Management" />}
              {hasOrgSupervisorAccess && <NavIconButton to="/teams" icon={Users} label="Team Management" />}
              {user && <NavIconButton to="/settings" icon={Settings} label="Settings" />}
              {hasAdminAccess && (
                <NavIconButton to="/admin" icon={Shield} label={hasOrgAdminAccess ? "Admin Dashboard" : "Supervisor Dashboard"} iconClass="text-primary" />
              )}
              {hasTestingAccess && <NavIconButton to="/testing" icon={FlaskConical} label="Testing Dashboard" iconClass="text-purple-500" />}
              <SystemStatusIndicator status={systemStatus} />
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
              <StatusBadge status={shiftStatus}>{shift} Shift</StatusBadge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">{timeString}</span>
              </div>
              {user && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIssueDialogOpen(true)}>
                      <Bug className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Report an Issue</TooltipContent>
                </Tooltip>
              )}
              <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-critical rounded-full" />
              </button>
              <UserMenu />
            </div>
          )}

          {/* Mobile nav */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-xs">{timeString}</span>
              </div>
              <UserMenu />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Menu className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-4">
                    {user && <TeamSelector />}
                    <Separator />
                    <nav className="flex flex-col gap-1">
                      {user && <MobileNavLink to="/queue" icon={ListTodo} label="Queue Management" onClose={() => setMobileMenuOpen(false)} />}
                      {hasOrgSupervisorAccess && <MobileNavLink to="/teams" icon={Users} label="Team Management" onClose={() => setMobileMenuOpen(false)} />}
                      {user && <MobileNavLink to="/settings" icon={Settings} label="Settings" onClose={() => setMobileMenuOpen(false)} />}
                      {hasAdminAccess && (
                        <MobileNavLink to="/admin" icon={Shield} label={hasOrgAdminAccess ? "Admin Dashboard" : "Supervisor Dashboard"} iconClass="text-primary" onClose={() => setMobileMenuOpen(false)} />
                      )}
                      {hasTestingAccess && (
                        <MobileNavLink to="/testing" icon={FlaskConical} label="Testing Dashboard" iconClass="text-purple-500" onClose={() => setMobileMenuOpen(false)} />
                      )}
                      {user && (
                        <MobileNavLink to="/updates" icon={Megaphone} label={`Updates${unreadCount > 0 ? ` (${unreadCount})` : ""}`} onClose={() => setMobileMenuOpen(false)} />
                      )}
                    </nav>
                    <Separator />
                    <div className="flex flex-col gap-3 px-2">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={shiftStatus}>{shift} Shift</StatusBadge>
                        <SystemStatusIndicator status={systemStatus} />
                      </div>
                      {user && (
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => { setMobileMenuOpen(false); setIssueDialogOpen(true); }}>
                          <Bug className="w-4 h-4" />
                          Report an Issue
                        </Button>
                      )}
                      <button className="relative flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors text-sm">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <span>Notifications</span>
                        <span className="w-2 h-2 bg-status-critical rounded-full" />
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>

      <IssueReportDialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen} />
      <UpdateAcknowledgeModal updates={unacknowledgedRequired} onAcknowledge={acknowledgeUpdate} />
    </header>
  );
}
