import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Ruler, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserOrganization } from "@/hooks/useUserOrganization";

export const MATERIAL_TYPES = [
  "Aluminum",
  "Steel",
  "Stainless Steel",
  "Titanium",
  "Inconel",
  "Copper",
  "Brass",
  "Plastics",
  "Composites",
  "Cast Iron",
  "Tool Steel",
] as const;

export const PART_SHAPES = [
  { value: "prismatic", label: "Prismatic" },
  { value: "cylindrical", label: "Cylindrical" },
  { value: "complex", label: "Complex" },
  { value: "flat", label: "Flat" },
  { value: "tubular", label: "Tubular" },
] as const;

export interface PartSpecsData {
  material_type: string;
  part_length_inches: string;
  part_width_inches: string;
  part_height_inches: string;
  part_weight_lbs: string;
  part_shape: string;
  part_catalog_id: string;
  required_tolerance: string;
  surface_finish: string;
}

export const TOLERANCE_OPTIONS = [
  "±0.0005\"",
  "±0.001\"",
  "±0.002\"",
  "±0.005\"",
  "±0.010\"",
  "±0.015\"",
  "±0.030\"",
  "±0.060\"",
] as const;

export const SURFACE_FINISH_OPTIONS = [
  { value: "8Ra", label: "8 Ra (Mirror / Lapped)" },
  { value: "16Ra", label: "16 Ra (Fine Ground)" },
  { value: "32Ra", label: "32 Ra (Fine Machined)" },
  { value: "63Ra", label: "63 Ra (Standard Machined)" },
  { value: "125Ra", label: "125 Ra (Rough Machined)" },
  { value: "250Ra", label: "250 Ra (As-Cast / Sawed)" },
  { value: "as-machined", label: "As-Machined (No Spec)" },
] as const;

interface PartCatalogEntry {
  id: string;
  part_number: string;
  description: string | null;
  material_type: string | null;
  part_length_inches: number | null;
  part_width_inches: number | null;
  part_height_inches: number | null;
  part_weight_lbs: number | null;
  part_shape: string | null;
  required_tolerance: string | null;
  surface_finish: string | null;
}

interface PartSpecsSectionProps {
  data: PartSpecsData;
  onChange: (data: PartSpecsData) => void;
  defaultOpen?: boolean;
}

export function PartSpecsSection({ data, onChange, defaultOpen = false }: PartSpecsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [catalogEntries, setCatalogEntries] = useState<PartCatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const { organization } = useUserOrganization();

  const hasAnySpec = data.material_type || data.part_length_inches || data.part_width_inches || 
    data.part_height_inches || data.part_weight_lbs || data.part_shape;

  // Fetch part catalog entries
  useEffect(() => {
    if (!showCatalog || !organization?.id) return;
    
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      let query = supabase
        .from("part_catalog")
        .select("*")
        .eq("organization_id", organization.id)
        .order("part_number")
        .limit(50);

      if (catalogSearch.trim()) {
        query = query.or(`part_number.ilike.%${catalogSearch}%,description.ilike.%${catalogSearch}%`);
      }

      const { data: entries } = await query;
      setCatalogEntries(entries || []);
      setCatalogLoading(false);
    };

    fetchCatalog();
  }, [showCatalog, organization?.id, catalogSearch]);

  const handleSelectCatalogEntry = (entry: PartCatalogEntry) => {
    onChange({
      ...data,
      part_catalog_id: entry.id,
      material_type: entry.material_type || "",
      part_length_inches: entry.part_length_inches?.toString() || "",
      part_width_inches: entry.part_width_inches?.toString() || "",
      part_height_inches: entry.part_height_inches?.toString() || "",
      part_weight_lbs: entry.part_weight_lbs?.toString() || "",
      part_shape: entry.part_shape || "",
      required_tolerance: entry.required_tolerance || "",
      surface_finish: entry.surface_finish || "",
    });
    setShowCatalog(false);
  };

  const update = (field: keyof PartSpecsData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" type="button" className="w-full justify-between px-2 py-1.5 h-auto">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Ruler className="w-4 h-4" />
            Part Specifications
            {hasAnySpec && <span className="text-xs text-primary">(filled)</span>}
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 pt-2">
        {/* Part Catalog Lookup */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => setShowCatalog(!showCatalog)}
          >
            <Search className="w-3 h-3" />
            {showCatalog ? "Hide Catalog" : "Auto-fill from Part Catalog"}
          </Button>

          {showCatalog && (
            <div className="border rounded-md p-2 space-y-2 bg-muted/30">
              <Input
                placeholder="Search by part number..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="h-8 text-xs"
              />
              {catalogLoading ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : catalogEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No catalog entries found
                </p>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {catalogEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="w-full text-left p-1.5 rounded text-xs hover:bg-accent transition-colors"
                      onClick={() => handleSelectCatalogEntry(entry)}
                    >
                      <span className="font-mono font-medium">{entry.part_number}</span>
                      {entry.description && (
                        <span className="text-muted-foreground ml-2">{entry.description}</span>
                      )}
                      {entry.material_type && (
                        <span className="text-muted-foreground ml-1">• {entry.material_type}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Material Type & Shape */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Material Type</Label>
            <Select value={data.material_type || "none"} onValueChange={(v) => update("material_type", v === "none" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {MATERIAL_TYPES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Part Shape</Label>
            <Select value={data.part_shape || "none"} onValueChange={(v) => update("part_shape", v === "none" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {PART_SHAPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Length (in)</Label>
            <Input type="number" value={data.part_length_inches} onChange={(e) => update("part_length_inches", e.target.value)} placeholder="L" min="0" step="0.001" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Width (in)</Label>
            <Input type="number" value={data.part_width_inches} onChange={(e) => update("part_width_inches", e.target.value)} placeholder="W" min="0" step="0.001" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Height (in)</Label>
            <Input type="number" value={data.part_height_inches} onChange={(e) => update("part_height_inches", e.target.value)} placeholder="H" min="0" step="0.001" className="h-9" />
          </div>
        </div>

        {/* Weight + Tolerance + Surface Finish */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Weight (lbs)</Label>
            <Input type="number" value={data.part_weight_lbs} onChange={(e) => update("part_weight_lbs", e.target.value)} placeholder="lbs" min="0" step="0.01" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tolerance</Label>
            <Select value={data.required_tolerance || "none"} onValueChange={(v) => update("required_tolerance", v === "none" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {TOLERANCE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Surface Finish</Label>
            <Select value={data.surface_finish || "none"} onValueChange={(v) => update("surface_finish", v === "none" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {SURFACE_FINISH_OPTIONS.map((sf) => (
                  <SelectItem key={sf.value} value={sf.value}>{sf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
