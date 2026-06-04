import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FloorMapView } from "@/components/dashboard/FloorMapView";
import { Helmet } from "react-helmet-async";

export default function FloorMap() {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Helmet>
        <title>Floor Map · JobLine</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Map className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Floor Map</h1>
            <p className="text-xs text-muted-foreground">
              Live status of every active station, grouped by work-center type.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stations</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <FloorMapView
              onViewStation={(id) => navigate(`/dashboard?station=${id}`)}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
