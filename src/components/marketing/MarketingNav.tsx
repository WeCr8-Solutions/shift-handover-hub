import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";

interface MarketingNavProps {
  showPricing?: boolean;
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing", pricingOnly: true },
  { label: "Resources", href: "/resources" },
  { label: "Blog", href: "/blog" },
  { label: "Help", href: "/help" },
];

export function MarketingNav({ showPricing = true }: MarketingNavProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = navLinks.filter((l) => !l.pricingOnly || showPricing);

  const handleNav = (href: string) => {
    navigate(href);
    setMobileOpen(false);
  };

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => handleNav("/")} className="flex items-center gap-2">
          <img src={joblineLogo} alt="JobLine.ai" className="h-8 sm:h-10 w-auto" />
        </button>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-3">
          {visibleLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" onClick={() => navigate(link.href)}>
              {link.label}
            </Button>
          ))}
          <Button onClick={() => navigate("/auth")} size="sm" className="gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center gap-2">
          <Button onClick={() => navigate("/auth")} size="sm" className="gap-1 text-xs">
            Start Free <ArrowRight className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {visibleLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
