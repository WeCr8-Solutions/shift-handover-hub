import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DimensionRequirement {
  id: string;
  routing_step_id: string;
  dimension_name: string;
  nominal_value: number;
  upper_tolerance: number;
  lower_tolerance: number;
  unit: string;
  is_critical: boolean;
  sort_order: number;
  notes: string | null;
}

export interface DimensionReading {
  id: string;
  dimension_id: string;
  routing_step_id: string;
  queue_item_id: string;
  measured_value: number;
  is_pass: boolean;
  instrument_used: string | null;
  recorded_by: string | null;
  recorded_by_name: string | null;
  recorded_at: string;
  notes: string | null;
}

export function useDimensions(routingStepId?: string, queueItemId?: string) {
  const { user, profile } = useAuth();
  const [requirements, setRequirements] = useState<DimensionRequirement[]>([]);
  const [readings, setReadings] = useState<DimensionReading[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequirements = useCallback(async (stepId?: string) => {
    const targetId = stepId || routingStepId;
    if (!targetId) return;
    const { data } = await supabase
      .from("routing_step_dimensions")
      .select("*")
      .eq("routing_step_id", targetId)
      .order("sort_order", { ascending: true });
    setRequirements((data as DimensionRequirement[]) || []);
  }, [routingStepId]);

  const fetchReadings = useCallback(async (stepId?: string, itemId?: string) => {
    const targetStepId = stepId || routingStepId;
    const targetItemId = itemId || queueItemId;
    if (!targetStepId || !targetItemId) return;
    const { data } = await supabase
      .from("dimension_readings")
      .select("*")
      .eq("routing_step_id", targetStepId)
      .eq("queue_item_id", targetItemId)
      .order("recorded_at", { ascending: true });
    setReadings((data as DimensionReading[]) || []);
  }, [routingStepId, queueItemId]);

  const loadAll = useCallback(async (stepId?: string, itemId?: string) => {
    setLoading(true);
    await Promise.all([fetchRequirements(stepId), fetchReadings(stepId, itemId)]);
    setLoading(false);
  }, [fetchRequirements, fetchReadings]);

  const addRequirement = async (stepId: string, req: {
    dimension_name: string;
    nominal_value: number;
    upper_tolerance: number;
    lower_tolerance: number;
    unit?: string;
    is_critical?: boolean;
    notes?: string;
  }) => {
    const maxOrder = requirements.length > 0 ? Math.max(...requirements.map(r => r.sort_order)) + 1 : 0;
    const { error } = await supabase.from("routing_step_dimensions").insert({
      routing_step_id: stepId,
      dimension_name: req.dimension_name,
      nominal_value: req.nominal_value,
      upper_tolerance: req.upper_tolerance,
      lower_tolerance: req.lower_tolerance,
      unit: req.unit || "in",
      is_critical: req.is_critical || false,
      notes: req.notes || null,
      sort_order: maxOrder,
      created_by: user?.id,
    });
    if (!error) {
      // Also flag the step as dimensions_required
      await supabase.from("work_order_routing").update({ dimensions_required: true }).eq("id", stepId);
      await fetchRequirements(stepId);
    }
    return { error: error?.message || null };
  };

  const deleteRequirement = async (dimId: string, stepId: string) => {
    const { error } = await supabase.from("routing_step_dimensions").delete().eq("id", dimId);
    if (!error) {
      await fetchRequirements(stepId);
      // If no more requirements, unflag step
      const remaining = requirements.filter(r => r.id !== dimId);
      if (remaining.length === 0) {
        await supabase.from("work_order_routing").update({ dimensions_required: false }).eq("id", stepId);
      }
    }
    return { error: error?.message || null };
  };

  const recordReading = async (reading: {
    dimension_id: string;
    routing_step_id: string;
    queue_item_id: string;
    measured_value: number;
    instrument_used?: string;
    notes?: string;
  }) => {
    const { error } = await supabase.from("dimension_readings").insert({
      ...reading,
      recorded_by: user?.id,
      recorded_by_name: profile?.display_name || null,
    });
    if (!error) {
      await fetchReadings(reading.routing_step_id, reading.queue_item_id);
    }
    return { error: error?.message || null };
  };

  // Check if all required dimensions have passing readings
  const allDimensionsPassing = useCallback((): boolean => {
    if (requirements.length === 0) return true;
    return requirements.every(req => {
      const reading = readings.find(r => r.dimension_id === req.id);
      return reading && reading.is_pass;
    });
  }, [requirements, readings]);

  const hasPendingDimensions = useCallback((): boolean => {
    if (requirements.length === 0) return false;
    return requirements.some(req => !readings.find(r => r.dimension_id === req.id));
  }, [requirements, readings]);

  return {
    requirements,
    readings,
    loading,
    loadAll,
    fetchRequirements,
    fetchReadings,
    addRequirement,
    deleteRequirement,
    recordReading,
    allDimensionsPassing,
    hasPendingDimensions,
  };
}
