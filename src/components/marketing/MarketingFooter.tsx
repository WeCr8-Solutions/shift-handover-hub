import { Link } from "react-router-dom";
import joblineLogo from "@/assets/jobline-logo.png";

const footerLinks = {
  Operations: [
    { label: "Shift Handoffs", to: "/features/shift-handoff-software" },
    { label: "Work Orders", to: "/features/work-order-tracking" },
    { label: "Production Scheduling", to: "/features/production-scheduling" },
    { label: "Production Control", to: "/features/production-control" },
  ],
  "Shop Floor": [
    { label: "Machine Shop", to: "/features/machine-shop-software" },
    { label: "CNC Operator Tools", to: "/features/cnc-operator-tools" },
    { label: "Downtime Tracking", to: "/features/downtime-tracking" },
    { label: "Digital Expeditor", to: "/features/digital-expeditor" },
  ],
  Management: [
    { label: "Manufacturing Oversight", to: "/features/manufacturing-oversight" },
    { label: "Quality Management", to: "/features/quality-management" },
    { label: "Team Collaboration", to: "/features/team-collaboration" },
    { label: "AI Planning", to: "/features/ai-planning-assistant" },
  ],
  Resources: [
    { label: "Manufacturing Guides", to: "/resources/guides" },
    { label: "G-Code Reference", to: "/resources/gcode" },
    { label: "Industry Glossary", to: "/resources/glossary" },
    { label: "Blog", to: "/blog" },
  ],
  Company: [
    { label: "Home", to: "/" },
    { label: "Book a Demo", to: "/demo" },
    { label: "Pricing", to: "/pricing" },
    { label: "Sign Up Free", to: "/auth" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm text-foreground mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={joblineLogo} alt="JobLine.ai" className="h-8 sm:h-10 w-auto" />
          </div>
          <div className="text-xs text-muted-foreground text-center sm:text-right">
            <p>© 2026 JobLine.ai. All rights reserved.</p>
            <p className="mt-1">A product of WeCr8 Solutions LLC</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
