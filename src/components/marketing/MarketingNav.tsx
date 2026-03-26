import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Cog,
  ClipboardCheck,
  BarChart3,
  Wrench,
  Users,
  Cpu,
  Clock,
  Shield,
  Gauge,
  BookOpen,
  Code,
  BookA,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  TrendingUp,
  LayoutGrid,
  Kanban,
  GitCompare,
  FileText,
  Monitor,
  Cable,
} from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";
import { industrySlugFromName } from "@/pages/industries/industryData";

interface MarketingNavProps {
  showPricing?: boolean;
}

/* ── Mega-menu data ── */

const platformFeatures = [
  { label: "Digital Expeditor", href: "/features/digital-expeditor", icon: Gauge, desc: "Real-time work order routing & visibility" },
  { label: "Shift Handoff", href: "/features/shift-handoff-software", icon: Clock, desc: "Structured shift-to-shift knowledge transfer" },
  { label: "Work Order Tracking", href: "/features/work-order-tracking", icon: ClipboardCheck, desc: "Full lifecycle job tracking" },
  { label: "Production Scheduling", href: "/features/production-scheduling", icon: BarChart3, desc: "Capacity planning & scheduling" },
  { label: "Quality Management", href: "/features/quality-management", icon: Shield, desc: "NCRs, inspections & traceability" },
  { label: "AI Planning Assistant", href: "/features/ai-planning-assistant", icon: Cpu, desc: "AI-powered production insights" },
  { label: "Machine Shop Software", href: "/features/machine-shop-software", icon: Cog, desc: "Purpose-built for job shops" },
  { label: "Downtime Tracking", href: "/features/downtime-tracking", icon: Wrench, desc: "Capture & reduce downtime" },
];

const extensionItems = [
  { label: "JobLine G-Code", href: "/features/cnc-operator-tools", icon: Code, desc: "Multi-dialect G-code intelligence for VS Code" },
  { label: "JobLine Machine Connect", href: "/features/cnc-operator-tools", icon: Cable, desc: "DNC connectivity — FTP, serial & network" },
];

const industryCategories = [
  {
    heading: "Manufacturing",
    items: [
      "Job Shops",
      "Machine Shops",
      "Aerospace & Defense",
      "Medical Device Manufacturers",
      "Industrial Manufacturing",
      "Automotive Parts",
    ],
  },
  {
    heading: "Process & Specialty",
    items: [
      "Electronics Assembly",
      "Plastics & Rubber",
      "Metal Fabrication",
      "Food & Beverage",
      "Pharma & Life Sciences",
      "Chemical Processing",
    ],
  },
  {
    heading: "Emerging Sectors",
    items: [
      "Renewable Energy",
      "Additive Manufacturing",
      "Semiconductor",
      "EV & Battery",
    ],
  },
];

const learnItems = [
  { label: "Manufacturing Guides", href: "/resources/guides", icon: BookOpen },
  { label: "G-Code Reference", href: "/resources/gcode", icon: Code },
  { label: "Industry Glossary", href: "/resources/glossary", icon: BookA },
  { label: "Beginner's Guide", href: "/resources/beginners", icon: GraduationCap },
  { label: "Careers", href: "/resources/careers", icon: Briefcase },
  { label: "Safety & Compliance", href: "/resources/safety", icon: ShieldAlert },
  { label: "Quality & Inspection", href: "/resources/quality", icon: ClipboardCheck },
  { label: "Lean Manufacturing", href: "/resources/lean", icon: TrendingUp },
  { label: "5S Methodology", href: "/resources/5s", icon: LayoutGrid },
  { label: "Kanban & Sorting", href: "/resources/kanban", icon: Kanban },
  { label: "Pioneers", href: "/resources/pioneers", icon: Users },
  { label: "Tool Comparisons", href: "/resources/comparisons", icon: GitCompare },
  { label: "ERP Selection Guide", href: "/resources/erp-guide", icon: FileText },
];

type MenuKey = "platform" | "industries" | "learn" | null;

