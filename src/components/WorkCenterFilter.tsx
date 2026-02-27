import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WORK_CENTER_CATEGORIES, WorkCenterType } from "@/types/handoff";
import { workCenterIcons, workCenterColors } from "@/lib/workCenterIcons";
import { cn } from "@/lib/utils";
import { Filter, X, Circle } from "lucide-react";

interface WorkCenterFilterProps {
  selectedTypes: WorkCenterType[];
  onFilterChange: (types: WorkCenterType[]) => void;
}

export function WorkCenterFilter({ selectedTypes, onFilterChange }: WorkCenterFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleType = (type: WorkCenterType) => {
    if (selectedTypes.includes(type)) {
      onFilterChange(selectedTypes.filter((t) => t !== type));
    } else {
      onFilterChange([...selectedTypes, type]);
    }
  };

  const selectCategory = (category: keyof typeof WORK_CENTER_CATEGORIES) => {
    const typesInCategory = WORK_CENTER_CATEGORIES[category] as readonly WorkCenterType[];
    const allSelected = typesInCategory.every((t) => selectedTypes.includes(t));
    
    if (allSelected) {
      onFilterChange(selectedTypes.filter((t) => !typesInCategory.includes(t)));
    } else {
      const newTypes = [...new Set([...selectedTypes, ...typesInCategory])];
      onFilterChange(newTypes);
    }
  };

  const clearFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={isExpanded ? "secondary" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filter
          {selectedTypes.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-xs">
              {selectedTypes.length}
            </span>
          )}
        </Button>
        
        {selectedTypes.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="border border-border rounded-lg p-4 bg-card space-y-4">
          {Object.entries(WORK_CENTER_CATEGORIES).map(([category, types]) => {
            const typesArray = types as readonly WorkCenterType[];
            const selectedCount = typesArray.filter((t) => selectedTypes.includes(t)).length;
            
            return (
              <div key={category}>
                <button
                  onClick={() => selectCategory(category as keyof typeof WORK_CENTER_CATEGORIES)}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 hover:text-foreground transition-colors"
                >
                  {category}
                  {selectedCount > 0 && (
                    <span className="ml-2 text-primary">({selectedCount})</span>
                  )}
                </button>
                <div className="flex flex-wrap gap-2">
                  {typesArray.map((type) => {
                    const Icon = workCenterIcons[type] || Circle;
                    const isSelected = selectedTypes.includes(type);
                    
                    return (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border",
                          isSelected
                            ? "bg-primary/20 border-primary/50 text-primary"
                            : "bg-secondary border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                      >
                        <Icon className={cn("w-3.5 h-3.5", isSelected && workCenterColors[type])} />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active filter chips */}
      {selectedTypes.length > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTypes.map((type) => {
            const Icon = workCenterIcons[type] || Circle;
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 text-primary text-xs"
              >
                <Icon className="w-3 h-3" />
                {type}
                <X className="w-3 h-3 ml-0.5" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
