import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import { useHandbookReferences } from "@/hooks/useHandbook";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Compact header search popover that searches the Machinery's Handbook
 * reference library by title/summary. Click a hit to navigate to the entry.
 */
export function HandbookQuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: hits = [], isFetching } = useHandbookReferences(
    query.length >= 2 ? { search: query } : undefined,
  );

  const top = hits.slice(0, 8);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          aria-label="Search the handbook"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Handbook</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="tap drill 1/4-20, SFM, GD&T…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {query.length < 2 && (
            <p className="text-xs text-muted-foreground px-2 py-3">
              Search materials, feeds & speeds, threads, GD&T, fits, inspection,
              and safety references.
            </p>
          )}
          {query.length >= 2 && !isFetching && top.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-3">
              No matches. Try "tap drill", "6061", "position".
            </p>
          )}
          {top.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                navigate(`/handbook/${r.slug}`);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm"
            >
              <div className="font-medium">{r.title}</div>
              {r.summary && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {r.summary}
                </div>
              )}
            </button>
          ))}
          <div className="border-t mt-2 pt-2">
            <button
              type="button"
              onClick={() => {
                navigate("/handbook");
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1 text-xs text-primary hover:underline"
            >
              Browse all handbook references →
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
