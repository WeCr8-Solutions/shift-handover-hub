import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMachiningOperations } from "@/hooks/useMachiningOperations";
import { useMachiningOperationOverrides } from "@/hooks/useMachiningOperationOverrides";
import { useInspectionTools } from "@/hooks/useInspectionTools";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLE_OPTIONS = ["operator", "supervisor", "programmer"];

export function OrgOverridesPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Org Overrides</CardTitle>
        <p className="text-xs text-muted-foreground">
          Hide canonical items from your shop or mark them required for specific
          roles. Canonical seed data stays untouched.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ops">
          <TabsList>
            <TabsTrigger value="ops">Machining Ops</TabsTrigger>
            <TabsTrigger value="tools">Inspection Tools</TabsTrigger>
          </TabsList>
          <TabsContent value="ops" className="pt-3">
            <MachiningOpsOverrides />
          </TabsContent>
          <TabsContent value="tools" className="pt-3">
            <InspectionToolOverrides />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MachiningOpsOverrides() {
  const { operations, categories, isLoading } = useMachiningOperations();
  const { overrides, upsert, clear } = useMachiningOperationOverrides();
  const [query, setQuery] = useState("");

  const overrideMap = useMemo(
    () => new Map(overrides.map((o) => [o.operation_id, o])),
    [overrides]
  );

  const filtered = useMemo(
    () =>
      operations.filter(
        (o) =>
          !query ||
          o.name.toLowerCase().includes(query.toLowerCase()) ||
          o.short_description?.toLowerCase().includes(query.toLowerCase())
      ),
    [operations, query]
  );

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
        <Input
          placeholder="Search operations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="border rounded-md divide-y max-h-[60vh] overflow-y-auto">
        {filtered.map((op) => {
          const ov = overrideMap.get(op.id);
          const cat = categories.find((c) => c.id === op.category_id);
          return (
            <div key={op.id} className="p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{op.name}</p>
                  {cat && (
                    <Badge variant="outline" className="text-[10px]">
                      {cat.name}
                    </Badge>
                  )}
                  {ov?.is_hidden && (
                    <Badge variant="destructive" className="text-[10px]">
                      Hidden
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {ROLE_OPTIONS.map((role) => {
                    const required = ov?.required_for_roles.includes(role);
                    return (
                      <Button
                        key={role}
                        size="sm"
                        variant={required ? "default" : "outline"}
                        className="h-6 text-[10px] px-2"
                        onClick={async () => {
                          const next = required
                            ? (ov?.required_for_roles ?? []).filter((r) => r !== role)
                            : [...(ov?.required_for_roles ?? []), role];
                          try {
                            await upsert(op.id, { required_for_roles: next });
                          } catch (e) {
                            toast.error("Update failed");
                          }
                        }}
                      >
                        {role}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Hide</span>
                  <Switch
                    checked={!!ov?.is_hidden}
                    onCheckedChange={async (checked) => {
                      try {
                        await upsert(op.id, { is_hidden: checked });
                      } catch {
                        toast.error("Update failed");
                      }
                    }}
                  />
                </div>
                {ov && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px]"
                    onClick={() => clear(op.id)}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Reset
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {!filtered.length && (
          <p className="p-4 text-xs text-muted-foreground text-center">
            No operations match your search.
          </p>
        )}
      </div>
    </div>
  );
}

function InspectionToolOverrides() {
  const { allTools: tools, categories, overrides, loading, refresh } = useInspectionTools({
    includeHidden: true,
  });
  const { organization } = useOrgContext();
  const [query, setQuery] = useState("");

  const overrideMap = useMemo(
    () => new Map(overrides.map((o) => [o.tool_id, o])),
    [overrides]
  );

  const filtered = useMemo(
    () =>
      tools.filter(
        (t) =>
          !query ||
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description?.toLowerCase().includes(query.toLowerCase())
      ),
    [tools, query]
  );

  const toggleHidden = async (toolId: string, hidden: boolean) => {
    if (!organization?.id) return;
    const existing = overrideMap.get(toolId);
    const { error } = await supabase
      .from("org_inspection_tool_overrides")
      .upsert(
        {
          organization_id: organization.id,
          tool_id: toolId,
          is_hidden: hidden,
          required_for_roles: existing?.required_for_roles ?? [],
          custom_notes: existing?.custom_notes ?? null,
          custom_precision_spec: existing?.custom_precision_spec ?? null,
        },
        { onConflict: "organization_id,tool_id" }
      );
    if (error) toast.error("Update failed");
    else refresh();
  };

  const toggleRole = async (toolId: string, role: string) => {
    if (!organization?.id) return;
    const existing = overrideMap.get(toolId);
    const required = existing?.required_for_roles.includes(role as never);
    const next = required
      ? (existing?.required_for_roles ?? []).filter((r) => r !== role)
      : [...(existing?.required_for_roles ?? []), role];
    const { error } = await supabase
      .from("org_inspection_tool_overrides")
      .upsert(
        {
          organization_id: organization.id,
          tool_id: toolId,
          is_hidden: existing?.is_hidden ?? false,
          required_for_roles: next as never,
          custom_notes: existing?.custom_notes ?? null,
          custom_precision_spec: existing?.custom_precision_spec ?? null,
        },
        { onConflict: "organization_id,tool_id" }
      );
    if (error) toast.error("Update failed");
    else refresh();
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
        <Input
          placeholder="Search tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="border rounded-md divide-y max-h-[60vh] overflow-y-auto">
        {filtered.map((t) => {
          const ov = overrideMap.get(t.id);
          const cat = categories.find((c) => c.id === t.category_id);
          return (
            <div key={t.id} className="p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  {cat && (
                    <Badge variant="outline" className="text-[10px]">
                      {cat.name}
                    </Badge>
                  )}
                  {ov?.is_hidden && (
                    <Badge variant="destructive" className="text-[10px]">
                      Hidden
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {ROLE_OPTIONS.map((role) => {
                    const required = ov?.required_for_roles.includes(role as never);
                    return (
                      <Button
                        key={role}
                        size="sm"
                        variant={required ? "default" : "outline"}
                        className="h-6 text-[10px] px-2"
                        onClick={() => toggleRole(t.id, role)}
                      >
                        {role}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Hide</span>
                <Switch
                  checked={!!ov?.is_hidden}
                  onCheckedChange={(c) => toggleHidden(t.id, c)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
