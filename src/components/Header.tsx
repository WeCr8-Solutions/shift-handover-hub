import { useState, useEffect } from "react";
import { Clock, Bell, Shield, ListTodo, Settings, Users, FlaskConical, Bug, Megaphone, Menu, Wrench, ChevronDown, LayoutDashboard, Monitor, Factory, Eye, History, FileQuestion, ClipboardCheck, GraduationCap, IdCard, Globe, Inbox } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentShift } from "@/lib/mockData";
import { StatusBadge } from "./StatusBadge";
import { UserMenu } from "./UserMenu";
import { TeamSelector } from "./TeamSelector";
import { IssueReportDialog } from "./IssueReportDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useHasOperatorProfile } from "@/hooks/useHasOperatorProfile";
import { useGlobalUpdates } from "@/hooks/useGlobalUpdates";
import { SystemStatusIndicator } from "@/components/updates/SystemStatusIndicator";
import { UpdateAcknowledgeModal } from "@/components/updates/UpdateAcknowledgeModal";
import { NotificationPanel, useNotificationBadgeCount } from "@/components/NotificationPanel";
import { useTalentInboxUnread } from "@/hooks/useTalentInboxUnread";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { platformFeatures, extensionItems, industryCategories, learnCategories, companyItems } from "@/components/marketing/navData";
import { industrySlugFromName } from "@/pages/industries/industryData";
import joblineLogo from "@/assets/jobline-logo.png";

