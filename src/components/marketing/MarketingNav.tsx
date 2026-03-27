import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Monitor,
  LayoutDashboard,
} from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";
import { industrySlugFromName } from "@/pages/industries/industryData";
import { useAuth } from "@/contexts/AuthContext";
import {
  platformFeatures,
  extensionItems,
  industryCategories,
  learnCategories,
  companyItems,
} from "./navData";

interface MarketingNavProps {
  showPricing?: boolean;
}

type MenuKey = "products" | "industries" | "learn" | "company" | null;

export function MarketingNav({ showPricing = true }: MarketingNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
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
          <DropdownTrigger label="Products" menuKey="products" />
          <DropdownTrigger label="Industries" menuKey="industries" />
          <DropdownTrigger label="Learn" menuKey="learn" />
          <DropdownTrigger label="Company" menuKey="company" />

          <button onClick={() => go("/dev")} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md">
            Developers
          </button>
          <button onClick={() => go("/pricing")} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md">
            Pricing
          </button>

          {user ? (
            <Button onClick={() => go("/dashboard")} size="sm" className="ml-2 gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Button>
          ) : (
            <Button onClick={() => go("/auth")} size="sm" className="ml-2 gap-1.5">
              Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <Button onClick={() => go("/dashboard")} size="sm" className="gap-1 text-xs">
              <LayoutDashboard className="w-3 h-3" /> Dashboard
            </Button>
          ) : (
            <Button onClick={() => go("/auth")} size="sm" className="gap-1 text-xs">
              Start Free <ArrowRight className="w-3 h-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* ── Desktop mega-menu panels ── */}
      {openMenu && (
        <div
          className="hidden md:block absolute left-0 right-0 border-b border-border bg-background shadow-lg z-40"
          onMouseEnter={() => { clearTimeout(closeTimer.current); }}
          onMouseLeave={handleLeave}
        >
          <div className="container mx-auto px-4 py-6">
            {/* Products */}
            {openMenu === "products" && (
              <div className="grid grid-cols-[1fr_auto] gap-8">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Platform</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                    {platformFeatures.map((p) => {
                      const Icon = p.icon;
                      return (
                        <button key={p.href} onClick={() => go(p.href)} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{p.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{p.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="border-l border-border pl-6 min-w-[240px]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    <Monitor className="w-3 h-3 inline mr-1 -mt-0.5" />
                    Developer Tools
                  </h4>
                  <div className="space-y-2">
                    {extensionItems.map((ext) => {
                      const Icon = ext.icon;
                      return (
                        <button key={ext.label} onClick={() => go(ext.href)} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left w-full group">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {ext.label}
                              <span className="ml-1.5 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-accent text-accent-foreground">Beta</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{ext.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => go("/features")} className="mt-4 text-xs font-semibold text-primary hover:underline">
                    See all features →
                  </button>
                </div>
              </div>
            )}

            {/* Industries */}
            {openMenu === "industries" && (
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-8">
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
                <div className="border-l border-border pl-6 flex flex-col justify-center min-w-[200px]">
                  <p className="text-sm font-semibold text-foreground">Built for precision manufacturing</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">Purpose-built solutions for shops of every size.</p>
                  <button onClick={() => go("/industries")} className="mt-3 text-xs font-semibold text-primary hover:underline text-left">
                    View all industries →
                  </button>
                </div>
              </div>
            )}

            {/* Learn */}
            {openMenu === "learn" && (
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                  {learnCategories.map((cat) => (
                    <div key={cat.heading}>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{cat.heading}</h4>
                      <div className="space-y-1">
                        {cat.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button key={item.href} onClick={() => go(item.href)} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left w-full group">
                              <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                                {item.desc && <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</div>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-4 pt-3">
                  <button onClick={() => go("/resources")} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    <BookOpen className="w-4 h-4" /> Explore all resources →
                  </button>
                </div>
              </div>
            )}

            {/* Company */}
            {openMenu === "company" && (
              <div className="max-w-md">
                <div className="space-y-1">
                  {companyItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.href} onClick={() => go(item.href)} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left w-full group">
                        <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                          {item.desc && <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
          {isResourcesRoute && (
            <button onClick={() => { handleBack(); setMobileOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          <MobileSection title="Products">
            <div className="px-3 py-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Platform</div>
              {platformFeatures.map((p) => (
                <button key={p.href} onClick={() => go(p.href)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="px-3 py-1 mt-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Developer Tools</div>
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
            {learnCategories.map((cat) => (
              <div key={cat.heading} className="px-3 py-1">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">{cat.heading}</div>
                {cat.items.map((item) => (
                  <button key={item.href} onClick={() => go(item.href)} className="block w-full text-left px-2 py-1.5 text-sm text-foreground hover:text-primary">
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </MobileSection>

          <MobileSection title="Company">
            {companyItems.map((item) => (
              <button key={item.href} onClick={() => go(item.href)} className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md">
                {item.label}
              </button>
            ))}
          </MobileSection>

          <button onClick={() => go("/pricing")} className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent">Pricing</button>
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
