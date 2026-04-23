import { useState } from "react";
import { useProgramReleaseLog, type ReleaseProgram } from "@/hooks/useProgramReleaseLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export function ReleaseLogPanel() {
  const [program, setProgram] = useState<ReleaseProgram | "ALL">("ALL");
  const [year, setYear] = useState<string>("");

  const { data: rows = [], isLoading } = useProgramReleaseLog({
    program: program === "ALL" ? undefined : program,
    year: year ? Number(year) : undefined,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" /> Content Release Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={program} onValueChange={(v) => setProgram(v as any)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All programs</SelectItem>
                <SelectItem value="GCA">GCA</SelectItem>
                <SelectItem value="OAP">OAP</SelectItem>
                <SelectItem value="CERT">Certificates</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-8 w-24 text-xs"
              min={2020}
              max={CURRENT_YEAR + 5}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Every "Save &amp; Publish" event is logged here so admins can audit content changes by program and year.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          {isLoading && <div className="p-3 text-xs text-muted-foreground">Loading...</div>}
          {!isLoading && rows.length === 0 && (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No release events match the current filter.
            </div>
          )}
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="px-3 py-2 hover:bg-muted/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">{r.program}</Badge>
                  <Badge variant="outline" className="text-[10px]">{r.entity_type}</Badge>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {r.content_year}
                  </Badge>
                  {r.organization_id === null && (
                    <Badge variant="outline" className="text-[10px]">canonical</Badge>
                  )}
                  <span className="text-xs font-medium ml-1">{r.entity_label || r.entity_id.slice(0, 8)}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(r.released_at).toLocaleString()}
                  </span>
                </div>
                {r.release_notes && (
                  <p className="text-xs text-muted-foreground mt-1 pl-1">{r.release_notes}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
