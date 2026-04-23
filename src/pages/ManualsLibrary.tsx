import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, Upload, Search } from "lucide-react";
import { useMachineManuals } from "@/hooks/useMachineManuals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MANUFACTURERS = ["", "Haas", "Fanuc", "Mazak", "Siemens", "Okuma", "Heidenhain", "DMG Mori", "Doosan"];
const TYPES = ["", "operator", "maintenance", "programming", "parameters", "alarms"];

export default function ManualsLibrary() {
  const [manufacturer, setManufacturer] = useState("");
  const [manualType, setManualType] = useState("");
  const [search, setSearch] = useState("");
  const { data: manuals = [], isLoading } = useMachineManuals({
    manufacturer: manufacturer || undefined,
    manualType: manualType || undefined,
    search: search || undefined,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Machine & Control Manuals — JobLine</title>
        <meta name="description" content="Searchable library of machine tool and control manuals (Haas, Fanuc, Mazak, Siemens, Okuma)." />
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7" />
            Machine & Control Manuals
          </h1>
          <p className="text-muted-foreground mt-1">
            OEM operator, maintenance, and programming references for your shop.
          </p>
        </div>
        <Button asChild>
          <Link to="/manuals/upload">
            <Upload className="h-4 w-4 mr-2" /> Upload Manual
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, model, controller…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          className="border border-input bg-background rounded-md h-10 px-3"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
        >
          {MANUFACTURERS.map((m) => (
            <option key={m} value={m}>{m || "All manufacturers"}</option>
          ))}
        </select>
        <select
          className="border border-input bg-background rounded-md h-10 px-3"
          value={manualType}
          onChange={(e) => setManualType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t ? t[0].toUpperCase() + t.slice(1) : "All types"}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading manuals…</p>}
      {!isLoading && manuals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No manuals yet</p>
            <p className="text-muted-foreground mt-2">
              Upload OEM-published PDFs (Haas, Fanuc, Mazak, etc.) to build your shop's reference library.
            </p>
            <Button asChild className="mt-4">
              <Link to="/manuals/upload">Upload first manual</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {manuals.map((m) => (
          <Link key={m.id} to={`/manuals/${m.slug}`}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <Badge variant="outline">{m.manufacturer}</Badge>
                  <Badge variant="secondary">{m.manual_type}</Badge>
                  {m.is_canonical && <Badge>Platform</Badge>}
                </div>
                <CardTitle className="text-base line-clamp-2">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  {m.machine_model && <p>Model: {m.machine_model}</p>}
                  {m.controller_family && <p>Controller: {m.controller_family}</p>}
                  {m.edition && <p>Edition: {m.edition}</p>}
                  {m.page_count && <p>{m.page_count} pages</p>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
