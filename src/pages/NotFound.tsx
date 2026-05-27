import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, Bug } from "lucide-react";
import { IssueReportDialog } from "@/components/IssueReportDialog";
import { breadcrumbs } from "@/lib/issueReporter";
import { trackEvent } from "@/lib/analytics";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    // Drop a breadcrumb so the bug report includes the dead-end event.
    breadcrumbs.add({
      category: "navigation",
      message: `404 dead-end at ${location.pathname}`,
      data: {
        attempted_path: location.pathname,
        search: location.search,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      },
    });
  }, [location.pathname, location.search]);

  const prefillTitle = `Dead end at ${location.pathname}`;
  const prefillDescription = [
    `**Attempted URL:** ${location.pathname}${location.search}`,
    typeof document !== "undefined" && document.referrer
      ? `**Came from:** ${document.referrer}`
      : "",
    `**Timestamp:** ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div
      data-testid="not-found"
      className="flex min-h-screen items-center justify-center bg-muted px-4"
    >
      <Helmet>
        <title>Page not found · JobLine.ai</title>
        {/* Tell Google this is a missing page so it stops counting it as a soft 404
            (the SPA can't return a real 404 status; noindex is the supported signal). */}
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="text-center max-w-md">
        <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl text-foreground">Page not found</p>
        <p className="mb-6 text-sm text-muted-foreground break-all">
          <code>{location.pathname}</code> doesn't exist or has moved.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="default" data-testid="not-found-home">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" /> Return Home
            </Link>
          </Button>
          {user && (
            <>
              <Button asChild variant="outline" data-testid="not-found-dashboard">
                <Link to="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Go to Dashboard
                </Link>
              </Button>
              <Button
                variant="secondary"
                data-testid="not-found-report"
                onClick={() => setReportOpen(true)}
              >
                <Bug className="w-4 h-4 mr-2" /> Report this dead end
              </Button>
            </>
          )}
        </div>
        {user && (
          <p className="mt-4 text-xs text-muted-foreground">
            Stuck? Tell us what you were trying to do and we'll route it to the admin bug queue.
          </p>
        )}
      </div>

      {user && (
        <IssueReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          prefillTitle={prefillTitle}
          prefillDescription={prefillDescription}
          prefillSeverity="high"
          contextLabel={`Dead end · ${location.pathname}`}
        />
      )}
    </div>
  );
};

export default NotFound;
