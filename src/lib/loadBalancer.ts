/**
 * Machine-Context-Aware Load Balancer
 *
 * Scores and ranks stations for a given work order/part based on:
 *   1. Current workload (queue depth, estimated hours remaining)
 *   2. Machine capability fit (envelope, materials, axes, tolerances)
 *   3. Part specification compatibility (dimensions, weight, material)
 *   4. Downtime / availability
 *   5. Operator availability & certifications
 *
 * Used by:
 *   - AI Planning Assistant (server-side, injected into system prompt)
 *   - Client-side useLoadBalancer hook (routing suggestions in UI)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PartRequirements {
  material_type?: string | null;
  part_length_inches?: number | null;
  part_width_inches?: number | null;
  part_height_inches?: number | null;
  part_weight_lbs?: number | null;
  part_shape?: string | null;
  required_tolerance?: string | null;
  surface_finish?: string | null;
  five_axis_required?: boolean;
  live_tooling_required?: boolean;
  bar_feed_required?: boolean;
}

export interface MachineProfile {
  station_id: string;
  source: "verified_library" | "manual_entry";
  manufacturer?: string | null;
  model?: string | null;
  machine_type?: string | null;
  platform_category?: string | null;
  max_x_travel?: number | null;
  max_y_travel?: number | null;
  max_z_travel?: number | null;
  max_part_weight?: number | null;
  max_part_envelope_length?: number | null;
  max_part_envelope_width?: number | null;
  max_part_envelope_height?: number | null;
  five_axis_simultaneous?: boolean;
  fourth_axis?: boolean;
  live_tooling?: boolean;
  y_axis_turn?: boolean;
  sub_spindle?: boolean;
  probing?: boolean;
  through_spindle_coolant?: boolean;
  pallet_pool?: boolean;
  bar_feeder?: boolean;
  material_capability?: string[];
  typical_tolerance?: number | null;
  hard_constraints?: any[];
}

export interface StationInfo {
  id: string;
  station_id: string;
  name: string;
  work_center_type: string;
  work_center: string;
  is_active: boolean;
  /** Optional override of the 8h default daily capacity (hours). */
  daily_capacity_hours?: number | null;
}

export interface StationLoad {
  queued_items: number;
  est_total_minutes: number;
  in_progress_count: number;
}

export interface StationAvailability {
  has_active_downtime: boolean;
  downtime_reason?: string | null;
  checked_in_operators: number;
}

export interface StationScore {
  station_id: string;
  station_name: string;
  station_code: string;
  work_center_type: string;
  total_score: number;
  /** 0-100, higher = less loaded */
  workload_score: number;
  /** 0-100, higher = better fit */
  capability_score: number;
  /** 0-100, higher = better availability */
  availability_score: number;
  /** Hard blockers that prevent routing here */
  blockers: string[];
  /** Soft warnings / trade-offs */
  warnings: string[];
  /** Positive capability matches */
  advantages: string[];
  machine_profile?: MachineProfile | null;
  current_load?: StationLoad;
}

export interface LoadBalancerInput {
  stations: StationInfo[];
  machineProfiles: MachineProfile[];
  stationLoads: Record<string, StationLoad>;
  stationAvailability: Record<string, StationAvailability>;
  partRequirements?: PartRequirements | null;
  /** Filter to only specific work center types (e.g. "CNC Mill") */
  workCenterTypeFilter?: string | null;
}

export interface LoadBalancerResult {
  recommendations: StationScore[];
  summary: string;
  best_station_id: string | null;
}

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  workload: 0.35,
  capability: 0.45,
  availability: 0.20,
} as const;

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function scoreWorkload(
  load: StationLoad | undefined,
  dailyCapacityHours: number = 8,
): { score: number; warnings: string[] } {
  if (!load) return { score: 95, warnings: [] }; // No load = great

  const warnings: string[] = [];
  const hours = load.est_total_minutes / 60;
  const capacity = Math.max(0.5, dailyCapacityHours);

  // Score decreases as the queue approaches/exceeds the station's daily capacity.
  // ratio 0 = 100, ratio 1 = 60, ratio 2 = 30, ratio 3+ = 10.
  const ratio = hours / capacity;
  let score = Math.max(10, 100 - ratio * 40);

  if (load.queued_items > 5) {
    warnings.push(`${load.queued_items} items already queued`);
    score = Math.max(10, score - 5);
  }

  if (ratio > 2) {
    warnings.push(`${Math.round(hours)}h backlog vs ${capacity}h/day capacity`);
  } else if (ratio > 1) {
    warnings.push(`${Math.round(hours)}h backlog (over one day at ${capacity}h/day)`);
  }

  return { score: Math.round(score), warnings };
}

