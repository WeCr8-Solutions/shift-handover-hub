import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { useStationMachineAssignment } from "@/hooks/useStationMachineProfile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu, Wrench, ShoppingCart, CheckCircle2, Unlink, ShieldCheck, Loader2 } from "lucide-react";
import { StationManufacturerAttach } from "./StationManufacturerAttach";
import { StationManualMachineEntry } from "./StationManualMachineEntry";
import { useToast } from "@/hooks/use-toast";

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
  // keep loose: other fields exist but are not needed here
  [key: string]: unknown;
}

export function StationMachineContextDialog({ stationId, stationName, open, onOpenChange }: Props) {
  const { organization } = useUserOrganization();
  const orgId = organization?.id ?? null;

  const { assignment, loading: assignLoading, unassignMachine } = useStationMachineAssignment(stationId, orgId);

  const { toast } = useToast();

  const [manualProfile, setManualProfile] = useState<ManualProfile | null>(null);
  const [loadingManual, setLoadingManual] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const fetchManualProfile = async () => {
    if (!stationId) return;
    setLoadingManual(true);

    const { data, error } = await supabase
      .from("station_manual_machine_profiles" as any)
      .select("*")
      .eq("station_id", stationId)
      .maybeSingle();

    if (error) {
      // optional toast; for now just clear the profile
      setManualProfile(null);
    } else {
      setManualProfile(data as ManualProfile | null);
    }

    setLoadingManual(false);
  };

  useEffect(() => {
    if (open) {
      fetchManualProfile();
    }
  }, [open, stationId]);

  const handleRemoveManual = async () => {
    if (!manualProfile) return;

    await supabase
      .from("station_manual_machine_profiles" as any)
      .delete()
      .eq("id", manualProfile.id);

    setManualProfile(null);
    toast({ title: "Manual profile removed" });
  };

  const handleUnassignLibrary = async () => {
    await unassignMachine();
    toast({ title: "Library profile unassigned" });
  };

  const hasLibraryProfile = Boolean(assignment?.machine);
  const hasManualProfile = Boolean(manualProfile) && !hasLibraryProfile;
  const hasAnyProfile = hasLibraryProfile || hasManualProfile;

  const loading = assignLoading || loadingManual;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
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
                        <Button variant="ghost" size="sm" onClick={() => setShowManualEntry(true)}>
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
                onClick={() => {
                  onOpenChange(false);
                  setShowManualEntry(true);
                }}
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
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  onOpenChange(false);
                  setShowLibrary(true);
                }}
              >
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
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <StationManufacturerAttach
        stationId={stationId}
        stationName={stationName}
        open={showLibrary}
        onOpenChange={setShowLibrary}
      />

      <StationManualMachineEntry
        stationId={stationId}
        stationName={stationName}
        open={showManualEntry}
        onOpenChange={setShowManualEntry}
        existingProfile={manualProfile}
        onSaved={fetchManualProfile}
      />
    </>
  );
}
