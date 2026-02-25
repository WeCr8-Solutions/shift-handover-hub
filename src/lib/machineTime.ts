/**
 * Machine Time Computation Utilities
 * 
 * Shared formulas for estimated duration and remaining time calculations.
 * These mirror the DB trigger logic so UI previews match stored values.
 */

export type WorkPhase = 'setup' | 'first_article' | 'production' | 'complete';

export interface MachineTimeInputs {
  setup_time_minutes: number | null;
  first_article_minutes: number | null;
  cycle_time_minutes: number | null;
  quantity: number | null;
}

export interface RemainingTimeInputs extends MachineTimeInputs {
  current_phase: WorkPhase;
  parts_completed: number;
}

/**
 * Compute total estimated duration.
 * Formula: setup + FAI + (cycle * qty)
 * Matches the DB trigger `compute_estimated_duration_queue_item`.
 */
export function computeEstimatedDuration(
  setup: number | null,
  fai: number | null,
  cycle: number | null,
  qty: number | null,
): number {
  return (setup ?? 0) + (fai ?? 0) + ((cycle ?? 0) * (qty ?? 1));
}

/**
 * Compute remaining minutes based on phase progress.
 * Formula:
 *   qty_remaining = max(qty_total - qty_completed, 0)
 *   remaining = (setup if not done) + (FAI if not done) + (cycle * qty_remaining)
 */
export function computeRemainingMinutes(inputs: RemainingTimeInputs): number {
  const { setup_time_minutes, first_article_minutes, cycle_time_minutes, quantity, current_phase, parts_completed } = inputs;

  const setup = setup_time_minutes ?? 0;
  const fai = first_article_minutes ?? 0;
  const cycle = cycle_time_minutes ?? 0;
  const qtyTotal = quantity ?? 1;
  const qtyRemaining = Math.max(qtyTotal - (parts_completed ?? 0), 0);

  let remaining = 0;

  switch (current_phase) {
    case 'setup':
      remaining = setup + fai + (cycle * qtyRemaining);
      break;
    case 'first_article':
      remaining = fai + (cycle * qtyRemaining);
      break;
    case 'production':
      remaining = cycle * qtyRemaining;
      break;
    case 'complete':
      remaining = 0;
      break;
    default:
      remaining = setup + fai + (cycle * qtyRemaining);
  }

  return remaining;
}

/**
 * Format minutes into a human-readable string.
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
