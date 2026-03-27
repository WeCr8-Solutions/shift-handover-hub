import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { DevSearch } from "@/components/dev/DevSearch";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { devCategories, getDevDocsByCategory } from "@/lib/devDocs";
import { ExternalLink, Terminal } from "lucide-react";

const quickLinks = [
  { label: "VS Code Marketplace", href: "https://marketplace.visualstudio.com/items?itemName=WeCr8-Solutions.jobline-gcode", external: true },
  { label: "Machine Connect Waitlist", href: "/features/machine-connect", external: false },
  { label: "API Quickstart", href: "/dev/getting-started/quickstart", external: false },
];

export default function DevPortal() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Developer Portal — JobLine.ai"
        description="API reference, SDK docs, VS Code extension guides, and integration documentation for the JobLine.ai manufacturing platform."
        canonical="/dev"
        keywords="jobline api, developer docs, manufacturing api, gcode extension, machine connect"
      />
      <MarketingNav />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-16">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Terminal className="h-3.5 w-3.5" />
              Developer Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Build with JobLine
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              API reference, SDKs, VS Code extensions, and integration guides for the manufacturing platform.
            </p>
            <DevSearch large className="max-w-xl mx-auto" />
          </div>
        </section>

        {/* Quick links */}
        <section className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => link.external ? window.open(link.href, '_blank') : navigate(link.href)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {link.label}
                {link.external && <ExternalLink className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 py-8 max-w-5xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Browse Documentation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {devCategories.map((cat) => {
              const count = getDevDocsByCategory(cat.key).length;
              return (
                <Card
                  key={cat.key}
                  className="cursor-pointer hover:border-primary/50 transition-colors group"
                  onClick={() => {
                    const first = getDevDocsByCategory(cat.key)[0];
                    if (first) navigate(`/dev/${cat.key}/${first.slug}`);
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <cat.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {cat.label}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">{cat.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Featured: VS Code Extension */}
        <section className="container mx-auto px-4 pb-12 max-w-5xl">
          <h2 className="text-xl font-semibold text-foreground mb-6">Featured</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/dev/extensions/gcode-intelligence")}
              className="text-left p-5 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Badge variant="secondary" className="text-xs mb-2">VS Code Extension</Badge>
              <p className="text-sm font-semibold text-foreground">G-Code Intelligence</p>
              <p className="text-xs text-muted-foreground mt-1">Multi-dialect syntax highlighting, diagnostics, and 200+ snippets for CNC programming.</p>
            </button>
            <button
              onClick={() => navigate("/dev/extensions/machine-connect")}
              className="text-left p-5 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Badge className="text-xs mb-2 bg-accent text-accent-foreground">Coming Soon</Badge>
              <p className="text-sm font-semibold text-foreground">Machine Connect Relay</p>
              <p className="text-xs text-muted-foreground mt-1">Bridge physical CNC machines to JobLine via DNC, serial, and network protocols.</p>
            </button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
