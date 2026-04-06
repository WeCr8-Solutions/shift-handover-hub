import { describe, it, expect } from "vitest";
import { surfaceFinishRa } from "../SurfaceFinishCalculator";
import { millingMrr, turningMrr } from "../MrrCalculator";
import { estimateCycleTime } from "../CycleTimeEstimator";
import { convertHardness } from "../HardnessConverter";
import { tpiToPitch, pitchToTpi, threadDiameters } from "../ThreadPitchCalculator";
import { UNC_THREAD_DATA, METRIC_THREAD_DATA } from "../threadData";

describe("SurfaceFinishCalculator", () => {
  it("computes Ra correctly", () => {
    // Ra = f² / (32 × r)
    const ra = surfaceFinishRa(0.006, 0.031);
    expect(ra).toBeCloseTo(0.006 * 0.006 / (32 * 0.031), 6);
  });
  it("returns 0 for zero nose radius", () => {
    expect(surfaceFinishRa(0.006, 0)).toBe(0);
  });
  it("larger feed = higher Ra", () => {
    expect(surfaceFinishRa(0.012, 0.031)).toBeGreaterThan(surfaceFinishRa(0.006, 0.031));
  });
  it("larger radius = lower Ra", () => {
    expect(surfaceFinishRa(0.006, 0.062)).toBeLessThan(surfaceFinishRa(0.006, 0.031));
  });
});

describe("MrrCalculator", () => {
  it("milling MRR = WOC × DOC × feedRate", () => {
    expect(millingMrr(0.5, 0.1, 15)).toBeCloseTo(0.75, 4);
  });
  it("milling MRR zero inputs", () => {
    expect(millingMrr(0, 0.1, 15)).toBe(0);
  });
  it("turning MRR produces positive result", () => {
    const result = turningMrr(0.05, 0.008, 300, 2.0);
    expect(result).toBeGreaterThan(0);
  });
  it("turning MRR zero diameter returns 0", () => {
    expect(turningMrr(0.05, 0.008, 300, 0)).toBe(0);
  });
});

describe("CycleTimeEstimator", () => {
  it("calculates cutting time from ops", () => {
    const result = estimateCycleTime(
      [{ length: 6, feedRate: 15 }, { length: 6, feedRate: 8 }],
      30, 2, 5
    );
    expect(result.cuttingTime).toBeCloseTo(6/15 + 6/8, 4);
  });
  it("includes load/unload and tool change time", () => {
    const result = estimateCycleTime([], 60, 3, 10);
    expect(result.nonCuttingTime).toBeCloseTo(60/60 + (3*10)/60, 4);
  });
  it("parts per hour is inverse of total", () => {
    const result = estimateCycleTime(
      [{ length: 10, feedRate: 10 }], 0, 0, 0
    );
    expect(result.partsPerHour).toBeCloseTo(60, 1);
  });
  it("handles zero feed rate without crashing", () => {
    const result = estimateCycleTime([{ length: 5, feedRate: 0 }], 0, 0, 0);
    expect(result.cuttingTime).toBe(0);
  });
});

describe("HardnessConverter", () => {
  it("HRC to HRC returns same value", () => {
    expect(convertHardness(45, "hrc", "hrc")).toBe(45);
  });
  it("HRC to HV returns reasonable value", () => {
    const hv = convertHardness(45, "hrc", "hv");
    expect(hv).not.toBeNull();
    expect(hv!).toBeGreaterThan(400);
    expect(hv!).toBeLessThan(520);
  });
  it("HRC to HB returns reasonable value", () => {
    const hb = convertHardness(45, "hrc", "hb");
    expect(hb).not.toBeNull();
    expect(hb!).toBeGreaterThan(300);
    expect(hb!).toBeLessThan(500);
  });
  it("out of range returns null", () => {
    expect(convertHardness(5, "hrc", "hv")).toBeNull();
  });
});

describe("ThreadPitchCalculator", () => {
  it("20 TPI = 1.27mm pitch", () => {
    expect(tpiToPitch(20)).toBeCloseTo(1.27, 2);
  });
  it("1.25mm pitch ≈ 20.32 TPI", () => {
    expect(pitchToTpi(1.25)).toBeCloseTo(20.32, 1);
  });
  it("round-trips TPI → pitch → TPI", () => {
    const pitch = tpiToPitch(13);
    const tpi = pitchToTpi(pitch);
    expect(tpi).toBeCloseTo(13, 4);
  });
  it("thread diameters for 1/4-20", () => {
    const dims = threadDiameters(0.250, 20);
    expect(dims).not.toBeNull();
    expect(dims!.minor).toBeLessThan(0.250);
    expect(dims!.pitch).toBeLessThan(0.250);
    expect(dims!.pitch).toBeGreaterThan(dims!.minor);
  });
  it("zero TPI returns null", () => {
    expect(threadDiameters(0.250, 0)).toBeNull();
  });
});

describe("TapDrillChart data integrity", () => {
  it("UNC threads have valid entries", () => {
    expect(UNC_THREAD_DATA.length).toBeGreaterThan(10);
    UNC_THREAD_DATA.forEach(t => {
      expect(t.basicMajorDia).toBeGreaterThan(0);
      expect(t.tapDrillDec75).toBeGreaterThan(0);
      expect(t.tapDrillDec75).toBeLessThan(t.basicMajorDia);
    });
  });
  it("Metric threads have valid entries", () => {
    expect(METRIC_THREAD_DATA.length).toBeGreaterThan(5);
    METRIC_THREAD_DATA.forEach(t => {
      expect(t.basicMajorDia).toBeGreaterThan(0);
      expect(t.tapDrillDec75).toBeGreaterThan(0);
      expect(t.tapDrillDec75).toBeLessThan(t.basicMajorDia);
    });
  });
});