function NavIconButton({ to, icon: Icon, label, iconClass, badgeCount }: { to: string; icon: React.ElementType; label: string; iconClass?: string; badgeCount?: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link to={to}>
            <Icon className={`w-5 h-5 ${iconClass || ""}`} />
            {badgeCount && badgeCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
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

function MobileCollapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 pb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-2 py-2.5 text-sm font-medium text-foreground"
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pl-2 pb-2">{children}</div>}
    </div>
  );
}

/* ── Header dropdown ── */
function HeaderDropdown({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground text-xs">
          {label}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasAdminAccess, hasOrgAdminAccess, hasOrgSupervisorAccess, hasTestingAccess } = useAdminAccess();
  const { hasProfile: hasTalentProfile } = useHasOperatorProfile();
  const { unreadCount, systemStatus, unacknowledgedRequired, acknowledgeUpdate } = useGlobalUpdates();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifBadgeCount = useNotificationBadgeCount();
  const talentInboxUnread = useTalentInboxUnread();
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

  const canViewProductionFloor = hasAdminAccess || hasOrgSupervisorAccess;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
            <img src={joblineLogo} alt="JobLine.ai" width={40} height={40} decoding="async" className="h-8 lg:h-10 w-auto" />
          </Link>

          {/* Desktop nav — flex-1 so it never pushes the right-side off screen */}
          {!isMobile && (
            <div className="flex items-center gap-1 min-w-0 overflow-hidden flex-1">
              {/* Dashboard button — context-aware: production + talent dashboards */}
              {user && (canViewProductionFloor || hasTalentProfile) ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="gap-1.5 shrink-0">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {canViewProductionFloor && (
                      <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Shop Floor</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                          <Factory className="w-4 h-4 mr-2" />
                          Production Floor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/dashboard?view=operator")}>
                          <Eye className="w-4 h-4 mr-2" />
                          Operator View
                        </DropdownMenuItem>
                      </>
                    )}
                    {hasTalentProfile && canViewProductionFloor && <DropdownMenuSeparator />}
                    {hasTalentProfile && (
                      <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Talent Network</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate("/talent/dashboard")}>
                          <IdCard className="w-4 h-4 mr-2" />
                          Talent Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/talent")}>
                          <Globe className="w-4 h-4 mr-2" />
                          Browse Talent
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : user ? (
                <Button variant="default" size="sm" className="gap-1.5 shrink-0" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </Button>
              ) : null}

              {user && <TeamSelector />}

              {/* App action icons — before marketing nav when logged in */}
              {user && <NavIconButton to="/queue" icon={ListTodo} label="Queue Management" />}
              {(hasAdminAccess || hasOrgSupervisorAccess) && <NavIconButton to="/history" icon={History} label="Work Order History" />}
              {(hasAdminAccess || hasOrgSupervisorAccess) && <NavIconButton to="/quote-history" icon={FileQuestion} label="Quote History" />}
              <NavIconButton to="/tools" icon={Wrench} label="Operator Tools" />
              {hasOrgSupervisorAccess && <NavIconButton to="/teams" icon={Users} label="Team Management" />}
              {(hasOrgAdminAccess || hasOrgSupervisorAccess) && <NavIconButton to="/oap/employer" icon={ClipboardCheck} label="OAP Employer Console" />}
              {(hasOrgAdminAccess || hasOrgSupervisorAccess) && <NavIconButton to="/gca/employer" icon={GraduationCap} label="GCA Employer Console" />}
              {user && hasTalentProfile && (
                <NavIconButton to="/operator/inbox" icon={Inbox} label="Recruiter Inbox" badgeCount={talentInboxUnread} />
              )}
              {user && <NavIconButton to="/settings" icon={Settings} label="Settings" />}
              {hasAdminAccess && (
                <NavIconButton to="/admin" icon={Shield} label={hasOrgAdminAccess ? "Admin Dashboard" : "Supervisor Dashboard"} iconClass="text-primary" />
              )}
              {hasTestingAccess && <NavIconButton to="/testing" icon={FlaskConical} label="Testing Dashboard" iconClass="text-purple-500" />}

              {/* Marketing/info dropdowns — only show for non-logged-in users */}
              {!user && (
              <div className="flex items-center gap-1">
                <HeaderDropdown label="Products">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Platform</DropdownMenuLabel>
                  {platformFeatures.map((p) => (
                    <DropdownMenuItem key={p.href} onClick={() => navigate(p.href)}>
                      <p.icon className="w-4 h-4 mr-2 text-primary" />
                      <div>
                        <div className="text-sm">{p.label}</div>
                        <div className="text-[11px] text-muted-foreground">{p.desc}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Developer Tools</DropdownMenuLabel>
                  {extensionItems.map((ext) => (
                    <DropdownMenuItem key={ext.label} onClick={() => navigate(ext.href)}>
                      <ext.icon className="w-4 h-4 mr-2 text-primary" />
                      <div>
                        <div className="text-sm">{ext.label}</div>
                        <div className="text-[11px] text-muted-foreground">{ext.desc}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </HeaderDropdown>

                <HeaderDropdown label="Industries">
                  {industryCategories.map((cat) => (
                    <div key={cat.heading}>
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">{cat.heading}</DropdownMenuLabel>
                      {cat.items.map((item) => (
                        <DropdownMenuItem key={item} onClick={() => navigate(`/industries/${industrySlugFromName(item)}`)}>
                          {item}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </HeaderDropdown>

                <HeaderDropdown label="Learn">
                  {learnCategories.map((cat) => (
                    <div key={cat.heading}>
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">{cat.heading}</DropdownMenuLabel>
                      {cat.items.map((item) => (
                        <DropdownMenuItem key={item.href} onClick={() => navigate(item.href)}>
                          <item.icon className="w-4 h-4 mr-2 text-primary" />
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </HeaderDropdown>

                <HeaderDropdown label="Company">
                  {companyItems.map((item) => (
                    <DropdownMenuItem key={item.href} onClick={() => navigate(item.href)}>
                      <item.icon className="w-4 h-4 mr-2 text-primary" />
                      <div>
                        <div className="text-sm">{item.label}</div>
                        {item.desc && <div className="text-[11px] text-muted-foreground">{item.desc}</div>}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </HeaderDropdown>
              </div>
              )}


            </div>
          )}

          {/* Right-side / mobile row — ml-auto shrink-0 guarantees it is always visible */}
          {!isMobile ? (
            <div className="flex items-center gap-1 shrink-0 ml-auto">
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
                <div className="hidden xl:flex items-center gap-2 text-muted-foreground">
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
                <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" title="Notifications" className="relative">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      {notifBadgeCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {notifBadgeCount > 9 ? "9+" : notifBadgeCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-96 p-0">
                    <NotificationPanel onClose={() => setNotifOpen(false)} />
                  </PopoverContent>
                </Popover>
                <UserMenu />
              </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {user && (
                <Button variant="default" size="sm" className="gap-1 text-xs" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                </Button>
              )}
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
                    {/* Dashboard links at top */}
                    {user && (canViewProductionFloor || hasTalentProfile) && (
                      <div className="flex flex-col gap-1">
                        {canViewProductionFloor && (
                          <>
                            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-2 py-2.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                              <Factory className="w-5 h-5 text-primary" />
                              <span className="text-sm font-medium">Production Floor</span>
                            </Link>
                            <Link to="/dashboard?view=operator" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-secondary transition-colors">
                              <Eye className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm font-medium">Operator View</span>
                            </Link>
                          </>
                        )}
                        {hasTalentProfile && (
                          <Link to="/talent/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-2 py-2.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                            <IdCard className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium">Talent Dashboard</span>
                          </Link>
                        )}
                      </div>
                    )}
                    {user && <TeamSelector />}

                    {/* App actions — shown FIRST when logged in */}
                    {user && (
                      <>
                        <Separator />
                        <nav className="flex flex-col gap-1">
                          <MobileNavLink to="/queue" icon={ListTodo} label="Queue Management" onClose={() => setMobileMenuOpen(false)} />
                          {(hasAdminAccess || hasOrgSupervisorAccess) && <MobileNavLink to="/history" icon={History} label="Work Order History" onClose={() => setMobileMenuOpen(false)} />}
                          {(hasAdminAccess || hasOrgSupervisorAccess) && <MobileNavLink to="/quote-history" icon={FileQuestion} label="Quote History" onClose={() => setMobileMenuOpen(false)} />}
                          <MobileNavLink to="/tools" icon={Wrench} label="Operator Tools" onClose={() => setMobileMenuOpen(false)} />
                          {hasOrgSupervisorAccess && <MobileNavLink to="/teams" icon={Users} label="Team Management" onClose={() => setMobileMenuOpen(false)} />}
                          {(hasOrgAdminAccess || hasOrgSupervisorAccess) && <MobileNavLink to="/oap/employer" icon={ClipboardCheck} label="OAP Employer Console" onClose={() => setMobileMenuOpen(false)} />}
                          {(hasOrgAdminAccess || hasOrgSupervisorAccess) && <MobileNavLink to="/gca/employer" icon={GraduationCap} label="GCA Employer Console" onClose={() => setMobileMenuOpen(false)} />}
                          {hasTalentProfile && (
                            <MobileNavLink to="/operator/inbox" icon={Inbox} label={`Recruiter Inbox${talentInboxUnread > 0 ? ` (${talentInboxUnread})` : ""}`} onClose={() => setMobileMenuOpen(false)} />
                          )}
                          <MobileNavLink to="/settings" icon={Settings} label="Settings" onClose={() => setMobileMenuOpen(false)} />
                          {hasAdminAccess && (
                            <MobileNavLink to="/admin" icon={Shield} label={hasOrgAdminAccess ? "Admin Dashboard" : "Supervisor Dashboard"} iconClass="text-primary" onClose={() => setMobileMenuOpen(false)} />
                          )}
                          {hasTestingAccess && (
                            <MobileNavLink to="/testing" icon={FlaskConical} label="Testing Dashboard" iconClass="text-purple-500" onClose={() => setMobileMenuOpen(false)} />
                          )}
                          <MobileNavLink to="/updates" icon={Megaphone} label={`Updates${unreadCount > 0 ? ` (${unreadCount})` : ""}`} onClose={() => setMobileMenuOpen(false)} />
                        </nav>
                      </>
                    )}

                    <Separator />

                    {/* Marketing/info sections — below app actions */}
                    <MobileCollapsible title="Products">
                      <div className="px-2 py-1">
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Platform</div>
                        {platformFeatures.map((p) => (
                          <Link key={p.href} to={p.href} onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                            {p.label}
                          </Link>
                        ))}
                      </div>
                      <div className="px-2 py-1 mt-1">
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Developer Tools</div>
                        {extensionItems.map((ext) => (
                          <Link key={ext.label} to={ext.href} onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                            {ext.label}
                          </Link>
                        ))}
                      </div>
                    </MobileCollapsible>

                    <MobileCollapsible title="Industries">
                      {industryCategories.map((cat) => (
                        <div key={cat.heading} className="px-2 py-1">
                          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">{cat.heading}</div>
                          {cat.items.map((item) => (
                            <Link key={item} to={`/industries/${industrySlugFromName(item)}`} onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                              {item}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </MobileCollapsible>

                    <MobileCollapsible title="Learn">
                      {learnCategories.map((cat) => (
                        <div key={cat.heading} className="px-2 py-1">
                          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">{cat.heading}</div>
                          {cat.items.map((item) => (
                            <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </MobileCollapsible>

                    <MobileCollapsible title="Company">
                      {companyItems.map((item) => (
                        <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)} className="block w-full text-left px-2 py-2 text-sm text-foreground hover:bg-accent rounded-md">
                          {item.label}
                        </Link>
                      ))}
                    </MobileCollapsible>

                    {/* Non-logged-in app links */}
                    {!user && (
                      <>
                        <Separator />
                        <nav className="flex flex-col gap-1">
                          <MobileNavLink to="/tools" icon={Wrench} label="Operator Tools" onClose={() => setMobileMenuOpen(false)} />
                        </nav>
                      </>
                    )}

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
                      <button
                        className="relative flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors text-sm"
                        onClick={() => { setMobileMenuOpen(false); setNotifOpen(true); }}
                      >
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <span>Notifications</span>
                        {notifBadgeCount > 0 && (
                          <span className="w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                            {notifBadgeCount > 9 ? "9+" : notifBadgeCount}
                          </span>
                        )}
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
      {/* Mobile notification sheet */}
      {isMobile && (
        <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
          <SheetContent side="bottom" className="p-0 rounded-t-xl max-h-[80vh]">
            <NotificationPanel onClose={() => setNotifOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
}
