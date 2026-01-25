import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { StationCard } from "@/components/StationCard";
import { HandoffCard } from "@/components/HandoffCard";
import { ShiftStats } from "@/components/ShiftStats";
import { NewHandoffForm } from "@/components/NewHandoffForm";
import { WorkCenterFilter } from "@/components/WorkCenterFilter";
import { mockStations, mockHandoffRecords } from "@/lib/mockData";
import { WorkCenterType } from "@/types/handoff";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [showNewHandoff, setShowNewHandoff] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<WorkCenterType[]>([]);

  const filteredStations = useMemo(() => {
    if (selectedTypes.length === 0) return mockStations;
    return mockStations.filter((s) => selectedTypes.includes(s.workCenterType));
  }, [selectedTypes]);

  const filteredHandoffs = useMemo(() => {
    if (selectedTypes.length === 0) return mockHandoffRecords;
    return mockHandoffRecords.filter((r) => selectedTypes.includes(r.workCenterType));
  }, [selectedTypes]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Stats Overview */}
        <div className="mb-6">
          <ShiftStats />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="stations" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="stations" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Stations
              </TabsTrigger>
              <TabsTrigger value="handoffs" className="gap-2">
                <History className="w-4 h-4" />
                Handoffs
              </TabsTrigger>
            </TabsList>

            <Button onClick={() => setShowNewHandoff(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Handoff
            </Button>
          </div>

          {/* Filter */}
          <WorkCenterFilter 
            selectedTypes={selectedTypes} 
            onFilterChange={setSelectedTypes} 
          />

          <TabsContent value="stations" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStations.map((station) => (
                <StationCard key={station.stationId} station={station} />
              ))}
            </div>
            {filteredStations.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No stations match the selected filters.
              </div>
            )}
          </TabsContent>

          <TabsContent value="handoffs" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent Handoff Records
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredHandoffs.map((record) => (
                  <HandoffCard key={record.recordId} record={record} />
                ))}
              </div>
              {filteredHandoffs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No handoff records match the selected filters.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* New Handoff Modal */}
      {showNewHandoff && <NewHandoffForm onClose={() => setShowNewHandoff(false)} />}
    </div>
  );
};

export default Index;
