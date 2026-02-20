import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * /zach – Founder redirect route.
 * Appends default UTM params if none are provided, then redirects to /.
 */
export default function FounderRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const hasUtm = ["utm_source", "utm_medium", "utm_campaign", "utm_content"].some((k) =>
      searchParams.has(k),
    );

    if (hasUtm) {
      navigate({ pathname: "/", search: searchParams.toString() }, { replace: true });
    } else {
      navigate(
        {
          pathname: "/",
          search: "utm_source=founder&utm_medium=organic&utm_campaign=zach_profile",
        },
        { replace: true },
      );
    }
  }, [navigate, searchParams]);

  return null;
}
