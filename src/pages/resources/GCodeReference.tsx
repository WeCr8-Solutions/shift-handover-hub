import { SEOHead } from "@/components/SEOHead";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { AdPlacement } from "@/components/marketing/AdPlacement";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Terminal } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CodeEntry {
  code: string;
  desc: string;
  category: string;
}

const gcodeCommands: CodeEntry[] = [
  // ── Motion ──
  { code: "G00", desc: "Rapid positioning — moves tool at maximum traverse speed to target coordinates (non-cutting move)", category: "Motion" },
  { code: "G01", desc: "Linear interpolation — controlled feed-rate straight-line cutting move", category: "Motion" },
  { code: "G02", desc: "Circular interpolation clockwise (CW arc) — requires I/J/K or R", category: "Motion" },
  { code: "G03", desc: "Circular interpolation counter-clockwise (CCW arc) — requires I/J/K or R", category: "Motion" },
  { code: "G04", desc: "Dwell — pause for a specified time (P = seconds or milliseconds depending on control)", category: "Motion" },
  { code: "G05", desc: "High-speed machining mode (control-specific, e.g. AICC on Fanuc)", category: "Motion" },
  { code: "G05.1", desc: "AI contour control / nano smoothing for high-speed finishing", category: "Motion" },
  { code: "G09", desc: "Exact stop check — decelerates to zero at end of block before next move", category: "Motion" },
  { code: "G10", desc: "Programmable data input — set offsets, parameters, and work coordinates from the program", category: "Motion" },
  { code: "G11", desc: "Cancel programmable data input mode", category: "Motion" },

  // ── Plane Selection ──
  { code: "G17", desc: "XY plane selection — default plane for arcs and canned cycles (milling)", category: "Plane Selection" },
  { code: "G18", desc: "XZ plane selection — used for turning or side-milling arcs", category: "Plane Selection" },
  { code: "G19", desc: "YZ plane selection — used for arcs in the YZ plane", category: "Plane Selection" },

  // ── Units ──
  { code: "G20", desc: "Programming in inches (imperial)", category: "Units" },
  { code: "G21", desc: "Programming in millimeters (metric)", category: "Units" },

  // ── Reference Points ──
  { code: "G27", desc: "Reference point return check — verifies machine is at home", category: "Reference Points" },
  { code: "G28", desc: "Return to machine home position via optional intermediate point", category: "Reference Points" },
  { code: "G29", desc: "Return from reference point — moves from G28 intermediate point to specified position", category: "Reference Points" },
  { code: "G30", desc: "Return to 2nd/3rd/4th reference point (P2, P3, P4)", category: "Reference Points" },
  { code: "G31", desc: "Skip function (touch probe feed) — feeds until signal triggers, records position", category: "Reference Points" },

  // ── Cutter Compensation ──
  { code: "G40", desc: "Cancel cutter radius compensation", category: "Cutter Compensation" },
  { code: "G41", desc: "Cutter compensation left — tool offsets left of programmed path", category: "Cutter Compensation" },
  { code: "G41.1", desc: "Cutter compensation left (D value input directly)", category: "Cutter Compensation" },
  { code: "G42", desc: "Cutter compensation right — tool offsets right of programmed path", category: "Cutter Compensation" },
  { code: "G42.1", desc: "Cutter compensation right (D value input directly)", category: "Cutter Compensation" },
  { code: "G43", desc: "Tool length compensation positive direction (H offset)", category: "Cutter Compensation" },
  { code: "G43.1", desc: "Dynamic tool length compensation", category: "Cutter Compensation" },
  { code: "G44", desc: "Tool length compensation negative direction", category: "Cutter Compensation" },
  { code: "G49", desc: "Cancel tool length compensation", category: "Cutter Compensation" },

  // ── Work Coordinate Systems ──
  { code: "G52", desc: "Local coordinate system setting (temporary shift)", category: "Coordinate Systems" },
  { code: "G53", desc: "Machine coordinate system — moves in absolute machine coordinates (non-modal)", category: "Coordinate Systems" },
  { code: "G54", desc: "Work coordinate system 1 — most commonly used fixture offset", category: "Coordinate Systems" },
  { code: "G55", desc: "Work coordinate system 2", category: "Coordinate Systems" },
  { code: "G56", desc: "Work coordinate system 3", category: "Coordinate Systems" },
  { code: "G57", desc: "Work coordinate system 4", category: "Coordinate Systems" },
  { code: "G58", desc: "Work coordinate system 5", category: "Coordinate Systems" },
  { code: "G59", desc: "Work coordinate system 6", category: "Coordinate Systems" },
  { code: "G54.1", desc: "Additional work coordinate systems P1–P48 (extended offsets)", category: "Coordinate Systems" },

  // ── Canned Cycles ──
  { code: "G73", desc: "High-speed peck drilling cycle — shallow pecks with partial retract for chip breaking", category: "Canned Cycles" },
  { code: "G74", desc: "Left-hand (reverse) tapping cycle — CCW tap with CW retract", category: "Canned Cycles" },
  { code: "G76", desc: "Fine boring cycle — orients spindle, shifts, and retracts to avoid drag mark", category: "Canned Cycles" },
  { code: "G80", desc: "Cancel canned cycle — returns to normal drilling/boring mode", category: "Canned Cycles" },
  { code: "G81", desc: "Standard drilling cycle — drill to depth, rapid retract (no dwell)", category: "Canned Cycles" },
  { code: "G82", desc: "Spot drilling / counterboring cycle — drill to depth with dwell at bottom", category: "Canned Cycles" },
  { code: "G83", desc: "Deep-hole peck drilling cycle — full retract pecks to clear chips", category: "Canned Cycles" },
  { code: "G84", desc: "Right-hand tapping cycle — CW tap with CCW retract (rigid or floating)", category: "Canned Cycles" },
  { code: "G84.2", desc: "Rigid tapping cycle (synchronous spindle/feed)", category: "Canned Cycles" },
  { code: "G85", desc: "Boring cycle — feed in, feed out (smooth finish both ways)", category: "Canned Cycles" },
  { code: "G86", desc: "Boring cycle — feed in, spindle stop, rapid retract", category: "Canned Cycles" },
  { code: "G87", desc: "Back boring cycle — approach from back side of workpiece", category: "Canned Cycles" },
  { code: "G88", desc: "Boring cycle — feed in, dwell, manual retract (spindle on)", category: "Canned Cycles" },
  { code: "G89", desc: "Boring cycle — feed in, dwell, feed out", category: "Canned Cycles" },

  // ── Positioning Mode ──
  { code: "G90", desc: "Absolute positioning mode — all coordinates measured from work zero", category: "Positioning Mode" },
  { code: "G90.1", desc: "Absolute arc center mode (I/J/K are absolute)", category: "Positioning Mode" },
  { code: "G91", desc: "Incremental positioning mode — coordinates relative to current position", category: "Positioning Mode" },
  { code: "G91.1", desc: "Incremental arc center mode (I/J/K are incremental) — default on most controls", category: "Positioning Mode" },
  { code: "G92", desc: "Work coordinate position register (legacy offset shift)", category: "Positioning Mode" },
  { code: "G92.1", desc: "Cancel G92 offset", category: "Positioning Mode" },

  // ── Feed Rate Mode ──
  { code: "G93", desc: "Inverse time feed rate mode — F value = 1/time in minutes", category: "Feed Rate" },
  { code: "G94", desc: "Feed per minute mode (default for milling)", category: "Feed Rate" },
  { code: "G95", desc: "Feed per revolution mode (common in turning)", category: "Feed Rate" },

  // ── Spindle Speed Mode ──
  { code: "G96", desc: "Constant surface speed (CSS) — spindle RPM varies with diameter (turning)", category: "Spindle Control" },
  { code: "G97", desc: "Constant RPM mode — fixed spindle speed (cancel CSS)", category: "Spindle Control" },
  { code: "G98", desc: "Canned cycle return to initial point (R-level)", category: "Spindle Control" },
  { code: "G99", desc: "Canned cycle return to R-point (rapid retract to R level only)", category: "Spindle Control" },

  // ── Turning-Specific G-Codes ──
  { code: "G32", desc: "Thread cutting — single-pass threading (lathe)", category: "Turning" },
  { code: "G33", desc: "Constant-pitch threading (single pass per block)", category: "Turning" },
  { code: "G34", desc: "Variable-pitch (increasing lead) threading", category: "Turning" },
  { code: "G35", desc: "Variable-pitch (decreasing lead) threading", category: "Turning" },
  { code: "G36", desc: "Automatic tool compensation X (turning)", category: "Turning" },
  { code: "G37", desc: "Automatic tool compensation Z (turning)", category: "Turning" },
  { code: "G50", desc: "Set coordinate / max spindle speed clamp (turning)", category: "Turning" },
  { code: "G70", desc: "Finishing cycle — finishes profile defined by G71/G72 rough pass (turning)", category: "Turning" },
  { code: "G71", desc: "Longitudinal (OD/ID) rough turning cycle — removes material in passes along Z", category: "Turning" },
  { code: "G72", desc: "Facing rough turning cycle — removes material in passes along X", category: "Turning" },
  { code: "G75", desc: "OD/ID grooving cycle (turning)", category: "Turning" },
  { code: "G76", desc: "Multi-pass threading cycle — automatic multi-pass thread cutting (turning)", category: "Turning" },
  { code: "G77", desc: "OD/ID threading cycle (canned, turning)", category: "Turning" },
  { code: "G78", desc: "Single-pass threading cycle (turning)", category: "Turning" },

  // ── Special / Advanced ──
  { code: "G12", desc: "Circular pocket milling CW (Haas/Fanuc)", category: "Advanced" },
  { code: "G13", desc: "Circular pocket milling CCW (Haas/Fanuc)", category: "Advanced" },
  { code: "G15", desc: "Cancel polar coordinate command", category: "Advanced" },
  { code: "G16", desc: "Polar coordinate command — program in radius and angle", category: "Advanced" },
  { code: "G46", desc: "Tool position compensation (turning nose radius)", category: "Advanced" },
  { code: "G47", desc: "Engraving cycle (Haas) — cut text characters on workpiece", category: "Advanced" },
  { code: "G50.1", desc: "Cancel mirror image", category: "Advanced" },
  { code: "G51", desc: "Scaling function on — scale programmed path by factor", category: "Advanced" },
  { code: "G51.1", desc: "Mirror image on", category: "Advanced" },
  { code: "G61", desc: "Exact stop mode — decelerates to zero at every block end", category: "Advanced" },
  { code: "G64", desc: "Normal cutting mode / continuous path mode (cancel exact stop)", category: "Advanced" },
  { code: "G65", desc: "Macro call — call a custom macro subprogram with arguments", category: "Advanced" },
  { code: "G66", desc: "Macro modal call — macro repeats every block until cancelled", category: "Advanced" },
  { code: "G67", desc: "Cancel macro modal call", category: "Advanced" },
  { code: "G68", desc: "Coordinate rotation on — rotate coordinate system by angle", category: "Advanced" },
  { code: "G69", desc: "Cancel coordinate rotation", category: "Advanced" },
  { code: "G100", desc: "Disable mirror image (Haas)", category: "Advanced" },
  { code: "G101", desc: "Enable mirror image (Haas)", category: "Advanced" },
  { code: "G103", desc: "Block lookahead limit — limits number of buffered blocks", category: "Advanced" },
  { code: "G107", desc: "Cylindrical mapping — wraps XY onto rotary axis (4th axis engraving)", category: "Advanced" },
  { code: "G112", desc: "XY to XC polar interpolation mode (turning with live tooling)", category: "Advanced" },
  { code: "G113", desc: "Cancel polar interpolation", category: "Advanced" },
  { code: "G114", desc: "Cancel Y-axis mode (mill-turn)", category: "Advanced" },
  { code: "G115", desc: "Enable Y-axis mode (mill-turn)", category: "Advanced" },
  { code: "G154", desc: "Additional work offsets P1–P99 (Haas)", category: "Advanced" },
  { code: "G187", desc: "Surface finish accuracy control (Haas) — rough/medium/finish", category: "Advanced" },
];

