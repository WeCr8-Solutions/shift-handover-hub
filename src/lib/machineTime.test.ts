import { describe, it, expect } from 'vitest';
import { computeEstimatedDuration, computeRemainingMinutes, formatMinutes, WorkPhase } from './machineTime';

describe('computeEstimatedDuration', () => {
  it('computes setup + FAI + (cycle * qty)', () => {
    expect(computeEstimatedDuration(30, 15, 5, 100)).toBe(545);
  });

  it('uses qty=1 when null', () => {
    expect(computeEstimatedDuration(30, 15, 5, null)).toBe(50);
  });

  it('treats null fields as 0', () => {
    expect(computeEstimatedDuration(null, null, null, null)).toBe(0);
  });

  it('handles only setup', () => {
    expect(computeEstimatedDuration(45, null, null, 10)).toBe(45);
  });

  it('handles only cycle', () => {
    expect(computeEstimatedDuration(null, null, 3, 20)).toBe(60);
  });

  it('handles zero quantity', () => {
    expect(computeEstimatedDuration(30, 15, 5, 0)).toBe(45);
  });

  it('handles large values', () => {
    expect(computeEstimatedDuration(120, 60, 10, 10000)).toBe(100180);
  });

  it('handles partial input (setup + FAI only)', () => {
    expect(computeEstimatedDuration(30, 15, null, 50)).toBe(45);
  });
});

describe('computeRemainingMinutes', () => {
  const base = {
    setup_time_minutes: 30,
    first_article_minutes: 15,
    cycle_time_minutes: 5,
    quantity: 100,
  };

  it('returns full total in setup phase with 0 parts done', () => {
    expect(computeRemainingMinutes({ ...base, current_phase: 'setup', parts_completed: 0 })).toBe(545);
  });

  it('skips setup in first_article phase', () => {
    expect(computeRemainingMinutes({ ...base, current_phase: 'first_article', parts_completed: 0 })).toBe(515);
  });

  it('skips setup+FAI in production phase', () => {
    expect(computeRemainingMinutes({ ...base, current_phase: 'production', parts_completed: 0 })).toBe(500);
  });

  it('subtracts completed parts in production', () => {
    expect(computeRemainingMinutes({ ...base, current_phase: 'production', parts_completed: 60 })).toBe(200);
  });

  it('returns 0 when complete', () => {
    expect(computeRemainingMinutes({ ...base, current_phase: 'complete', parts_completed: 100 })).toBe(0);
  });

  it('clamps qty_remaining to 0 when parts_completed > quantity', () => {
    expect(computeRemainingMinutes({ ...base, current_phase: 'production', parts_completed: 150 })).toBe(0);
  });

  it('handles all nulls', () => {
    expect(computeRemainingMinutes({
      setup_time_minutes: null,
      first_article_minutes: null,
      cycle_time_minutes: null,
      quantity: null,
      current_phase: 'setup',
      parts_completed: 0,
    })).toBe(0);
  });

  it('accounts for parts_completed in setup phase too', () => {
    // Even in setup phase, if some parts are already done the cycle portion should reflect that
    expect(computeRemainingMinutes({ ...base, current_phase: 'setup', parts_completed: 50 })).toBe(295);
  });
});

describe('formatMinutes', () => {
  it('formats minutes only', () => {
    expect(formatMinutes(45)).toBe('45m');
  });

  it('formats hours and minutes', () => {
    expect(formatMinutes(125)).toBe('2h 5m');
  });

  it('handles 0', () => {
    expect(formatMinutes(0)).toBe('0m');
  });

  it('handles negative', () => {
    expect(formatMinutes(-5)).toBe('0m');
  });

  it('handles exact hours', () => {
    expect(formatMinutes(120)).toBe('2h 0m');
  });
});
