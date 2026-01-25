import { useState } from "react";
import { Header } from "@/components/Header";
import { MachineCard } from "@/components/MachineCard";
import { HandoffCard } from "@/components/HandoffCard";
import { ShiftStats } from "@/components/ShiftStats";
import { NewHandoffForm } from "@/components/NewHandoffForm";
import { mockMachines, mockHandoffRecords } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, History, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [showNewHandoff, setShowNewHandoff] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        {/* Stats Overview */}
        <div className="mb-6">
          <ShiftStats />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="machines" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-secondary">
              <TabsTrigger value="machines" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Machines
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

          <TabsContent value="machines" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockMachines.map((machine) => (
                <MachineCard key={machine.machineId} machine={machine} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="handoffs" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent Handoff Records
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mockHandoffRecords.map((record) => (
                  <HandoffCard key={record.recordId} record={record} />
                ))}
              </div>
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