function scoreCapability(
  profile: MachineProfile | undefined,
  part: PartRequirements | null | undefined,
): { score: number; blockers: string[]; warnings: string[]; advantages: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const advantages: string[] = [];

  // No profile = no capability data, neutral score
  if (!profile) {
    return { score: 50, blockers: [], warnings: ["No machine profile — capability unknown"], advantages: [] };
  }

  // No part requirements = everything passes
  if (!part) {
    advantages.push(`${profile.manufacturer || ""} ${profile.model || ""} profile available`.trim());
    return { score: 75, blockers, warnings, advantages };
  }

  let score = 80; // Start optimistic

  // --- Envelope checks (hard blockers) ---
  if (part.part_length_inches != null && profile.max_part_envelope_length != null) {
    if (part.part_length_inches > profile.max_part_envelope_length) {
      blockers.push(
        `Part length ${part.part_length_inches}" exceeds max envelope ${profile.max_part_envelope_length}"`,
      );
    } else {
      const margin = ((profile.max_part_envelope_length - part.part_length_inches) / profile.max_part_envelope_length) * 100;
      if (margin < 10) warnings.push("Part length is within 10% of envelope limit");
      else advantages.push("Part fits within length envelope");
    }
  }

  if (part.part_width_inches != null && profile.max_part_envelope_width != null) {
    if (part.part_width_inches > profile.max_part_envelope_width) {
      blockers.push(
        `Part width ${part.part_width_inches}" exceeds max envelope ${profile.max_part_envelope_width}"`,
      );
    }
  }

  if (part.part_height_inches != null && profile.max_part_envelope_height != null) {
    if (part.part_height_inches > profile.max_part_envelope_height) {
      blockers.push(
        `Part height ${part.part_height_inches}" exceeds max envelope ${profile.max_part_envelope_height}"`,
      );
    }
  }

  if (part.part_weight_lbs != null && profile.max_part_weight != null) {
    if (part.part_weight_lbs > profile.max_part_weight) {
      blockers.push(
        `Part weight ${part.part_weight_lbs} lbs exceeds max ${profile.max_part_weight} lbs`,
      );
    } else {
      advantages.push("Weight within machine capacity");
    }
  }

  // --- Material check ---
  if (part.material_type && profile.material_capability && profile.material_capability.length > 0) {
    const normalizedMat = part.material_type.toLowerCase();
    const canCut = profile.material_capability.some(
      (m) => normalizedMat.includes(m.toLowerCase()) || m.toLowerCase().includes(normalizedMat),
    );
    if (!canCut) {
      warnings.push(`Material "${part.material_type}" not in machine's listed capabilities`);
      score -= 15;
    } else {
      advantages.push(`Material "${part.material_type}" supported`);
      score += 5;
    }
  }

  // --- Capability checks ---
  if (part.five_axis_required && !profile.five_axis_simultaneous) {
    blockers.push("5-axis simultaneous required but not available");
  } else if (profile.five_axis_simultaneous) {
    advantages.push("5-axis simultaneous capable");
  }

  if (part.live_tooling_required && !profile.live_tooling) {
    blockers.push("Live tooling required but not available");
  } else if (profile.live_tooling) {
    advantages.push("Live tooling available");
  }

  if (part.bar_feed_required && !profile.bar_feeder) {
    blockers.push("Bar feeder required but not available");
  } else if (profile.bar_feeder) {
    advantages.push("Bar feeder available");
  }

  // --- Tolerance check ---
  if (part.required_tolerance && profile.typical_tolerance != null) {
    const reqTol = parseToleranceToInches(part.required_tolerance);
    if (reqTol != null && reqTol < profile.typical_tolerance) {
      warnings.push(
        `Required tolerance ${part.required_tolerance} tighter than machine typical ${profile.typical_tolerance}"`,
      );
      score -= 10;
    } else if (reqTol != null) {
      advantages.push("Tolerance within machine capability");
      score += 5;
    }
  }

  // Probing / TSC bonuses
  if (profile.probing) advantages.push("Probing available");
  if (profile.through_spindle_coolant) advantages.push("TSC available");
  if (profile.pallet_pool) advantages.push("Pallet pool — reduced setup time");

  // If any hard blockers, score = 0
  if (blockers.length > 0) score = 0;

  return { score: Math.min(100, Math.max(0, score)), blockers, warnings, advantages };
}

function scoreAvailability(avail: StationAvailability | undefined): { score: number; blockers: string[]; warnings: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!avail) return { score: 70, blockers, warnings };

  let score = 80;

  if (avail.has_active_downtime) {
    blockers.push(`Machine down: ${avail.downtime_reason || "unknown reason"}`);
    score = 0;
  }

  if (avail.checked_in_operators > 0) {
    score += 15; // Operator ready
  } else {
    warnings.push("No operator currently checked in");
    score -= 10;
  }

  return { score: Math.min(100, Math.max(0, score)), blockers, warnings };
}