const mcodeCommands: CodeEntry[] = [
  // ── Program Control ──
  { code: "M00", desc: "Program stop — halts execution; operator must press Cycle Start to resume", category: "Program Control" },
  { code: "M01", desc: "Optional stop — halts only if Optional Stop switch is active on control panel", category: "Program Control" },
  { code: "M02", desc: "Program end — ends execution without rewind (cursor stays at end)", category: "Program Control" },
  { code: "M30", desc: "Program end and rewind — ends execution and returns to top of program", category: "Program Control" },
  { code: "M47", desc: "Repeat program from first line (some controls)", category: "Program Control" },
  { code: "M97", desc: "Local sub-program call — jump to block N within same program (Haas)", category: "Program Control" },
  { code: "M98", desc: "Sub-program call — calls an external sub-program (Oxxxx)", category: "Program Control" },
  { code: "M99", desc: "Sub-program end / return — returns to calling program or loops main", category: "Program Control" },

  // ── Spindle ──
  { code: "M03", desc: "Spindle on clockwise (CW) at commanded S speed", category: "Spindle" },
  { code: "M04", desc: "Spindle on counter-clockwise (CCW) at commanded S speed", category: "Spindle" },
  { code: "M05", desc: "Spindle stop", category: "Spindle" },
  { code: "M13", desc: "Spindle on CW with coolant on simultaneously", category: "Spindle" },
  { code: "M14", desc: "Spindle on CCW with coolant on simultaneously", category: "Spindle" },
  { code: "M19", desc: "Spindle orientation — rotates spindle to a fixed angular position", category: "Spindle" },
  { code: "M40", desc: "Spindle gear neutral / automatic gear selection", category: "Spindle" },
  { code: "M41", desc: "Spindle low gear range", category: "Spindle" },
  { code: "M42", desc: "Spindle high gear range", category: "Spindle" },

  // ── Tool Change ──
  { code: "M06", desc: "Tool change — executes automatic tool change to tool in T register", category: "Tool Change" },

  // ── Coolant ──
  { code: "M07", desc: "Coolant on — mist coolant", category: "Coolant" },
  { code: "M08", desc: "Coolant on — flood coolant", category: "Coolant" },
  { code: "M09", desc: "Coolant off — stops all coolant", category: "Coolant" },
  { code: "M10", desc: "Coolant on — 4th station / pallet clamp (control-specific)", category: "Coolant" },
  { code: "M11", desc: "Coolant off — 4th station / pallet unclamp (control-specific)", category: "Coolant" },
  { code: "M50", desc: "Coolant high-pressure on (TSC / through-spindle coolant — Haas)", category: "Coolant" },
  { code: "M51", desc: "Coolant high-pressure off", category: "Coolant" },
  { code: "M88", desc: "Through-spindle coolant on (Mazak, some Fanuc)", category: "Coolant" },
  { code: "M89", desc: "Through-spindle coolant off", category: "Coolant" },

  // ── Clamping & Fixtures ──
  { code: "M10", desc: "Clamp axis / pallet clamp (4th axis or fixture)", category: "Clamping" },
  { code: "M11", desc: "Unclamp axis / pallet unclamp", category: "Clamping" },
  { code: "M36", desc: "Pallet shuttle — part A (pallet changer)", category: "Clamping" },
  { code: "M37", desc: "Pallet shuttle — part B (pallet changer)", category: "Clamping" },
  { code: "M60", desc: "Pallet change — automatic pallet shuttle command", category: "Clamping" },
  { code: "M68", desc: "Hydraulic chuck clamp (turning) or fixture clamp", category: "Clamping" },
  { code: "M69", desc: "Hydraulic chuck unclamp (turning) or fixture unclamp", category: "Clamping" },

  // ── Chip Management ──
  { code: "M31", desc: "Chip conveyor on — forward (Haas)", category: "Chip Management" },
  { code: "M32", desc: "Chip conveyor on — reverse (Haas)", category: "Chip Management" },
  { code: "M33", desc: "Chip conveyor off", category: "Chip Management" },
  { code: "M34", desc: "Coolant spigot position increment (Haas)", category: "Chip Management" },
  { code: "M35", desc: "Chip auger on (some controls)", category: "Chip Management" },

  // ── Turning-Specific M-Codes ──
  { code: "M15", desc: "Positive feed direction / rapid traverse positive", category: "Turning" },
  { code: "M16", desc: "Negative feed direction / rapid traverse negative", category: "Turning" },
  { code: "M17", desc: "Sub-spindle on CW / live tooling on (mill-turn)", category: "Turning" },
  { code: "M18", desc: "Sub-spindle on CCW / live tooling off (mill-turn)", category: "Turning" },
  { code: "M20", desc: "Tailstock retract (turning)", category: "Turning" },
  { code: "M21", desc: "Tailstock advance (turning)", category: "Turning" },
  { code: "M23", desc: "Thread chamfer on (turning threading)", category: "Turning" },
  { code: "M24", desc: "Thread chamfer off (turning threading)", category: "Turning" },
  { code: "M25", desc: "Parts catcher advance / door open", category: "Turning" },
  { code: "M26", desc: "Parts catcher retract / door close", category: "Turning" },
  { code: "M38", desc: "Main spindle select (dual-spindle turning)", category: "Turning" },
  { code: "M39", desc: "Sub-spindle select (dual-spindle turning)", category: "Turning" },
  { code: "M41", desc: "Low spindle speed range (turning)", category: "Turning" },
  { code: "M42", desc: "High spindle speed range (turning)", category: "Turning" },
  { code: "M43", desc: "Spindle speed range 3 (medium)", category: "Turning" },
  { code: "M44", desc: "Spindle speed range 4", category: "Turning" },
  { code: "M66", desc: "Bar feeder on / advance bar stock", category: "Turning" },
  { code: "M67", desc: "Bar feeder off / retract", category: "Turning" },

  // ── Automation / Probing ──
  { code: "M29", desc: "Rigid tap mode on (synchronous tapping)", category: "Automation" },
  { code: "M48", desc: "Feed rate / spindle speed override enabled", category: "Automation" },
  { code: "M49", desc: "Feed rate / spindle speed override disabled (locks current rate)", category: "Automation" },
  { code: "M52", desc: "Unclamp axis #2 (rotary table release)", category: "Automation" },
  { code: "M53", desc: "Clamp axis #2 (rotary table lock)", category: "Automation" },
  { code: "M61", desc: "Set current tool number (no physical tool change)", category: "Automation" },
  { code: "M62", desc: "Output signal on (PLC discrete output 1)", category: "Automation" },
  { code: "M63", desc: "Output signal off (PLC discrete output 1)", category: "Automation" },
  { code: "M64", desc: "Output signal on (PLC discrete output 2)", category: "Automation" },
  { code: "M65", desc: "Output signal off (PLC discrete output 2)", category: "Automation" },
  { code: "M75", desc: "Set reference point (tool probe)", category: "Automation" },
  { code: "M76", desc: "Part probe on — enable touch probe signal", category: "Automation" },
  { code: "M77", desc: "Part probe off — disable touch probe signal", category: "Automation" },
  { code: "M78", desc: "Alarm if skip signal not received (probing error)", category: "Automation" },

  // ── Door / Safety ──
  { code: "M80", desc: "Auto door open (Haas)", category: "Safety" },
  { code: "M81", desc: "Auto door close (Haas)", category: "Safety" },
  { code: "M82", desc: "Tool unclamp (ATC carousel)", category: "Safety" },
  { code: "M83", desc: "Auto air blast on (part blow-off)", category: "Safety" },
  { code: "M84", desc: "Auto air blast off", category: "Safety" },
  { code: "M85", desc: "Automatic door open in M30 mode", category: "Safety" },
  { code: "M86", desc: "Automatic door close in M30 mode", category: "Safety" },
];

