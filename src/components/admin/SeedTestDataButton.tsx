import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Database, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserOrganization } from "@/hooks/useUserOrganization";

interface SeedResult {
  operators: number;
  workOrders: number;
  routingSteps: number;
}

export function SeedTestDataButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const { toast } = useToast();
  const { organization } = useUserOrganization();

  const seedTestData = async () => {
    if (!organization?.id) {
      toast({
        title: "No Organization",
        description: "You must belong to an organization to seed test data.",
        variant: "destructive",
      });
      return;
    }

    setIsSeeding(true);
    setResult(null);

    try {
      // 1. Get the team for this organization
      const { data: teams, error: teamError } = await supabase
        .from("teams")
        .select("id")
        .eq("organization_id", organization.id)
        .limit(1);

      if (teamError) throw teamError;
      const teamId = teams?.[0]?.id;

      // 2. Get existing stations
      const { data: stations, error: stationError } = await supabase
        .from("stations")
        .select("id, name, station_id")
        .eq("organization_id", organization.id);

      if (stationError) throw stationError;

      if (!stations || stations.length === 0) {
        toast({
          title: "No Stations Found",
          description: "Please create at least one station before seeding test data.",
          variant: "destructive",
        });
        setIsSeeding(false);
        return;
      }

      // 3. Create sample operators (profiles)
      const sampleOperators = [
        { email: "operator1@test.local", display_name: "Alex Martinez" },
        { email: "operator2@test.local", display_name: "Jordan Smith" },
        { email: "operator3@test.local", display_name: "Taylor Johnson" },
      ];

      let operatorsCreated = 0;
      const operatorIds: string[] = [];

      for (const op of sampleOperators) {
        // Check if profile already exists
        const { data: existing } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", op.email)
          .maybeSingle();

        if (existing) {
          operatorIds.push(existing.user_id);
        } else {
          // Create a new profile with a generated UUID
          const newUserId = crypto.randomUUID();
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              user_id: newUserId,
              email: op.email,
              display_name: op.display_name,
            });

          if (!profileError) {
            operatorIds.push(newUserId);
            operatorsCreated++;
          }
        }
      }

      // 4. Create sample work orders across stations
      const workOrderData = [
        // Station 1 - multiple states
        { title: "Engine Block Machining", work_order: "WO-2025-001", part_number: "EB-4500", status: "in_progress", priority: "high", stationIndex: 0 },
        { title: "Cylinder Head Finishing", work_order: "WO-2025-002", part_number: "CH-3200", status: "queued", priority: "normal", stationIndex: 0 },
        { title: "Crankshaft Balancing", work_order: "WO-2025-003", part_number: "CS-1800", status: "pending", priority: "urgent", stationIndex: 0 },
        // Station 2 - multiple states (if exists)
        { title: "Transmission Case Milling", work_order: "WO-2025-004", part_number: "TC-7700", status: "in_progress", priority: "critical", stationIndex: 1 },
        { title: "Gear Housing Assembly", work_order: "WO-2025-005", part_number: "GH-5500", status: "queued", priority: "normal", stationIndex: 1 },
        { title: "Drive Shaft Turning", work_order: "WO-2025-006", part_number: "DS-2200", status: "on_hold", priority: "low", stationIndex: 1 },
        // Spread across both
        { title: "Brake Rotor Surfacing", work_order: "WO-2025-007", part_number: "BR-9900", status: "completed", priority: "normal", stationIndex: 0 },
        { title: "Valve Cover Drilling", work_order: "WO-2025-008", part_number: "VC-1100", status: "pending", priority: "high", stationIndex: 0 },
        { title: "Oil Pan Machining", work_order: "WO-2025-009", part_number: "OP-4400", status: "queued", priority: "normal", stationIndex: 1 },
        { title: "Flywheel Resurfacing", work_order: "WO-2025-010", part_number: "FW-6600", status: "pending", priority: "urgent", stationIndex: 0 },
      ];

      const insertedWorkOrders: { id: string; title: string }[] = [];

      for (const wo of workOrderData) {
        const stationIndex = Math.min(wo.stationIndex, stations.length - 1);
        const station = stations[stationIndex];
        const assignedOperator = operatorIds[wo.stationIndex % operatorIds.length];

        const { data: inserted, error: woError } = await supabase
          .from("queue_items")
          .insert([{
            title: wo.title,
            work_order: wo.work_order,
            part_number: wo.part_number,
            status: wo.status as "pending" | "queued" | "in_progress" | "on_hold" | "completed" | "cancelled",
            priority: wo.priority as "low" | "normal" | "high" | "urgent" | "critical",
            item_type: "work_order" as const,
            station_id: station.id,
            team_id: teamId,
            organization_id: organization.id,
            assigned_to: assignedOperator || null,
            quantity: Math.floor(Math.random() * 50) + 10,
            estimated_duration: Math.floor(Math.random() * 240) + 60,
            due_date: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            operation_number: `OP${(wo.stationIndex + 1) * 10}`,
          }])
          .select("id, title")
          .single();

        if (!woError && inserted) {
          insertedWorkOrders.push(inserted);
        }
      }

      // 5. Create routing steps for each work order
      let routingStepsCreated = 0;
      const routingOperations = [
        { operation_name: "Setup & Fixturing", operation_type: "internal" },
        { operation_name: "Rough Machining", operation_type: "internal" },
        { operation_name: "Heat Treatment", operation_type: "outside_processing" },
        { operation_name: "Finish Machining", operation_type: "internal" },
        { operation_name: "Inspection", operation_type: "internal" },
      ];

      for (const wo of insertedWorkOrders) {
        for (let i = 0; i < routingOperations.length; i++) {
          const op = routingOperations[i];
          const stationForStep = stations[i % stations.length];
          
          // Determine status based on work order status
          let stepStatus = "pending";
          if (i === 0) stepStatus = "in_progress";
          if (i < 2 && Math.random() > 0.5) stepStatus = "completed";

          const { error: routingError } = await supabase
            .from("work_order_routing")
            .insert({
              queue_item_id: wo.id,
              step_number: i + 1,
              operation_name: op.operation_name,
              operation_type: op.operation_type,
              station_id: stationForStep.id,
              status: stepStatus,
              estimated_duration: Math.floor(Math.random() * 120) + 30,
              notes: `${op.operation_name} for ${wo.title}`,
              outside_vendor: op.operation_type === "outside_processing" ? "ABC Heat Treating Inc." : null,
              po_number: op.operation_type === "outside_processing" ? `PO-${Math.floor(Math.random() * 10000)}` : null,
              expected_return_date: op.operation_type === "outside_processing" 
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                : null,
            });

          if (!routingError) {
            routingStepsCreated++;
          }
        }
      }

      const seedResult: SeedResult = {
        operators: operatorsCreated,
        workOrders: insertedWorkOrders.length,
        routingSteps: routingStepsCreated,
      };

      setResult(seedResult);
      toast({
        title: "Test Data Seeded Successfully",
        description: `Created ${seedResult.workOrders} work orders with ${seedResult.routingSteps} routing steps.`,
      });

    } catch (error: any) {
      console.error("Error seeding test data:", error);
      toast({
        title: "Seeding Failed",
        description: error.message || "Failed to seed test data. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="w-4 h-4" />
          Seed Test Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Seed Test Data</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {result ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Data seeded successfully!</span>
                </div>
                <ul className="text-sm space-y-1 ml-7">
                  <li>• {result.operators} new operator profiles created</li>
                  <li>• {result.workOrders} work orders created</li>
                  <li>• {result.routingSteps} routing steps created</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Visit the Queue page to see work orders at each station with different statuses.
                </p>
              </div>
            ) : (
              <>
                <p>This will create sample data for testing:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• 3 sample operator profiles</li>
                  <li>• 10 work orders with various statuses (in_progress, queued, pending, on_hold, completed)</li>
                  <li>• 5 routing steps per work order</li>
                  <li>• Assigned to your existing stations</li>
                </ul>
                <p className="text-amber-600 mt-2">
                  Note: This adds data to your current organization. Existing data will not be affected.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {!result && (
            <AlertDialogAction onClick={seedTestData} disabled={isSeeding}>
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                "Seed Data"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
