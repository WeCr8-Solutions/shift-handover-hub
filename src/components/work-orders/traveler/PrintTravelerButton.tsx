/**
 * PrintTravelerButton — opens the dedicated traveler print route in a new tab
 * with an optional color override. Reads the default color from the org's
 * Traveler Template (mapped from WO priority).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import { useTravelerSettings, type PriorityColor } from "@/hooks/useTravelerSettings";

interface Props {
  workOrderId: string;
  priority: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
}

const COLOR_OPTIONS: { value: PriorityColor; label: string; swatch: string }[] = [
  { value: "red",    label: "Red",    swatch: "#c0392b" },
  { value: "orange", label: "Orange", swatch: "#d97706" },
  { value: "yellow", label: "Yellow", swatch: "#ca8a04" },
  { value: "green",  label: "Green",  swatch: "#16a34a" },
  { value: "blue",   label: "Blue",   swatch: "#1d4ed8" },
  { value: "pink",   label: "Pink",   swatch: "#db2777" },
  { value: "white",  label: "White",  swatch: "#f3f4f6" },
];

export function PrintTravelerButton({ workOrderId, priority, variant = "outline", size = "sm" }: Props) {
  const { settings } = useTravelerSettings();
  const [open, setOpen] = useState(false);
  const defaultColor = (settings.priority_color_map[priority] as PriorityColor) ?? "white";

  const launch = (color: PriorityColor) => {
    setOpen(false);
    const url = `/work-orders/${workOrderId}/traveler?color=${color}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className="gap-2" data-testid="wo-print-traveler">
          <Printer className="h-4 w-4" /> Print Traveler
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Paper color</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Defaults to <span className="font-semibold">{defaultColor}</span> from your priority map.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => launch(c.value)}
                className="flex items-center gap-2 rounded-md border p-2 text-left text-sm hover:bg-muted"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 rounded border"
                  style={{ background: c.swatch }}
                />
                {c.label}
                {c.value === defaultColor && (
                  <span className="ml-auto text-[10px] uppercase text-muted-foreground">default</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