const gCategories = [...new Set(gcodeCommands.map(c => c.category))];
const mCategories = [...new Set(mcodeCommands.map(c => c.category))];

function CodeTable({ commands, categories, search }: { commands: CodeEntry[]; categories: string[]; search: string }) {
  const filtered = search
    ? commands.filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase()))
    : commands;

  const filteredCategories = categories.filter(cat => filtered.some(c => c.category === cat));

  if (filtered.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No matching codes found.</p>;
  }

  return (
    <>
      {filteredCategories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            {category}
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filtered
                  .filter(c => c.category === category)
                  .map((cmd) => (
                    <div key={cmd.code + cmd.category} className="flex items-start gap-4 px-4 py-3">
                      <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm min-w-[4.5rem] text-center shrink-0">
                        {cmd.code}
                      </code>
                      <p className="text-sm text-muted-foreground">{cmd.desc}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  );
}

export default function GCodeReference() {
  const [search, setSearch] = useState("");

  return (
    <>
      <SEOHead
        title="Complete G-Code & M-Code Reference for CNC Machinists | JobLine.ai"
        description="Comprehensive G-code and M-code command reference for CNC milling and turning. Covers G00–G187 motion codes, M00–M99 machine codes, canned cycles, cutter compensation, coordinate systems, and turning-specific codes."
      />
      <div className="min-h-screen bg-background">
        <MarketingNav />

        <main className="container py-12 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Code className="w-3 h-3 mr-1" />
              Reference
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              G-Code & M-Code Reference
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive G-code and M-code commands for CNC milling and turning.
              Covers ISO 6983 standard commands used by Fanuc, Haas, Mazak, Okuma, and most CNC controls.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {gcodeCommands.length} G-codes · {mcodeCommands.length} M-codes
            </p>
          </div>

          <div className="mb-6">
            <Input
              placeholder="Search codes (e.g. G83, peck drilling, coolant)…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-md mx-auto"
            />
          </div>

          <AdPlacement format="horizontal" className="mb-8" />

          <Tabs defaultValue="gcodes" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="gcodes">G-Codes ({gcodeCommands.length})</TabsTrigger>
              <TabsTrigger value="mcodes">M-Codes ({mcodeCommands.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="gcodes">
              <CodeTable commands={gcodeCommands} categories={gCategories} search={search} />
            </TabsContent>

            <TabsContent value="mcodes">
              <CodeTable commands={mcodeCommands} categories={mCategories} search={search} />
            </TabsContent>
          </Tabs>

          <AdPlacement format="rectangle" className="mt-8" />

          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Need G-Code integrated into your production tracking?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                JobLine.ai connects your CNC programs directly to work orders and station dashboards,
                giving supervisors real-time visibility into which program is running on every machine.
              </p>
              <a href="/features/cnc-operator-tools" className="text-primary font-medium text-sm hover:underline">
                Learn about CNC Operator Tools →
              </a>
            </CardContent>
          </Card>
        </main>

        <MarketingFooter />
      </div>
    </>
  );
}
