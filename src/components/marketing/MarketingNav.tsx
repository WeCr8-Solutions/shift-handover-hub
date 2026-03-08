import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import joblineLogo from "@/assets/jobline-logo.png";

interface MarketingNavProps {
  showPricing?: boolean;
}

export function MarketingNav({ showPricing = true }: MarketingNavProps) {
  const navigate = useNavigate();

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={joblineLogo} alt="JobLine.ai" className="h-8 sm:h-10 w-auto" />
        </button>
        <div className="flex items-center gap-3">
          {showPricing && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="hidden sm:inline-flex">
              Pricing
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate("/resources")} className="hidden sm:inline-flex">
            Resources
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/blog")} className="hidden sm:inline-flex">
            Blog
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/help")} className="hidden sm:inline-flex">
            Help
          </Button>
          {/* TODO: Uncomment when shop products are configured
          <Button variant="ghost" size="sm" onClick={() => navigate("/shop")} className="hidden sm:inline-flex">
            Shop
          </Button>
          */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hidden sm:inline-flex">
            Home
          </Button>
          <Button onClick={() => navigate("/auth")} size="sm" className="gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
