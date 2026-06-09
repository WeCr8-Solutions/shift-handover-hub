import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Settings2, Lock, Search, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminData";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useOrgContext } from "@/contexts/OrgContext";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { useModuleContext } from "@/hooks/useModuleContext";
import { LazyTabContent } from "@/components/settings/LazyTabContent";
import { OrgAccessAlert } from "@/components/settings/OrgAccessAlert";
import {
  SETTINGS_GROUPS,
  getVisibleModules,
  type ModuleAccess,
  type SettingsModule,
  type GroupId,
} from "@/components/settings/registry";

const LAST_TAB_KEY = "settings_last_tab_v1";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, isReady } = useAuth();
  const { isDeveloper, loading: accessLoading } = useAdminAccess();
  const { canManageBilling } = useTrialStatus();
  const { organizationRole } = useOrgContext();
  const { thresholds, saveThresholds } = useSmartAlerts();

  const isOrgAdmin = organizationRole === "admin" || organizationRole === "owner";
  const isSupervisor = organizationRole === "supervisor";
  const canEditOrgSettings = isOrgAdmin || isSupervisor || isDeveloper;

  const access: ModuleAccess = useMemo(
    () => ({ isDeveloper, canManageBilling, canEditOrgSettings, organizationRole }),
    [isDeveloper, canManageBilling, canEditOrgSettings, organizationRole],
  );

  const visibleModules = useMemo(() => getVisibleModules(access), [access]);

  // Hash deep-link → localStorage → first visible
  const initialTab = (() => {
    const hash = location.hash.replace("#", "");
    if (hash) return hash;
    try {
      return localStorage.getItem(LAST_TAB_KEY) || "general";
    } catch {
      return "general";
    }
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Persist last-active tab + sync hash
  useEffect(() => {
    try {
      localStorage.setItem(LAST_TAB_KEY, activeTab);
    } catch {
      /* ignore */
    }
    if (location.hash.replace("#", "") !== activeTab) {
      navigate({ hash: `#${activeTab}` }, { replace: true });
    }
  }, [activeTab, location.hash, navigate]);

  useEffect(() => {
    if (isReady && !user) {
      navigate("/auth", { replace: true });
    }
  }, [isReady, user, navigate]);

  // Group + filter + nest by parentId
  type NavGroup = {
    id: GroupId;
    label: string;
    icon: typeof SETTINGS_GROUPS[number]["icon"];
    items: { module: SettingsModule; children: SettingsModule[] }[];
  };

  const navGroups: NavGroup[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (m: SettingsModule) =>
      q === "" ||
      m.label.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q);

    return SETTINGS_GROUPS.map((g) => {
      const groupModules = visibleModules.filter((m) => m.group === g.id);
      const parents = groupModules.filter((m) => !m.parentId);
      const items = parents
        .map((p) => {
          const children = groupModules.filter((m) => m.parentId === p.id && matches(m));
          // Show parent if parent matches OR any child matches
          const includeParent = matches(p) || children.length > 0;
          return includeParent ? { module: p, children } : null;
        })
        .filter((x): x is { module: SettingsModule; children: SettingsModule[] } => x !== null);
      return { id: g.id, label: g.label, icon: g.icon, items };
    }).filter((g) => g.items.length > 0);
  }, [visibleModules, search]);

  const allVisibleIds = useMemo(() => visibleModules.map((m) => m.id), [visibleModules]);

  useEffect(() => {
    if (!allVisibleIds.includes(activeTab) && allVisibleIds.length > 0) {
      setActiveTab(allVisibleIds[0]);
    }
  }, [allVisibleIds, activeTab]);

  // NOTE: must be called before any early-return to keep hook order stable
  useModuleContext({
    id: "settings",
    label: `Settings · ${activeTab}`,
    data: { activeTab },
  });

  if (authLoading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const ctx = { ...access, thresholds, saveThresholds };

  const NavButton = ({
    module,
    indent,
  }: {
    module: SettingsModule;
    indent?: boolean;
  }) => {
    const Icon = module.icon;
    const isActive = activeTab === module.id;
    const locked = module.orgLevel && !canEditOrgSettings;
    return (
      <button
        type="button"
        onClick={() => {
          setActiveTab(module.id);
          setMobileNavOpen(false);
        }}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          indent && "pl-7",
          isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{module.label}</span>
        {locked && (
          <Lock
            className={cn("h-3 w-3 shrink-0", isActive ? "opacity-70" : "opacity-50")}
            aria-label="Read-only"
          />
        )}
      </button>
    );
  };

  const NavList = () => (
    <nav aria-label="Settings sections" className="space-y-5">
      {navGroups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <div key={group.id}>
            <div className="mb-1.5 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <GroupIcon className="h-3 w-3" />
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ module, children }) => (
                <div key={module.id}>
                  <NavButton module={module} />
                  {children.map((child) => (
                    <NavButton key={child.id} module={child} indent />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {navGroups.length === 0 && (
        <p className="px-2 text-xs text-muted-foreground">No settings match "{search}".</p>
      )}
    </nav>
  );


  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <div className="mb-4">
          <OrgAccessAlert />
        </div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Settings2 className="h-6 w-6" />
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure your manufacturing environment and application preferences
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Mobile: search + nav trigger */}
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                    <Menu className="h-4 w-4" />
                    Sections
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="border-b p-4">
                    <SheetTitle>Settings</SheetTitle>
                  </SheetHeader>
                  <div className="p-3">
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search settings…"
                        className="h-8 pl-7 text-xs"
                      />
                    </div>
                    <ScrollArea className="h-[calc(100vh-9rem)] pr-2">
                      <NavList />
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search settings…"
                    className="h-8 pl-7 text-xs"
                  />
                </div>
                <div className="rounded-lg border bg-card p-2">
                  <NavList />
                </div>
              </div>
            </aside>

            {/* Content panel — registry-driven */}
            <div className="min-w-0">
              {visibleModules.map((module) => (
                <LazyTabContent key={module.id} value={module.id} activeTab={activeTab}>
                  {module.render(ctx)}
                </LazyTabContent>
              ))}
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
