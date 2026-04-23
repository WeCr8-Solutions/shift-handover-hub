import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";

export interface SlugOption {
  slug: string;
  name: string;
  category?: string | null;
}

interface Props {
  options: SlugOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyHint?: string;
  maxHeightClass?: string;
}

/**
 * Searchable multi-select chip picker over a slug-keyed catalog.
 * Designed for OAP role-program tool/operation pickers — replaces fragile
 * CSV text inputs so org admins can actually pick what they require.
 */
export function SlugMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Search…",
  emptyHint = "No matches.",
  maxHeightClass = "max-h-48",
}: Props) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.slug.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        (o.category ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const toggle = (slug: string) => {
    const next = new Set(selectedSet);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange(Array.from(next));
  };

  const remove = (slug: string) => {
    onChange(selected.filter((s) => s !== slug));
  };

  // For chip display, show name when we know it.
  const labelFor = (slug: string) =>
    options.find((o) => o.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="text-[10px] gap-1 max-w-full"
            >
              <span className="truncate">{labelFor(s)}</span>
              <button
                type="button"
                onClick={() => remove(s)}
                className="hover:text-destructive shrink-0"
                aria-label={`Remove ${labelFor(s)}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8 pl-7 text-xs"
        />
      </div>
      <div className={`border rounded-md p-2 space-y-1 overflow-auto ${maxHeightClass}`}>
        {filtered.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic px-1 py-2">
            {emptyHint}
          </p>
        )}
        {filtered.map((o) => (
          <label
            key={o.slug}
            className="flex items-start gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded p-1"
          >
            <Checkbox
              checked={selectedSet.has(o.slug)}
              onCheckedChange={() => toggle(o.slug)}
              className="mt-0.5"
            />
            <span className="min-w-0 flex-1">
              <span className="font-medium">{o.name}</span>
              {o.category && (
                <span className="text-muted-foreground"> · {o.category}</span>
              )}
              <span className="block text-[10px] text-muted-foreground font-mono truncate">
                {o.slug}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
