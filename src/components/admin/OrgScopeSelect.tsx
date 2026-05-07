import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Building } from "lucide-react";

interface OrgOption {
  id: string;
  name: string;
}

interface OrgScopeSelectProps {
  /** Current scoped org id, null = platform-wide */
  value: string | null;
  onChange: (orgId: string | null) => void;
  /** When true, includes the platform-wide ("All organizations") option */
  allowPlatformWide?: boolean;
}

/**
 * Org scope selector for the admin header. Lets platform admins
 * narrow the dashboard to a single customer org for support.
 */
export function OrgScopeSelect({
  value,
  onChange,
  allowPlatformWide = true,
}: OrgScopeSelectProps) {
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name", { ascending: true });
      if (!cancelled) {
        setOrgs((data || []) as OrgOption[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Select
      value={value ?? "__all__"}
      onValueChange={(v) => onChange(v === "__all__" ? null : v)}
    >
      <SelectTrigger className="h-9 w-[220px] gap-2" aria-label="Org scope">
        {value === null ? (
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <Building className="w-3.5 h-3.5 text-primary" />
        )}
        <SelectValue placeholder={loading ? "Loading…" : "Select scope"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Scope</SelectLabel>
          {allowPlatformWide && (
            <SelectItem value="__all__">All organizations (platform)</SelectItem>
          )}
          {orgs.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
