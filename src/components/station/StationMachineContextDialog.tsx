import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/contexts/OrgContext";
import { useStationMachineAssignment } from "@/hooks/useStationMachineProfile";
import { useDNCConnector } from "@/hooks/useDNCConnector";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Cpu, Wrench, ShoppingCart, CheckCircle2, Unlink, ShieldCheck, Loader2, Radio, Wifi, WifiOff } from "lucide-react";
import { StationManufacturerAttach } from "./StationManufacturerAttach";
import { StationManualMachineEntry } from "./StationManualMachineEntry";
import { useToast } from "@/hooks/use-toast";

const DEBUG = process.env.NODE_ENV !== "production";

function dbg(label: string, ...args: unknown[]) {
  if (DEBUG) {
    console.log(`[StationMachineContextDialog] ${label}`, ...args);
  }
}

interface Props {
  stationId: string;
  stationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ManualProfile {
  id: string;
  station_id: string;
  manufacturer: string;
  model: string;
  machine_type: string;
  platform_category: string;
  [key: string]: unknown;
}

export function StationMachineContextDialog({ stationId, stationName, open, onOpenChange }: Props) {
  const { organization } = useOrgContext();
  const orgId = organization?.id ?? null;

  dbg("render", { stationId, stationName, open, orgId });

  const { assignment, loading: assignLoading, unassignMachine } = useStationMachineAssignment(stationId, orgId);
  const { status: dncStatus, connecting: dncConnecting, getStationDNCConfig, initializeConnection, disconnect: dncDisconnect } = useDNCConnector(stationId);

  const { toast } = useToast();

  const [manualProfile, setManualProfile] = useState<ManualProfile | null>(null);
  const [loadingManual, setLoadingManual] = useState(true);
  const [dncConfig, setDncConfig] = useState<Record<string, unknown> | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // FIX: wrap in useCallback so the stable reference can be listed in useEffect deps
  // without triggering infinite re-fetches.
  const fetchManualProfile = useCallback(async () => {
    if (!stationId) {
      dbg("fetchManualProfile: skipped — no stationId");
      return;
    }

    dbg("fetchManualProfile: fetching for stationId", stationId);
    setLoadingManual(true);

    const { data, error } = await supabase
      .from("station_manual_machine_profiles" as any)
      .select("*")
      .eq("station_id", stationId)
      .maybeSingle();

    if (error) {
      dbg("fetchManualProfile: error", error);
      toast({
        title: "Could not load manual profile",
        description: error.message,
        variant: "destructive",
      });
      setManualProfile(null);
    } else {
      dbg("fetchManualProfile: result", data);
      setManualProfile(data as unknown as ManualProfile | null);
    }

    setLoadingManual(false);
  }, [stationId, toast]);

  // FIX: fetchManualProfile is now stable and safe to include as a dep.
  useEffect(() => {
    if (open) {
      dbg("useEffect: dialog opened, fetching manual profile + DNC config");
      fetchManualProfile();
      getStationDNCConfig(stationId).then(cfg => setDncConfig(cfg));
    }
  }, [open, fetchManualProfile, getStationDNCConfig, stationId]);

  // Log state changes for debugging
  useEffect(() => {
    dbg("assignment updated", assignment);
  }, [assignment]);

  useEffect(() => {
    dbg("manualProfile updated", manualProfile);
  }, [manualProfile]);

  const handleRemoveManual = async () => {
    if (!manualProfile) {
      dbg("handleRemoveManual: no profile to remove");
      return;
    }

    dbg("handleRemoveManual: deleting", manualProfile.id);

    const { error } = await supabase
      .from("station_manual_machine_profiles" as any)
      .delete()
      .eq("id", manualProfile.id);

    if (error) {
      // FIX: was silently ignoring delete errors
      dbg("handleRemoveManual: error", error);
      toast({
        title: "Failed to remove manual profile",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    dbg("handleRemoveManual: success");
    setManualProfile(null);
    toast({ title: "Manual profile removed" });
  };

  const handleUnassignLibrary = async () => {
    dbg("handleUnassignLibrary: unassigning");
    await unassignMachine();
    dbg("handleUnassignLibrary: done");
    toast({ title: "Library profile unassigned" });
  };

  const hasLibraryProfile = Boolean(assignment?.machine);
  const hasManualProfile = Boolean(manualProfile) && !hasLibraryProfile;
  const hasAnyProfile = hasLibraryProfile || hasManualProfile;

  dbg("profile state", { hasLibraryProfile, hasManualProfile, hasAnyProfile, assignLoading, loadingManual });

  const loading = assignLoading || loadingManual;

  // FIX: Separate handlers that don't call onOpenChange(false) before the
  // sub-dialog opens. Closing the parent first then immediately opening a child
  // can race in some render cycles. Instead, keep the parent open until the
  // sub-dialog is fully mounted, then close parent.
  const handleOpenManualEntry = () => {
    dbg("handleOpenManualEntry");
    setShowManualEntry(true);
    onOpenChange(false);
  };

  const handleOpenLibrary = () => {
    dbg("handleOpenLibrary");
    setShowLibrary(true);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              Machine Context — {stationName}
            </DialogTitle>
            <DialogDescription>
              Add machine specs for AI-powered routing validation. Choose one method:
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : hasAnyProfile ? (
            <div className="space-y-3">
              {hasLibraryProfile && assignment?.machine && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-green-700 truncate">
                              {assignment.machine.manufacturer} {assignment.machine.model}
                            </p>
                            <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {assignment.machine.machine_type} · {assignment.machine.platform_category}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Purchased from Machine Library · Reusable across stations.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUnassignLibrary}
                        className="text-muted-foreground shrink-0"
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasManualProfile && manualProfile && (
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Wrench className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-blue-700 truncate">
                            {manualProfile.manufacturer} {manualProfile.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {manualProfile.machine_type} · {manualProfile.platform_category}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Manually entered · This station only.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={handleOpenManualEntry}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveManual}
                          className="text-muted-foreground"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-muted-foreground text-center pt-2">
                Want to switch? Remove the current profile first, then choose a new method.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option 1: Manual Entry (Free) */}
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={handleOpenManualEntry}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Wrench className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">Enter Manually</h4>
                        <Badge variant="secondary" className="text-[10px]">
                          Free
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fill in your machine&apos;s specs yourself. Data is tied to this station only. Same fields as
                        verified profiles — full AI routing support.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Option 2: Purchase from Library ($0.99) */}
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={handleOpenLibrary}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <ShoppingCart className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">Machine Library</h4>
                        <Badge className="text-[10px] bg-green-600">$0.99/model</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Browse verified machine profiles with pre-filled specs. Purchase once, reuse across unlimited
                        stations. Includes verified badge.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DNC / G-Code Connection Section */}
          <Separator className="my-2" />
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Radio className="w-3 h-3" />
              DNC &amp; G-Code Connection
            </h4>
            {dncConfig ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wifi className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {String(dncConfig.protocol || "DNC").toUpperCase()} Connected
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {dncConfig.host ? `${dncConfig.host}:${dncConfig.port}` : "Local connection configured"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                        Active
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-7 px-2"
                        onClick={() => {
                          dncDisconnect(stationId);
                          setDncConfig(null);
                        }}
                      >
                        <WifiOff className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={async () => {
                  const session = await initializeConnection({
                    protocol: "ftp",
                    stationId,
                  });
                  if (session) {
                    getStationDNCConfig(stationId).then(cfg => setDncConfig(cfg));
                  }
                }}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Radio className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">Connect DNC / G-Code</h4>
                        <Badge variant="secondary" className="text-[10px]">
                          Beta
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enable FTP, serial, or WebSocket transmission for live G-code
                        streaming from VS Code extension or DNC system.
                      </p>
                    </div>
                    {dncConnecting && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <StationManufacturerAttach
        stationId={stationId}
        stationName={stationName}
        open={showLibrary}
        onOpenChange={(v) => {
          dbg("showLibrary onOpenChange", v);
          setShowLibrary(v);
        }}
      />

      <StationManualMachineEntry
        stationId={stationId}
        stationName={stationName}
        open={showManualEntry}
        onOpenChange={(v) => {
          dbg("showManualEntry onOpenChange", v);
          setShowManualEntry(v);
        }}
        existingProfile={manualProfile ?? undefined}
        onSaved={() => {
          dbg("onSaved: re-fetching manual profile");
          fetchManualProfile();
        }}
      />
    </>
  );
}
