import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Milling MRR = WOC × DOC × Feed Rate (in³/min or cm³/min)
 * Turning MRR = π × D × DOC × f × N  (simplified: DOC × f × SFM × 12) for in³/min
 */

export function millingMrr(woc: number, doc: number, feedRate: number): number {
  return woc * doc * feedRate;
}

export function turningMrr(doc: number, feedPerRev: number, sfm: number, diameter: number): number {
  if (diameter <= 0) return 0;
  const rpm = (sfm * 12) / (Math.PI * diameter);
  return Math.PI * diameter * doc * feedPerRev * rpm;
}

export function MrrCalculator() {
  const [mode, setMode] = useState("milling");

  // Milling inputs
  const [woc, setWoc] = useState("0.5");
  const [doc, setDoc] = useState("0.1");
  const [feedRate, setFeedRate] = useState("15");

  // Turning inputs
  const [tDoc, setTDoc] = useState("0.05");
  const [tFeed, setTFeed] = useState("0.008");
  const [tSfm, setTSfm] = useState("300");
  const [tDia, setTDia] = useState("2.0");

  const millingResult = millingMrr(parseFloat(woc) || 0, parseFloat(doc) || 0, parseFloat(feedRate) || 0);
  const turningResult = turningMrr(parseFloat(tDoc) || 0, parseFloat(tFeed) || 0, parseFloat(tSfm) || 0, parseFloat(tDia) || 0);

  const ResultCard = ({ value, label }: { value: number; label: string }) => (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">MRR</p>
      <p className="text-xl font-bold text-primary">{value > 0 ? value.toFixed(3) : "—"}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="w-full">
          <TabsTrigger value="milling" className="flex-1 text-xs">Milling</TabsTrigger>
          <TabsTrigger value="turning" className="flex-1 text-xs">Turning</TabsTrigger>
        </TabsList>

        <TabsContent value="milling" className="space-y-3 mt-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Width of Cut (in)</Label>
              <Input value={woc} onChange={(e) => setWoc(e.target.value)} type="number" step="0.01" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Depth of Cut (in)</Label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} type="number" step="0.01" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Feed Rate (IPM)</Label>
              <Input value={feedRate} onChange={(e) => setFeedRate(e.target.value)} type="number" step="0.1" className="h-9" />
            </div>
          </div>
          <Separator />
          <ResultCard value={millingResult} label="in³/min" />
          <p className="text-[10px] text-muted-foreground text-center">MRR = WOC × DOC × Feed Rate</p>
        </TabsContent>

        <TabsContent value="turning" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Depth of Cut (in)</Label>
              <Input value={tDoc} onChange={(e) => setTDoc(e.target.value)} type="number" step="0.001" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Feed/Rev (in)</Label>
              <Input value={tFeed} onChange={(e) => setTFeed(e.target.value)} type="number" step="0.001" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">SFM</Label>
              <Input value={tSfm} onChange={(e) => setTSfm(e.target.value)} type="number" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Workpiece Dia (in)</Label>
              <Input value={tDia} onChange={(e) => setTDia(e.target.value)} type="number" step="0.01" className="h-9" />
            </div>
          </div>
          <Separator />
          <ResultCard value={turningResult} label="in³/min" />
          <p className="text-[10px] text-muted-foreground text-center">MRR = π × D × DOC × f × RPM</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
