import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TapEntry {
  size: string;
  tpi?: number;
  pitch?: number;     // mm for metric
  majorDia: number;   // inches for UNC/UNF, mm for metric
  drillSize: string;
  drillDec: number;   // decimal inches for imperial, mm for metric
  threadPercent: number;
}

export const UNC_TAPS: TapEntry[] = [
  { size: "#4-40", tpi: 40, majorDia: 0.112, drillSize: "#43", drillDec: 0.089, threadPercent: 75 },
  { size: "#6-32", tpi: 32, majorDia: 0.138, drillSize: "#36", drillDec: 0.1065, threadPercent: 75 },
  { size: "#8-32", tpi: 32, majorDia: 0.164, drillSize: "#29", drillDec: 0.136, threadPercent: 75 },
  { size: "#10-24", tpi: 24, majorDia: 0.190, drillSize: "#25", drillDec: 0.1495, threadPercent: 75 },
  { size: "#10-32", tpi: 32, majorDia: 0.190, drillSize: "#21", drillDec: 0.159, threadPercent: 75 },
  { size: "1/4-20", tpi: 20, majorDia: 0.250, drillSize: "#7", drillDec: 0.201, threadPercent: 75 },
  { size: "5/16-18", tpi: 18, majorDia: 0.3125, drillSize: "F", drillDec: 0.257, threadPercent: 75 },
  { size: "3/8-16", tpi: 16, majorDia: 0.375, drillSize: "5/16\"", drillDec: 0.3125, threadPercent: 75 },
  { size: "7/16-14", tpi: 14, majorDia: 0.4375, drillSize: "U", drillDec: 0.368, threadPercent: 75 },
  { size: "1/2-13", tpi: 13, majorDia: 0.500, drillSize: "27/64\"", drillDec: 0.4219, threadPercent: 75 },
  { size: "5/8-11", tpi: 11, majorDia: 0.625, drillSize: "17/32\"", drillDec: 0.5312, threadPercent: 75 },
  { size: "3/4-10", tpi: 10, majorDia: 0.750, drillSize: "21/32\"", drillDec: 0.6562, threadPercent: 75 },
  { size: "1-8", tpi: 8, majorDia: 1.000, drillSize: "7/8\"", drillDec: 0.875, threadPercent: 75 },
];

export const METRIC_TAPS: TapEntry[] = [
  { size: "M3×0.5", pitch: 0.5, majorDia: 3.0, drillSize: "2.5mm", drillDec: 2.5, threadPercent: 75 },
  { size: "M4×0.7", pitch: 0.7, majorDia: 4.0, drillSize: "3.3mm", drillDec: 3.3, threadPercent: 75 },
  { size: "M5×0.8", pitch: 0.8, majorDia: 5.0, drillSize: "4.2mm", drillDec: 4.2, threadPercent: 75 },
  { size: "M6×1.0", pitch: 1.0, majorDia: 6.0, drillSize: "5.0mm", drillDec: 5.0, threadPercent: 75 },
  { size: "M8×1.25", pitch: 1.25, majorDia: 8.0, drillSize: "6.8mm", drillDec: 6.8, threadPercent: 75 },
  { size: "M10×1.5", pitch: 1.5, majorDia: 10.0, drillSize: "8.5mm", drillDec: 8.5, threadPercent: 75 },
  { size: "M12×1.75", pitch: 1.75, majorDia: 12.0, drillSize: "10.2mm", drillDec: 10.2, threadPercent: 75 },
  { size: "M14×2.0", pitch: 2.0, majorDia: 14.0, drillSize: "12.0mm", drillDec: 12.0, threadPercent: 75 },
  { size: "M16×2.0", pitch: 2.0, majorDia: 16.0, drillSize: "14.0mm", drillDec: 14.0, threadPercent: 75 },
  { size: "M20×2.5", pitch: 2.5, majorDia: 20.0, drillSize: "17.5mm", drillDec: 17.5, threadPercent: 75 },
];

export function TapDrillChart() {
  const [tab, setTab] = useState("unc");
  const [search, setSearch] = useState("");

  const filter = (entries: TapEntry[]) => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) => e.size.toLowerCase().includes(q) || e.drillSize.toLowerCase().includes(q)
    );
  };

  const renderTable = (entries: TapEntry[], isMetric: boolean) => {
    const filtered = filter(entries);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Size</th>
              <th className="py-2 pr-3 font-medium">{isMetric ? "Pitch" : "TPI"}</th>
              <th className="py-2 pr-3 font-medium">Drill</th>
              <th className="py-2 pr-3 font-medium">Decimal</th>
              <th className="py-2 font-medium">Thread %</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.size} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-1.5 pr-3 font-medium">{e.size}</td>
                <td className="py-1.5 pr-3">{isMetric ? `${e.pitch}mm` : e.tpi}</td>
                <td className="py-1.5 pr-3 font-mono">{e.drillSize}</td>
                <td className="py-1.5 pr-3 font-mono">{isMetric ? `${e.drillDec}mm` : `${e.drillDec.toFixed(4)}"`}</td>
                <td className="py-1.5">
                  <Badge variant="outline" className="text-[9px] bg-primary/5 border-primary/20">{e.threadPercent}%</Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No matching sizes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search size or drill…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-xs"
        maxLength={30}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="unc" className="flex-1 text-xs">UNC / UNF</TabsTrigger>
          <TabsTrigger value="metric" className="flex-1 text-xs">Metric</TabsTrigger>
        </TabsList>
        <TabsContent value="unc" className="mt-2">{renderTable(UNC_TAPS, false)}</TabsContent>
        <TabsContent value="metric" className="mt-2">{renderTable(METRIC_TAPS, true)}</TabsContent>
      </Tabs>
      <p className="text-[10px] text-muted-foreground text-center">75% thread engagement. Adjust drill size for different %.</p>
    </div>
  );
}
