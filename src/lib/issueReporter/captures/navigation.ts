/**
 * Navigation capture. React Router-aware via a hook, plus a popstate
 * listener for back/forward.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { breadcrumbs } from "../breadcrumbs";

export function useNavigationCapture() {
  const location = useLocation();
  useEffect(() => {
    breadcrumbs.add({
      category: "navigation",
      message: `→ ${location.pathname}${location.search}`,
      data: { pathname: location.pathname, search: location.search, hash: location.hash },
    });
  }, [location.pathname, location.search, location.hash]);
}