/** Parse tolerance strings like "±0.001" or "0.0005" to a number in inches */
function parseToleranceToInches(tol: string): number | null {
  const cleaned = tol.replace(/[±\s"in]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// ---------------------------------------------------------------------------
// Main load balancer
// ---------------------------------------------------------------------------

export function computeLoadBalancerScores(input: LoadBalancerInput): LoadBalancerResult {
  const {
    stations,
    machineProfiles,
    stationLoads,
    stationAvailability,
    partRequirements,
    workCenterTypeFilter,
  } = input;

  // Index profiles by station_id
  const profileByStation = new Map<string, MachineProfile>();
  for (const mp of machineProfiles) {
    // If multiple profiles exist for a station, verified takes priority
    const existing = profileByStation.get(mp.station_id);
    if (!existing || mp.source === "verified_library") {
      profileByStation.set(mp.station_id, mp);
    }
  }

  const results: StationScore[] = [];

  for (const station of stations) {
    if (!station.is_active) continue;
    if (workCenterTypeFilter && station.work_center_type !== workCenterTypeFilter) continue;

    const profile = profileByStation.get(station.id);
    const load = stationLoads[station.id];
    const avail = stationAvailability[station.id];

    const workloadResult = scoreWorkload(load, station.daily_capacity_hours ?? 8);
    const capabilityResult = scoreCapability(profile, partRequirements);
    const availabilityResult = scoreAvailability(avail);

    const allBlockers = [...capabilityResult.blockers, ...availabilityResult.blockers];
    const allWarnings = [...workloadResult.warnings, ...capabilityResult.warnings, ...availabilityResult.warnings];

    // If any hard blockers, total = 0
    const total =
      allBlockers.length > 0
        ? 0
        : Math.round(
            workloadResult.score * WEIGHTS.workload +
            capabilityResult.score * WEIGHTS.capability +
            availabilityResult.score * WEIGHTS.availability,
          );

    results.push({
      station_id: station.id,
      station_name: station.name,
      station_code: station.station_id,
      work_center_type: station.work_center_type,
      total_score: total,
      workload_score: workloadResult.score,
      capability_score: capabilityResult.score,
      availability_score: availabilityResult.score,
      blockers: allBlockers,
      warnings: allWarnings,
      advantages: capabilityResult.advantages,
      machine_profile: profile || null,
      current_load: load,
    });
  }

  // Sort by total score descending
  results.sort((a, b) => b.total_score - a.total_score);

  const best = results.find((r) => r.total_score > 0) ?? null;

  // Build human-readable summary
  const eligible = results.filter((r) => r.total_score > 0);
  const blocked = results.filter((r) => r.blockers.length > 0);

  let summary = `Analyzed ${results.length} station(s). `;
  if (eligible.length === 0) {
    summary += "No eligible stations found — all have blocking constraints.";
  } else {
    summary += `${eligible.length} eligible, ${blocked.length} blocked. `;
    summary += `Best fit: ${best!.station_name} (${best!.station_code}) — score ${best!.total_score}/100.`;
    if (best!.advantages.length > 0) {
      summary += ` Advantages: ${best!.advantages.slice(0, 3).join(", ")}.`;
    }
    if (best!.warnings.length > 0) {
      summary += ` Note: ${best!.warnings[0]}.`;
    }
  }

  return {
    recommendations: results,
    summary,
    best_station_id: best?.station_id ?? null,
  };
}

// ---------------------------------------------------------------------------
// AI-ready serializer — compact JSON for injection into system prompts
// ---------------------------------------------------------------------------

export function serializeForAI(result: LoadBalancerResult): string {
  const top5 = result.recommendations.slice(0, 8);
  const lines = [
    `### Load Balancer Recommendations`,
    `Summary: ${result.summary}`,
    ``,
    `| Rank | Station | Code | Type | Score | Workload | Capability | Avail | Notes |`,
    `|------|---------|------|------|-------|----------|------------|-------|-------|`,
  ];

  for (let i = 0; i < top5.length; i++) {
    const r = top5[i];
    const notes =
      r.blockers.length > 0
        ? `❌ ${r.blockers[0]}`
        : r.warnings.length > 0
          ? `⚠️ ${r.warnings[0]}`
          : r.advantages.length > 0
            ? `✅ ${r.advantages[0]}`
            : "";
    lines.push(
      `| ${i + 1} | ${r.station_name} | ${r.station_code} | ${r.work_center_type} | ${r.total_score} | ${r.workload_score} | ${r.capability_score} | ${r.availability_score} | ${notes} |`,
    );
  }

  if (result.recommendations.length > 8) {
    lines.push(`\n_${result.recommendations.length - 8} more stations omitted._`);
  }

  return lines.join("\n");
}
