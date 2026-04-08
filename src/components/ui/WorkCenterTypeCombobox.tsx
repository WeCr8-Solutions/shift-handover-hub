import { useState, useRef, useEffect } from "react";
import { ALL_WORK_CENTER_TYPES } from "@/types/handoff";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkCenterTypeComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Optional list to filter out already-used types */
  excludeTypes?: string[];
}

export function WorkCenterTypeCombobox({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select or type station type...",
  excludeTypes = [],
}: WorkCenterTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const allTypes = ALL_WORK_CENTER_TYPES.filter(
    (t) => !excludeTypes.includes(t)
  );

  const filtered = search.trim()
    ? allTypes.filter((t) =>
        t.toLowerCase().includes(search.toLowerCase())
      )
    : allTypes;

  const exactMatch = allTypes.some(
    (t) => t.toLowerCase() === search.trim().toLowerCase()
  );
  const showCustomOption = search.trim().length > 0 && !exactMatch;

  const handleSelect = (val: string) => {
    onValueChange(val);
    setSearch("");
    setOpen(false);
  };

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            placeholder="Search or type custom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                e.preventDefault();
                const match = allTypes.find(
                  (t) => t.toLowerCase() === search.trim().toLowerCase()
                );
                handleSelect(match || search.trim());
              }
            }}
            className="h-8"
          />
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-1">
            {showCustomOption && (
              <button
                className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelect(search.trim())}
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>
                  Use custom: <strong>"{search.trim()}"</strong>
                </span>
              </button>
            )}
            {filtered.length === 0 && !showCustomOption && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No matching types found.
              </p>
            )}
            {filtered.map((type) => (
              <button
                key={type}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === type && "bg-accent"
                )}
                onClick={() => handleSelect(type)}
              >
                <Check
                  className={cn(
                    "mr-2 h-3.5 w-3.5",
                    value === type ? "opacity-100" : "opacity-0"
                  )}
                />
                {type}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
