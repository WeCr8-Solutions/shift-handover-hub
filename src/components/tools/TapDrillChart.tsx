import { useState, useMemo } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UNC_THREAD_DATA,
  UNF_THREAD_DATA,
  METRIC_THREAD_DATA,
  type UnifiedThreadEntry,
  type MetricThreadEntry,
} from "./threadData";

type ThreadTab = "unc" | "unf" | "metric";
type ViewMode = "tap-drill" | "thread-limits";
type ThreadPercent = "75" | "50";

export function TapDrillChart() {
  const [tab, setTab] = useUrlState<ThreadTab>("thread", "unc");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tap-drill");
  const [threadPercent, setThreadPercent] = useState<ThreadPercent>("75");
  const [showSTI, setShowSTI] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  const filterUnified = (entries: UnifiedThreadEntry[]) => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.size.toLowerCase().includes(q) ||
        e.tapDrill75.toLowerCase().includes(q) ||
        e.tapDrill50.toLowerCase().includes(q) ||
        e.stiTapDrill.toLowerCase().includes(q)
    );
  };

  const filterMetric = (entries: MetricThreadEntry[]) => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.size.toLowerCase().includes(q) ||
        e.tapDrill75.toLowerCase().includes(q) ||
        e.tapDrill50.toLowerCase().includes(q) ||
        e.stiTapDrill.toLowerCase().includes(q)
    );
  };

  const filteredUNC = useMemo(() => filterUnified(UNC_THREAD_DATA), [search]);
  const filteredUNF = useMemo(() => filterUnified(UNF_THREAD_DATA), [search]);
  const filteredMetric = useMemo(() => filterMetric(METRIC_THREAD_DATA), [search]);

  const renderTapDrillTable = (entries: UnifiedThreadEntry[], isUNF = false) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-2 font-medium">Size</th>
            <th className="py-2 pr-2 font-medium">TPI</th>
            <th className="py-2 pr-2 font-medium">
              {threadPercent === "75" ? "75% Drill" : "50% Drill"}
            </th>
            <th className="py-2 pr-2 font-medium">Decimal</th>
            {showSTI && (
              <>
                <th className="py-2 pr-2 font-medium text-amber-600 dark:text-amber-400">STI Drill</th>
                <th className="py-2 font-medium text-amber-600 dark:text-amber-400">STI Dec</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const drill = threadPercent === "75" ? e.tapDrill75 : e.tapDrill50;
            const dec = threadPercent === "75" ? e.tapDrillDec75 : e.tapDrillDec50;
            return (
              <tr
                key={e.size}
                className={cn(
                  "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                  selectedThread === e.size && "bg-primary/10"
                )}
                onClick={() => setSelectedThread(selectedThread === e.size ? null : e.size)}
              >
                <td className="py-1.5 pr-2 font-medium">{e.size}</td>
                <td className="py-1.5 pr-2">{e.tpi}</td>
                <td className="py-1.5 pr-2 font-mono">{drill}</td>
                <td className="py-1.5 pr-2 font-mono">{dec.toFixed(4)}"</td>
                {showSTI && (
                  <>
                    <td className="py-1.5 pr-2 font-mono text-amber-600 dark:text-amber-400">{e.stiTapDrill}</td>
                    <td className="py-1.5 font-mono text-amber-600 dark:text-amber-400">{e.stiTapDrillDec.toFixed(4)}"</td>
                  </>
                )}
              </tr>
            );
          })}
          {entries.length === 0 && (
            <tr><td colSpan={showSTI ? 6 : 4} className="py-4 text-center text-muted-foreground">No matching sizes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderMetricTapDrillTable = (entries: MetricThreadEntry[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-2 font-medium">Size</th>
            <th className="py-2 pr-2 font-medium">Pitch</th>
            <th className="py-2 pr-2 font-medium">
              {threadPercent === "75" ? "75% Drill" : "50% Drill"}
            </th>
            <th className="py-2 pr-2 font-medium">mm</th>
            {showSTI && (
              <>
                <th className="py-2 pr-2 font-medium text-amber-600 dark:text-amber-400">STI Drill</th>
                <th className="py-2 font-medium text-amber-600 dark:text-amber-400">STI mm</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const drill = threadPercent === "75" ? e.tapDrill75 : e.tapDrill50;
            const dec = threadPercent === "75" ? e.tapDrillDec75 : e.tapDrillDec50;
            return (
              <tr
                key={e.size}
                className={cn(
                  "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                  selectedThread === e.size && "bg-primary/10"
                )}
                onClick={() => setSelectedThread(selectedThread === e.size ? null : e.size)}
              >
                <td className="py-1.5 pr-2 font-medium">{e.size}</td>
                <td className="py-1.5 pr-2">{e.pitch}mm</td>
                <td className="py-1.5 pr-2 font-mono">{drill}</td>
                <td className="py-1.5 pr-2 font-mono">{dec.toFixed(2)}mm</td>
                {showSTI && (
                  <>
                    <td className="py-1.5 pr-2 font-mono text-amber-600 dark:text-amber-400">{e.stiTapDrill}</td>
                    <td className="py-1.5 font-mono text-amber-600 dark:text-amber-400">{e.stiTapDrillDec.toFixed(2)}mm</td>
                  </>
                )}
              </tr>
            );
          })}
          {entries.length === 0 && (
            <tr><td colSpan={showSTI ? 6 : 4} className="py-4 text-center text-muted-foreground">No matching sizes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Thread Limits Detail View ──

  const renderUnifiedLimitsTable = (entries: UnifiedThreadEntry[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-1 font-medium" rowSpan={2}>Size</th>
            <th className="py-1 text-center font-medium border-b" colSpan={3}>Nominal (Basic)</th>
            <th className="py-1 text-center font-medium border-b text-blue-600 dark:text-blue-400" colSpan={2}>External</th>
            <th className="py-1 text-center font-medium border-b text-emerald-600 dark:text-emerald-400" colSpan={2}>Internal</th>
          </tr>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1 pr-1 font-medium">Major</th>
            <th className="py-1 pr-1 font-medium">Pitch</th>
            <th className="py-1 pr-1 font-medium">Minor</th>
            <th className="py-1 pr-1 font-medium text-blue-600 dark:text-blue-400">Class</th>
            <th className="py-1 pr-1 font-medium text-blue-600 dark:text-blue-400">Pitch ø</th>
            <th className="py-1 pr-1 font-medium text-emerald-600 dark:text-emerald-400">Class</th>
            <th className="py-1 font-medium text-emerald-600 dark:text-emerald-400">Pitch ø</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <>
              <tr
                key={`${e.size}-2`}
                className={cn(
                  "border-b border-border/30 hover:bg-muted/30 transition-colors",
                  selectedThread === e.size && "bg-primary/10"
                )}
              >
                <td className="py-1 pr-1 font-medium" rowSpan={2}>{e.size}</td>
                <td className="py-1 pr-1 font-mono" rowSpan={2}>{e.basicMajorDia.toFixed(4)}</td>
                <td className="py-1 pr-1 font-mono" rowSpan={2}>{e.basicPitchDia.toFixed(4)}</td>
                <td className="py-1 pr-1 font-mono" rowSpan={2}>{e.basicMinorDia.toFixed(4)}</td>
                <td className="py-1 pr-1 font-mono text-blue-600 dark:text-blue-400">2A</td>
                <td className="py-1 pr-1 font-mono text-blue-600 dark:text-blue-400">
                  {e.class2A.pitchMax.toFixed(4)} / {e.class2A.pitchMin.toFixed(4)}
                </td>
                <td className="py-1 pr-1 font-mono text-emerald-600 dark:text-emerald-400">2B</td>
                <td className="py-1 font-mono text-emerald-600 dark:text-emerald-400">
                  {e.class2B.pitchMax.toFixed(4)} / {e.class2B.pitchMin.toFixed(4)}
                </td>
              </tr>
              <tr
                key={`${e.size}-3`}
                className={cn(
                  "border-b border-border/50 hover:bg-muted/30 transition-colors",
                  selectedThread === e.size && "bg-primary/10"
                )}
              >
                <td className="py-1 pr-1 font-mono text-blue-600 dark:text-blue-400">3A</td>
                <td className="py-1 pr-1 font-mono text-blue-600 dark:text-blue-400">
                  {e.class3A.pitchMax.toFixed(4)} / {e.class3A.pitchMin.toFixed(4)}
                </td>
                <td className="py-1 pr-1 font-mono text-emerald-600 dark:text-emerald-400">3B</td>
                <td className="py-1 font-mono text-emerald-600 dark:text-emerald-400">
                  {e.class3B.pitchMax.toFixed(4)} / {e.class3B.pitchMin.toFixed(4)}
                </td>
              </tr>
            </>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={8} className="py-4 text-center text-muted-foreground">No matching sizes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderMetricLimitsTable = (entries: MetricThreadEntry[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-1 font-medium" rowSpan={2}>Size</th>
            <th className="py-1 text-center font-medium border-b" colSpan={3}>Nominal (Basic) mm</th>
            <th className="py-1 text-center font-medium border-b text-blue-600 dark:text-blue-400" colSpan={2}>External</th>
            <th className="py-1 text-center font-medium border-b text-emerald-600 dark:text-emerald-400" colSpan={2}>Internal</th>
          </tr>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1 pr-1 font-medium">Major</th>
            <th className="py-1 pr-1 font-medium">Pitch</th>
            <th className="py-1 pr-1 font-medium">Minor</th>
            <th className="py-1 pr-1 font-medium text-blue-600 dark:text-blue-400">Class</th>
            <th className="py-1 pr-1 font-medium text-blue-600 dark:text-blue-400">Pitch ø</th>
            <th className="py-1 pr-1 font-medium text-emerald-600 dark:text-emerald-400">Class</th>
            <th className="py-1 font-medium text-emerald-600 dark:text-emerald-400">Pitch ø</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <>
              <tr
                key={`${e.size}-6g`}
                className={cn(
                  "border-b border-border/30 hover:bg-muted/30 transition-colors",
                  selectedThread === e.size && "bg-primary/10"
                )}
              >
                <td className="py-1 pr-1 font-medium" rowSpan={2}>{e.size}</td>
                <td className="py-1 pr-1 font-mono" rowSpan={2}>{e.basicMajorDia.toFixed(3)}</td>
                <td className="py-1 pr-1 font-mono" rowSpan={2}>{e.basicPitchDia.toFixed(3)}</td>
                <td className="py-1 pr-1 font-mono" rowSpan={2}>{e.basicMinorDia.toFixed(3)}</td>
                <td className="py-1 pr-1 font-mono text-blue-600 dark:text-blue-400">6g</td>
                <td className="py-1 pr-1 font-mono text-blue-600 dark:text-blue-400">
                  {e.class6g.pitchMax.toFixed(3)} / {e.class6g.pitchMin.toFixed(3)}
                </td>
                <td className="py-1 pr-1 font-mono text-emerald-600 dark:text-emerald-400">6H</td>
                <td className="py-1 font-mono text-emerald-600 dark:text-emerald-400">
                  {e.class6H.pitchMax.toFixed(3)} / {e.class6H.pitchMin.toFixed(3)}
                </td>
              </tr>
              <tr
                key={`${e.size}-4g`}
                className={cn(
                  "border-b border-border/50 hover:bg-muted/30 transition-colors",
                  selectedThread === e.size && "bg-primary/10"
                )}
              >
                <td className="py-1 pr-1 font-mono text-blue-600 dark:text-blue-400">4g6g</td>
                <td className="py-1 pr-1 font-mono text-blue-600 dark:text-blue-400">
                  {e.class4g6g.pitchMax.toFixed(3)} / {e.class4g6g.pitchMin.toFixed(3)}
                </td>
                <td className="py-1 pr-1 font-mono text-emerald-600 dark:text-emerald-400">4H5H</td>
                <td className="py-1 font-mono text-emerald-600 dark:text-emerald-400">
                  {e.class4H5H.pitchMax.toFixed(3)} / {e.class4H5H.pitchMin.toFixed(3)}
                </td>
              </tr>
            </>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={8} className="py-4 text-center text-muted-foreground">No matching sizes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Thread Detail Panel ──

  const selectedUnified = tab !== "metric"
    ? (tab === "unc" ? UNC_THREAD_DATA : UNF_THREAD_DATA).find((e) => e.size === selectedThread)
    : null;
  const selectedMetricEntry = tab === "metric"
    ? METRIC_THREAD_DATA.find((e) => e.size === selectedThread)
    : null;

  const renderDetailPanel = () => {
    if (selectedUnified) {
      const e = selectedUnified;
      return (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Info className="h-3.5 w-3.5 text-primary" />
            {e.size} — Full Thread Data
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><span className="text-muted-foreground">Major ø:</span> <span className="font-mono">{e.basicMajorDia.toFixed(4)}"</span></div>
            <div><span className="text-muted-foreground">Pitch ø:</span> <span className="font-mono">{e.basicPitchDia.toFixed(4)}"</span></div>
            <div><span className="text-muted-foreground">Minor ø:</span> <span className="font-mono">{e.basicMinorDia.toFixed(4)}"</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">External (Bolt/Screw)</p>
              {(["class2A", "class3A"] as const).map((cls) => (
                <div key={cls} className="mb-1">
                  <Badge variant="outline" className="text-[9px] mb-0.5">{cls.replace("class", "")}</Badge>
                  <div className="font-mono text-[10px] space-y-0.5 ml-1">
                    <div>Maj: {e[cls].majorMax.toFixed(4)} / {e[cls].majorMin.toFixed(4)}</div>
                    <div>Pit: {e[cls].pitchMax.toFixed(4)} / {e[cls].pitchMin.toFixed(4)}</div>
                    <div>Min: {e[cls].minorMax.toFixed(4)} / {e[cls].minorMin.toFixed(4)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Internal (Nut/Hole)</p>
              {(["class2B", "class3B"] as const).map((cls) => (
                <div key={cls} className="mb-1">
                  <Badge variant="outline" className="text-[9px] mb-0.5">{cls.replace("class", "")}</Badge>
                  <div className="font-mono text-[10px] space-y-0.5 ml-1">
                    <div>Pit: {e[cls].pitchMax.toFixed(4)} / {e[cls].pitchMin.toFixed(4)}</div>
                    <div>Min: {e[cls].minorMax.toFixed(4)} / {e[cls].minorMin.toFixed(4)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-1 border-t border-border/50">
            <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Tap Drills & STI</p>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div>
                <span className="text-muted-foreground block">75%:</span>
                {e.tapDrill75} ({e.tapDrillDec75.toFixed(4)}")
              </div>
              <div>
                <span className="text-muted-foreground block">50%:</span>
                {e.tapDrill50} ({e.tapDrillDec50.toFixed(4)}")
              </div>
              <div>
                <span className="text-muted-foreground block">STI:</span>
                {e.stiTapDrill} ({e.stiTapDrillDec.toFixed(4)}")
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedMetricEntry) {
      const e = selectedMetricEntry;
      return (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Info className="h-3.5 w-3.5 text-primary" />
            {e.size} — Full Thread Data
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><span className="text-muted-foreground">Major ø:</span> <span className="font-mono">{e.basicMajorDia.toFixed(3)}mm</span></div>
            <div><span className="text-muted-foreground">Pitch ø:</span> <span className="font-mono">{e.basicPitchDia.toFixed(3)}mm</span></div>
            <div><span className="text-muted-foreground">Minor ø:</span> <span className="font-mono">{e.basicMinorDia.toFixed(3)}mm</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">External (Bolt)</p>
              {(["class6g", "class4g6g"] as const).map((cls) => (
                <div key={cls} className="mb-1">
                  <Badge variant="outline" className="text-[9px] mb-0.5">{cls.replace("class", "")}</Badge>
                  <div className="font-mono text-[10px] space-y-0.5 ml-1">
                    <div>Maj: {e[cls].majorMax.toFixed(3)} / {e[cls].majorMin.toFixed(3)}</div>
                    <div>Pit: {e[cls].pitchMax.toFixed(3)} / {e[cls].pitchMin.toFixed(3)}</div>
                    <div>Min: {e[cls].minorMax.toFixed(3)} / {e[cls].minorMin.toFixed(3)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Internal (Nut)</p>
              {(["class6H", "class4H5H"] as const).map((cls) => (
                <div key={cls} className="mb-1">
                  <Badge variant="outline" className="text-[9px] mb-0.5">{cls.replace("class", "")}</Badge>
                  <div className="font-mono text-[10px] space-y-0.5 ml-1">
                    <div>Pit: {e[cls].pitchMax.toFixed(3)} / {e[cls].pitchMin.toFixed(3)}</div>
                    <div>Min: {e[cls].minorMax.toFixed(3)} / {e[cls].minorMin.toFixed(3)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-1 border-t border-border/50">
            <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Tap Drills & STI</p>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div>
                <span className="text-muted-foreground block">75%:</span>
                {e.tapDrill75} ({e.tapDrillDec75.toFixed(2)}mm)
              </div>
              <div>
                <span className="text-muted-foreground block">50%:</span>
                {e.tapDrill50} ({e.tapDrillDec50.toFixed(2)}mm)
              </div>
              <div>
                <span className="text-muted-foreground block">STI:</span>
                {e.stiTapDrill} ({e.stiTapDrillDec.toFixed(2)}mm)
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search size, drill, or thread…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-xs"
        maxLength={30}
      />

      {/* View mode & options */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <RadioGroup
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
          className="flex gap-3"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="tap-drill" id="vt" />
            <Label htmlFor="vt" className="text-xs cursor-pointer">Tap Drill</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="thread-limits" id="vl" />
            <Label htmlFor="vl" className="text-xs cursor-pointer">Thread Limits</Label>
          </div>
        </RadioGroup>

        <div className="h-4 w-px bg-border" />

        {viewMode === "tap-drill" && (
          <>
            <RadioGroup
              value={threadPercent}
              onValueChange={(v) => setThreadPercent(v as ThreadPercent)}
              className="flex gap-3"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="75" id="p75" />
                <Label htmlFor="p75" className="text-xs cursor-pointer">75%</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="50" id="p50" />
                <Label htmlFor="p50" className="text-xs cursor-pointer">50%</Label>
              </div>
            </RadioGroup>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showSTI}
                onChange={(e) => setShowSTI(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-xs text-amber-600 dark:text-amber-400">STI / Heli-Coil</span>
            </label>
          </>
        )}
      </div>

      {/* Thread type tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as ThreadTab); setSelectedThread(null); }}>
        <TabsList className="w-full">
          <TabsTrigger value="unc" className="flex-1 text-xs">UNC</TabsTrigger>
          <TabsTrigger value="unf" className="flex-1 text-xs">UNF</TabsTrigger>
          <TabsTrigger value="metric" className="flex-1 text-xs">Metric</TabsTrigger>
        </TabsList>

        <TabsContent value="unc" className="mt-2">
          {viewMode === "tap-drill"
            ? renderTapDrillTable(filteredUNC)
            : renderUnifiedLimitsTable(filteredUNC)}
        </TabsContent>
        <TabsContent value="unf" className="mt-2">
          {viewMode === "tap-drill"
            ? renderTapDrillTable(filteredUNF, true)
            : renderUnifiedLimitsTable(filteredUNF)}
        </TabsContent>
        <TabsContent value="metric" className="mt-2">
          {viewMode === "tap-drill"
            ? renderMetricTapDrillTable(filteredMetric)
            : renderMetricLimitsTable(filteredMetric)}
        </TabsContent>
      </Tabs>

      {/* Selected thread detail */}
      {renderDetailPanel()}

      {/* Reference notes */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
          <ChevronDown className="h-3 w-3" />
          Reference Notes
        </CollapsibleTrigger>
        <CollapsibleContent className="text-[10px] text-muted-foreground space-y-1.5 pt-2 px-1">
          <p><strong>Thread Classes:</strong> 2A/2B are standard fit (most common). 3A/3B are close tolerance fit for precision work.</p>
          <p><strong>Metric Classes:</strong> 6g/6H are standard. 4g6g/4H5H are close tolerance equivalents.</p>
          <p><strong>75% vs 50% Thread:</strong> 75% is standard. Use 50% for harder materials (above 35 HRC), deep holes, or to reduce tap breakage. Strength loss is only ~5%.</p>
          <p><strong>STI (Screw Thread Insert):</strong> Heli-Coil style inserts require a larger tap drill. The oversize hole is tapped to the STI tap size, then the insert is installed to restore standard thread engagement.</p>
          <p><strong>Pitch Diameter:</strong> Shown as Max / Min. This is the critical go/no-go gage dimension for thread acceptance.</p>
          <p className="text-[9px] italic">Data per Machinery's Handbook, ASME B1.1 (Unified) & ASME B1.13M (Metric). Tap row to see full detail.</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
