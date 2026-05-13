import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      data-testid="not-found"
      className="flex min-h-screen items-center justify-center bg-muted px-4"
    >
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
            <Button asChild variant="outline" data-testid="not-found-dashboard">
              <Link to="/dashboard">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Go to Dashboard
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
