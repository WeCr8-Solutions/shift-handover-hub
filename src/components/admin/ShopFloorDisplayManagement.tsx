import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShopFloorDisplays, type ShopFloorDisplay } from "@/hooks/useShopFloorDisplays";
import { useTeams } from "@/hooks/useTeams";
import { useOrgContext } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  Monitor,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  QrCode,
  ExternalLink,
  Eye,
  EyeOff,
  Settings2,
  CheckCircle2,
  XCircle,
  Clock,
  Tv,
  Wrench,
  ClipboardList,
  Bluetooth,
  Wifi,
  Globe,
} from "lucide-react";

/* ── Readiness Checklist ── */
const CHECKLIST_ITEMS = [
  { key: "table", label: "Database table created (shop_floor_displays)", done: true },
  { key: "rls", label: "RLS policies applied (org-scoped)", done: true },
  { key: "token_fn", label: "Token validation function deployed", done: true },
  { key: "admin_ui", label: "Admin management UI (this panel)", done: true },
  { key: "display_route", label: "Display route (/display/:id)", done: true },
  { key: "supervisor_mode", label: "Supervisor display mode rendering", done: true },
  { key: "operator_mode", label: "Operator display mode rendering", done: true },
  { key: "auto_refresh", label: "Auto-refresh polling", done: true },
  { key: "dark_mode", label: "Dark mode support", done: true },
  { key: "auto_rotate", label: "Auto-rotate panel cycling", done: false },
  { key: "ambient", label: "Ambient mode (dim + wake on alerts)", done: false },
  { key: "realtime", label: "Realtime subscriptions (replace polling)", done: false },
  { key: "alert_sound", label: "Alert sound notifications", done: false },
];

