import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Library, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Top-of-Concierge quick actions for JobLine staff.
 *
 * Surfaces the *reusable, generic* Sales Pack (print) and Document Library (ZIP / per-doc download)
 * so employees can grab onboarding materials without first picking a specific engagement.
 * Engagement-specific (org-branded, prefilled) versions still live inside each engagement's detail view.
 */
export function ConciergeQuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Library className="w-4 h-4" /> Onboarding materials (reusable)
        </CardTitle>
        <CardDescription className="text-xs">
          Generic, blank versions for in-person sales calls, kickoffs, and paper onboarding.
          Open an engagement below for an org-specific pack with customer name, plan, and amount pre-filled.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="default"
          className="gap-2"
          onClick={() => navigate("/admin/concierge/print")}
        >
          <Printer className="w-4 h-4" /> Print Sales Pack
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/admin/concierge/library")}
        >
          <Download className="w-4 h-4" /> Document Library (ZIP / per-doc)
        </Button>
      </CardContent>
    </Card>
  );
}
