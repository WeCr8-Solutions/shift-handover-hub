import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCustomers, type Customer } from "@/hooks/useCustomers";
import { woToast } from "@/lib/woToast";

interface Props {
  value: string | null;
  onChange: (customer: Customer | null) => void;
}

export function CustomerCombobox({ value, onChange }: Props) {
  const { customers, loading, createCustomer } = useCustomers();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = useMemo(() => customers.find((c) => c.id === value) ?? null, [customers, value]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, search]);

  const exactMatch = useMemo(
    () => customers.some((c) => c.name.trim().toLowerCase() === search.trim().toLowerCase()),
    [customers, search],
  );

  const handleCreate = async () => {
    const name = search.trim();
    if (!name) return;
    setCreating(true);
    const res = await createCustomer({ name });
    setCreating(false);
    if (res.error) {
      woToast.error("Could not add customer", res.error);
      return;
    }
    if (res.data) {
      onChange(res.data);
      setOpen(false);
      setSearch("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <Users className="w-4 h-4 text-muted-foreground" />
            {selected ? selected.name : <span className="text-muted-foreground">Select or add customer…</span>}
          </span>
          <ChevronsUpDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
        <Input
          autoFocus
          placeholder="Search or type new customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm mb-2"
        />
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <>
              {selected && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded text-muted-foreground hover:bg-accent"
                >
                  Clear selection
                </button>
              )}
              {filtered.length === 0 && !search.trim() && (
                <p className="text-xs text-muted-foreground text-center py-2">No customers yet</p>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent flex items-center gap-2",
                    selected?.id === c.id && "bg-accent",
                  )}
                >
                  <Check
                    className={cn("w-3.5 h-3.5", selected?.id === c.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
        {search.trim() && !exactMatch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full mt-2 justify-start gap-2"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add "{search.trim()}"
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
