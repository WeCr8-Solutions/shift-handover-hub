import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchDevDocs } from "@/lib/devDocs";
import { cn } from "@/lib/utils";

interface DevSearchProps {
  className?: string;
  large?: boolean;
}

export function DevSearch({ className, large }: DevSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const results = query.length >= 2 ? searchDevDocs(query) : [];

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", large ? "h-5 w-5" : "h-4 w-4")} />
        <Input
          placeholder="Search developer docs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className={cn("pl-10", large && "h-12 text-base")}
        />
      </div>
      {focused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.slice(0, 8).map((doc) => (
            <button
              key={`${doc.category}-${doc.slug}`}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
              onMouseDown={() => navigate(`/dev/${doc.category}/${doc.slug}`)}
            >
              <p className="text-sm font-medium text-foreground">{doc.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{doc.categoryLabel} · {doc.description}</p>
            </button>
          ))}
        </div>
      )}
      {focused && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          No docs found for "{query}"
        </div>
      )}
    </div>
  );
}
