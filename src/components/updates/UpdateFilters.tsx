import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const categories = [
  { value: "all", label: "All" },
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "bug_fix", label: "Bug Fix" },
  { value: "system_notice", label: "System Notice" },
  { value: "security", label: "Security" },
  { value: "maintenance", label: "Maintenance" },
];

interface UpdateFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
}

export function UpdateFilters({ search, onSearchChange, category, onCategoryChange }: UpdateFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or version..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((c) => (
          <Badge
            key={c.value}
            variant={category === c.value ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => onCategoryChange(c.value)}
          >
            {c.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
