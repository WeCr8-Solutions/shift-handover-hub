import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

interface ConversionGroup {
  label: string;
  units: { id: string; name: string; toBase: (v: number) => number; fromBase: (v: number) => number }[];
}

const GROUPS: ConversionGroup[] = [
  {
    label: "Length",
    units: [
      { id: "in", name: "Inches (in)", toBase: (v) => v * 25.4, fromBase: (v) => v / 25.4 },
      { id: "mm", name: "Millimeters (mm)", toBase: (v) => v, fromBase: (v) => v },
      { id: "cm", name: "Centimeters (cm)", toBase: (v) => v * 10, fromBase: (v) => v / 10 },
      { id: "m", name: "Meters (m)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "ft", name: "Feet (ft)", toBase: (v) => v * 304.8, fromBase: (v) => v / 304.8 },
    ],
  },
  {
    label: "Weight",
    units: [
      { id: "lb", name: "Pounds (lb)", toBase: (v) => v * 453.592, fromBase: (v) => v / 453.592 },
      { id: "kg", name: "Kilograms (kg)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "oz", name: "Ounces (oz)", toBase: (v) => v * 28.3495, fromBase: (v) => v / 28.3495 },
      { id: "g", name: "Grams (g)", toBase: (v) => v, fromBase: (v) => v },
    ],
  },
  {
    label: "Pressure",
    units: [
      { id: "psi", name: "PSI", toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
      { id: "bar", name: "Bar", toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { id: "mpa", name: "MPa", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      { id: "kpa", name: "kPa", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  {
    label: "Temperature",
    units: [
      { id: "f", name: "°F", toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      { id: "c", name: "°C", toBase: (v) => v, fromBase: (v) => v },
      { id: "k", name: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    label: "Torque",
    units: [
      { id: "ftlb", name: "ft-lb", toBase: (v) => v * 1.35582, fromBase: (v) => v / 1.35582 },
      { id: "nm", name: "N·m", toBase: (v) => v, fromBase: (v) => v },
      { id: "inlb", name: "in-lb", toBase: (v) => v * 0.112985, fromBase: (v) => v / 0.112985 },
    ],
  },
  {
    label: "Speed",
    units: [
      { id: "sfm", name: "SFM (ft/min)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: "mmin", name: "m/min", toBase: (v) => v, fromBase: (v) => v },
      { id: "fts", name: "ft/s", toBase: (v) => v * 18.288, fromBase: (v) => v / 18.288 },
      { id: "ms", name: "m/s", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    ],
  },
];

export function UnitConverter() {
  const [groupIdx, setGroupIdx] = useState(0);
  const [fromUnit, setFromUnit] = useState(GROUPS[0].units[0].id);
  const [toUnit, setToUnit] = useState(GROUPS[0].units[1].id);
  const [value, setValue] = useState("1");

  const group = GROUPS[groupIdx];
  const from = group.units.find((u) => u.id === fromUnit) || group.units[0];
  const to = group.units.find((u) => u.id === toUnit) || group.units[1];
  const numVal = parseFloat(value) || 0;
  const base = from.toBase(numVal);
  const result = to.fromBase(base);

  const handleGroupChange = (idx: string) => {
    const i = parseInt(idx);
    setGroupIdx(i);
    setFromUnit(GROUPS[i].units[0].id);
    setToUnit(GROUPS[i].units[1]?.id || GROUPS[i].units[0].id);
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setValue(result.toPrecision(8).replace(/\.?0+$/, ""));
  };

  return (
    <div className="space-y-4">
      <Select value={groupIdx.toString()} onValueChange={handleGroupChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {GROUPS.map((g, i) => (
            <SelectItem key={g.label} value={i.toString()} className="text-sm">{g.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">From</Label>
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {group.units.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" className="h-10 text-lg font-mono" />
        </div>

        <button
          onClick={swap}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors mb-1"
          aria-label="Swap units"
        >
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex-1 space-y-1">
          <Label className="text-xs">To</Label>
          <Select value={toUnit} onValueChange={setToUnit}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {group.units.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-10 flex items-center px-3 rounded-md border bg-muted/30 text-lg font-mono">
            {result.toPrecision(8).replace(/\.?0+$/, "")}
          </div>
        </div>
      </div>
    </div>
  );
}