export function ShopFloorDisplayManagement() {
  const { displays, loading, createDisplay, deleteDisplay, regenerateToken, toggleActive } = useShopFloorDisplays();
  const { teams } = useTeams();
  const { organization } = useOrgContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formMode, setFormMode] = useState<"supervisor" | "operator">("supervisor");
  const [formTeamIds, setFormTeamIds] = useState<string[]>([]);
  const [formRefresh, setFormRefresh] = useState(30);
  const [formDarkMode, setFormDarkMode] = useState<"auto" | "always" | "never">("auto");
  const [formAutoRotate, setFormAutoRotate] = useState(false);
  const [formExpiry, setFormExpiry] = useState(30);
  const [formConnectionType, setFormConnectionType] = useState<"url" | "ip" | "bluetooth">("url");
  const [formIpAddress, setFormIpAddress] = useState("");
  const [formBluetoothEnabled, setFormBluetoothEnabled] = useState(false);
  const [formBluetoothDeviceName, setFormBluetoothDeviceName] = useState("");
  const [formCastProtocol, setFormCastProtocol] = useState("");
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setFormName("");
    setFormMode("supervisor");
    setFormTeamIds([]);
    setFormRefresh(30);
    setFormDarkMode("auto");
    setFormAutoRotate(false);
    setFormExpiry(30);
    setFormConnectionType("url");
    setFormIpAddress("");
    setFormBluetoothEnabled(false);
    setFormBluetoothDeviceName("");
    setFormCastProtocol("");
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("Display name is required");
      return;
    }
    setCreating(true);
    const result = await createDisplay({
      display_name: formName.trim(),
      display_mode: formMode,
      team_ids: formTeamIds,
      refresh_interval_seconds: formRefresh,
      dark_mode: formDarkMode,
      auto_rotate_enabled: formAutoRotate,
      token_expiry_days: formExpiry,
      connection_type: formConnectionType,
      ip_address: formConnectionType === "ip" ? formIpAddress : undefined,
      bluetooth_enabled: formConnectionType === "bluetooth" ? formBluetoothEnabled : false,
      bluetooth_device_name: formConnectionType === "bluetooth" ? formBluetoothDeviceName : undefined,
      cast_protocol: formCastProtocol || undefined,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Display created! Copy the URL to set up your screen.");
      resetForm();
      setCreateOpen(false);
    }
    setCreating(false);
  };

  const handleCopyUrl = (display: ShopFloorDisplay) => {
    const url = `${window.location.origin}/display/${display.id}?token=${display.display_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Display URL copied to clipboard");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete display "${name}"? This will invalidate the token immediately.`)) return;
    const result = await deleteDisplay(id);
    if (result.error) toast.error(result.error);
    else toast.success("Display deleted");
  };

  const handleRegenToken = async (id: string) => {
    if (!confirm("Regenerate token? The old URL will stop working immediately.")) return;
    const result = await regenerateToken(id);
    if (result.error) toast.error(result.error);
    else toast.success("Token regenerated — copy the new URL");
  };

  const completedCount = CHECKLIST_ITEMS.filter(i => i.done).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Tv className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Shop Floor Displays</h3>
            <p className="text-sm text-muted-foreground">
              Configure TV and tablet displays for your production floor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowChecklist(!showChecklist)}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Checklist ({completedCount}/{CHECKLIST_ITEMS.length})
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Display
          </Button>
        </div>
      </div>

      {/* Readiness Checklist */}
      {showChecklist && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Implementation Checklist</CardTitle>
            <CardDescription className="text-xs">
              Track progress of the Shop Floor Display feature rollout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map(item => (
                <div key={item.key} className="flex items-center gap-2 py-1">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={cn("text-xs", item.done ? "text-foreground" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display Cards */}
      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Loading displays…</CardContent></Card>
      ) : displays.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tv className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No displays configured yet. Create one to set up a shop floor screen.
            </p>
            <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create First Display
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displays.map(display => (
            <DisplayCard
              key={display.id}
              display={display}
              teams={teams}
              onCopyUrl={() => handleCopyUrl(display)}
              onDelete={() => handleDelete(display.id, display.display_name)}
              onRegenToken={() => handleRegenToken(display.id)}
              onToggle={(active) => toggleActive(display.id, active)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-primary" />
              New Shop Floor Display
            </DialogTitle>
            <DialogDescription>
              Set up a new display for a TV or tablet on your production floor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Display Name</Label>
              <Input
                placeholder='e.g., "Mill Area TV", "Assembly Board"'
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>

            {/* Mode */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Display Mode</Label>
              <Select value={formMode} onValueChange={(v) => setFormMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-3.5 h-3.5" />
                      Supervisor — Full insights dashboard
                    </div>
                  </SelectItem>
                  <SelectItem value="operator">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5" />
                      Operator — Reference board (large cards)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {formMode === "supervisor"
                  ? "Station grid, WO queue, alerts, and analytics"
                  : "Large high-contrast station cards, queue summary, critical alerts only"}
              </p>
            </div>

            {/* Team scope */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Team Scope</Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFormTeamIds([])}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    formTeamIds.length === 0
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  All Teams
                </button>
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setFormTeamIds(prev =>
                        prev.includes(team.id) ? prev.filter(id => id !== team.id) : [...prev, team.id]
                      );
                    }}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors",
                      formTeamIds.includes(team.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Settings row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Refresh Interval (sec)</Label>
                <Input type="number" min={10} max={300} value={formRefresh} onChange={e => setFormRefresh(Number(e.target.value) || 30)} className="h-8" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Token Expiry (days)</Label>
                <Input type="number" min={1} max={365} value={formExpiry} onChange={e => setFormExpiry(Number(e.target.value) || 30)} className="h-8" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dark Mode</Label>
                <Select value={formDarkMode} onValueChange={v => setFormDarkMode(v as any)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="always">Always Dark</SelectItem>
                    <SelectItem value="never">Always Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={formAutoRotate} onCheckedChange={setFormAutoRotate} />
                <Label className="text-xs">Auto-rotate</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create Display"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Display Card ── */

function DisplayCard({
  display,
  teams,
  onCopyUrl,
  onDelete,
  onRegenToken,
  onToggle,
}: {
  display: ShopFloorDisplay;
  teams: any[];
  onCopyUrl: () => void;
  onDelete: () => void;
  onRegenToken: () => void;
  onToggle: (active: boolean) => void;
}) {
  const isExpired = new Date(display.token_expires_at) < new Date();
  const teamNames = display.team_ids.length === 0
    ? "All Teams"
    : display.team_ids
        .map(id => teams.find(t => t.id === id)?.name || "Unknown")
        .join(", ");

  const displayUrl = `${window.location.origin}/display/${display.id}?token=${display.display_token}`;

  return (
    <Card className={cn(!display.is_active && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className={cn("w-5 h-5", display.is_active ? "text-primary" : "text-muted-foreground")} />
            <CardTitle className="text-sm">{display.display_name}</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={display.display_mode === "supervisor" ? "default" : "secondary"} className="text-[9px]">
              {display.display_mode === "supervisor" ? "Supervisor" : "Operator"}
            </Badge>
            {isExpired ? (
              <Badge variant="destructive" className="text-[9px]">Expired</Badge>
            ) : !display.is_active ? (
              <Badge variant="secondary" className="text-[9px]">Paused</Badge>
            ) : (
              <Badge className="bg-primary text-primary-foreground text-[9px]">Active</Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs">
          Scope: {teamNames} · Refresh: {display.refresh_interval_seconds}s
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* URL display */}
        <div className="bg-muted/50 rounded-md p-2 flex items-center gap-2">
          <code className="text-[10px] text-muted-foreground truncate flex-1 select-all">
            {displayUrl}
          </code>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0" onClick={onCopyUrl}>
            <Copy className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0" asChild>
            <a href={displayUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Expires {format(new Date(display.token_expires_at), "MMM d, yyyy")}
          </span>
          {display.last_seen_at && (
            <span>Last seen {formatDistanceToNow(new Date(display.last_seen_at), { addSuffix: true })}</span>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onRegenToken}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Regen Token
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onToggle(!display.is_active)}
          >
            {display.is_active ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {display.is_active ? "Pause" : "Resume"}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