export function MarketingNav({ showPricing = true }: MarketingNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const navRef = useRef<HTMLDivElement>(null);

  const isResourcesRoute = location.pathname.startsWith("/resources");

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleEnter = (key: MenuKey) => {
    clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 200);
  };

  const handleBack = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    navigate(location.pathname === "/resources" ? "/" : "/resources");
  };

  const go = (href: string) => {
    navigate(href);
    setMobileOpen(false);
    setOpenMenu(null);
  };

  const DropdownTrigger = ({ label, menuKey }: { label: string; menuKey: MenuKey }) => (
    <button
      onMouseEnter={() => handleEnter(menuKey)}
      onFocus={() => handleEnter(menuKey)}
      onClick={() => setOpenMenu(openMenu === menuKey ? null : menuKey)}
      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
    >
      {label}
      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMenu === menuKey ? "rotate-180" : ""}`} />
    </button>
  );

  const FeatureButton = ({ item }: { item: typeof platformFeatures[0] }) => {
    const Icon = item.icon;
    return (
      <button
        onClick={() => go(item.href)}
        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{item.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
        </div>
      </button>
    );
  };

  return (
    <nav ref={navRef} className="border-b border-border bg-background/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => go("/")} className="flex items-center gap-2 shrink-0">
          <img src={joblineLogo} alt="JobLine.ai" className="h-7 sm:h-8 w-auto" />
        </button>

        {isResourcesRoute && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="hidden md:inline-flex gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        )}

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1" onMouseLeave={handleLeave}>
          <DropdownTrigger label="Platform" menuKey="platform" />
          <DropdownTrigger label="Industries" menuKey="industries" />
          <DropdownTrigger label="Learn" menuKey="learn" />

          <button onClick={() => go("/pricing")} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md">
            Pricing
          </button>
          <button onClick={() => go("/blog")} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md">
            Blog
          </button>

          <Button onClick={() => go("/auth")} size="sm" className="ml-2 gap-1.5">
            Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <Button onClick={() => go("/auth")} size="sm" className="gap-1 text-xs">
            Start Free <ArrowRight className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop mega-menu */}
      {openMenu && (
        <div
          className="hidden md:block absolute left-0 right-0 border-b border-border bg-background shadow-lg z-40"
          onMouseEnter={() => { clearTimeout(closeTimer.current); }}
          onMouseLeave={handleLeave}
        >
          <div className="container mx-auto px-4 py-6">
            {openMenu === "platform" && (
              <div className="grid grid-cols-[1fr_auto] gap-8">
                {/* Features grid */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Platform Features</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {platformFeatures.map((p) => (
                      <FeatureButton key={p.href} item={p} />
                    ))}
                  </div>
                </div>
                {/* Extensions sidebar */}
                <div className="border-l border-border pl-6 min-w-[240px]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    <Monitor className="w-3 h-3 inline mr-1 -mt-0.5" />
                    VS Code Extensions
                  </h4>
                  <div className="space-y-1">
                    {extensionItems.map((ext) => (
                      <FeatureButton key={ext.label} item={ext} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 leading-snug">
                    The VS Code extension you use at your desk connects to the platform running on your Haas.
                  </p>
                </div>
              </div>
            )}

            {openMenu === "industries" && (
              <div className="grid grid-cols-3 gap-8">
                {industryCategories.map((cat) => (
                  <div key={cat.heading}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{cat.heading}</h4>
                    <ul className="space-y-2">
                      {cat.items.map((item) => (
                        <li key={item}>
                          <button
                            onClick={() => go(`/industries/${industrySlugFromName(item)}`)}
                            className="text-sm text-foreground hover:text-primary transition-colors"
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {openMenu === "learn" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {learnItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => go(item.href)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => go("/resources")}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left col-span-full border-t border-border mt-2 pt-3"
                >
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-primary">View All Resources →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
          {isResourcesRoute && (
            <button onClick={() => { handleBack(); setMobileOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          <MobileSection title="Platform">
            <div className="px-3 py-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Features</div>
              {platformFeatures.map((p) => (
                <button key={p.href} onClick={() => go(p.href)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="px-3 py-1 mt-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">VS Code Extensions</div>
              {extensionItems.map((ext) => (
                <button key={ext.label} onClick={() => go(ext.href)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                  {ext.label}
                </button>
              ))}
            </div>
          </MobileSection>

          <MobileSection title="Industries">
            {industryCategories.map((cat) => (
              <div key={cat.heading} className="px-3 py-1">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">{cat.heading}</div>
                {cat.items.map((item) => (
                  <button key={item} onClick={() => go(`/industries/${industrySlugFromName(item)}`)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </MobileSection>

          <MobileSection title="Learn">
            {learnItems.map((item) => (
              <button key={item.href} onClick={() => go(item.href)} className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md">
                {item.label}
              </button>
            ))}
          </MobileSection>

          <button onClick={() => go("/pricing")} className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent">Pricing</button>
          <button onClick={() => go("/blog")} className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent">Blog</button>
          <button onClick={() => go("/help")} className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent">Help</button>
        </div>
      )}
    </nav>
  );
}

/* ── Mobile collapsible section ── */
function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 pb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground"
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pl-2 pb-2">{children}</div>}
    </div>
  );
}
