import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * TPI ↔ Pitch: pitch(mm) = 25.4 / TPI
 * Minor Diameter (imperial) = Major - (1.0825 / TPI)
 * Pitch Diameter (imperial) = Major - (0.6495 / TPI)
 */

export function tpiToPitch(tpi: number): number {
  return tpi > 0 ? 25.4 / tpi : 0;
}

export function pitchToTpi(pitchMm: number): number {
  return pitchMm > 0 ? 25.4 / pitchMm : 0;
}

export function threadDiameters(majorDia: number, tpi: number): { minor: number; pitch: number } | null {
  if (tpi <= 0 || majorDia <= 0) return null;
  return {
    minor: majorDia - 1.0825 / tpi,
    pitch: majorDia - 0.6495 / tpi,
  };
}

export function ThreadPitchCalculator() {
  const [mode, setMode] = useState("tpi-to-pitch");

  // TPI ↔ Pitch
  const [tpi, setTpi] = useState("20");
  const [pitch, setPitch] = useState("1.25");

  // Thread specs
  const [majorDia, setMajorDia] = useState("0.250");
  const [specTpi, setSpecTpi] = useState("20");

  const tpiVal = parseFloat(tpi) || 0;
  const pitchVal = parseFloat(pitch) || 0;
  const majorVal = parseFloat(majorDia) || 0;
  const specTpiVal = parseFloat(specTpi) || 0;

  const convertedPitch = tpiToPitch(tpiVal);
  const convertedTpi = pitchToTpi(pitchVal);
  const dims = threadDiameters(majorVal, specTpiVal);

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="w-full">
          <TabsTrigger value="tpi-to-pitch" className="flex-1 text-xs">TPI ↔ Pitch</TabsTrigger>
          <TabsTrigger value="thread-specs" className="flex-1 text-xs">Thread Specs</TabsTrigger>
        </TabsList>

        <TabsContent value="tpi-to-pitch" className="space-y-4 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">TPI (Threads Per Inch)</Label>
              <Input value={tpi} onChange={(e) => setTpi(e.target.value)} type="number" step="1" className="h-9" />
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Pitch</p>
                <p className="text-lg font-bold text-primary">{tpiVal > 0 ? `${convertedPitch.toFixed(4)} mm` : "—"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Pitch (mm)</Label>
              <Input value={pitch} onChange={(e) => setPitch(e.target.value)} type="number" step="0.01" className="h-9" />
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">TPI</p>
                <p className="text-lg font-bold text-primary">{pitchVal > 0 ? convertedTpi.toFixed(2) : "—"}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="thread-specs" className="space-y-4 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Major Diameter (in)</Label>
              <Input value={majorDia} onChange={(e) => setMajorDia(e.target.value)} type="number" step="0.001" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">TPI</Label>
              <Input value={specTpi} onChange={(e) => setSpecTpi(e.target.value)} type="number" step="1" className="h-9" />
            </div>
          </div>

          <Separator />

          {dims ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Major Dia</p>
                <p className="text-lg font-bold text-primary">{majorVal.toFixed(4)}"</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Pitch Dia</p>
                <p className="text-lg font-bold text-primary">{dims.pitch.toFixed(4)}"</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Minor Dia</p>
                <p className="text-lg font-bold text-primary">{dims.minor.toFixed(4)}"</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Enter major diameter and TPI to calculate.</p>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            Minor = Major − 1.0825/TPI &nbsp;|&nbsp; Pitch = Major − 0.6495/TPI
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
