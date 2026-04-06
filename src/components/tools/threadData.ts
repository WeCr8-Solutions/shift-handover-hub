/**
 * Thread data from Machinery's Handbook (31st Edition)
 * ASME B1.1 Unified Inch Screw Threads
 * ASME B1.13M ISO Metric Screw Threads
 *
 * All dimensions in inches (UNC/UNF) or millimeters (Metric).
 * STI = Screw Thread Insert (Heli-Coil style)
 */

export interface ThreadClassLimits {
  majorMax: number;
  majorMin: number;
  pitchMax: number;
  pitchMin: number;
  minorMax: number;
  minorMin: number;
}

export interface UnifiedThreadEntry {
  size: string;
  tpi: number;
  basicMajorDia: number; // nominal
  basicPitchDia: number;
  basicMinorDia: number;
  // External thread classes
  class2A: ThreadClassLimits;
  class3A: ThreadClassLimits;
  // Internal thread classes
  class2B: ThreadClassLimits;
  class3B: ThreadClassLimits;
  // Tap drills
  tapDrill75: string;      // 75% thread
  tapDrillDec75: number;
  tapDrill50: string;      // 50% thread (for harder materials)
  tapDrillDec50: number;
  // STI (Screw Thread Insert) tap drill
  stiTapDrill: string;
  stiTapDrillDec: number;
  stiInsertSize: string;   // e.g. "1D", "1.5D", "2D"
}

export interface MetricThreadEntry {
  size: string;
  pitch: number;
  basicMajorDia: number;
  basicPitchDia: number;
  basicMinorDia: number;
  class6g: ThreadClassLimits; // external
  class4g6g: ThreadClassLimits; // external tight
  class6H: ThreadClassLimits; // internal
  class4H5H: ThreadClassLimits; // internal tight
  tapDrill75: string;
  tapDrillDec75: number;
  tapDrill50: string;
  tapDrillDec50: number;
  stiTapDrill: string;
  stiTapDrillDec: number;
  stiInsertSize: string;
}

// ── UNC Thread Data (Machinery's Handbook 31st Ed, ASME B1.1) ──

export const UNC_THREAD_DATA: UnifiedThreadEntry[] = [
  {
    size: "#1-64", tpi: 64, basicMajorDia: 0.0730, basicPitchDia: 0.0629, basicMinorDia: 0.0538,
    class2A: { majorMax: 0.0730, majorMin: 0.0692, pitchMax: 0.0623, pitchMin: 0.0599, minorMax: 0.0527, minorMin: 0.0487 },
    class3A: { majorMax: 0.0730, majorMin: 0.0706, pitchMax: 0.0629, pitchMin: 0.0610, minorMax: 0.0538, minorMin: 0.0506 },
    class2B: { majorMax: 0.0000, majorMin: 0.0730, pitchMax: 0.0659, pitchMin: 0.0629, minorMax: 0.0578, minorMin: 0.0538 },
    class3B: { majorMax: 0.0000, majorMin: 0.0730, pitchMax: 0.0647, pitchMin: 0.0629, minorMax: 0.0566, minorMin: 0.0538 },
    tapDrill75: "#53", tapDrillDec75: 0.0595, tapDrill50: "#52", tapDrillDec50: 0.0635,
    stiTapDrill: "#43", stiTapDrillDec: 0.0890, stiInsertSize: "#1-64×1D",
  },
  {
    size: "#2-56", tpi: 56, basicMajorDia: 0.0860, basicPitchDia: 0.0744, basicMinorDia: 0.0641,
    class2A: { majorMax: 0.0860, majorMin: 0.0818, pitchMax: 0.0737, pitchMin: 0.0710, minorMax: 0.0628, minorMin: 0.0583 },
    class3A: { majorMax: 0.0860, majorMin: 0.0833, pitchMax: 0.0744, pitchMin: 0.0722, minorMax: 0.0641, minorMin: 0.0604 },
    class2B: { majorMax: 0.0000, majorMin: 0.0860, pitchMax: 0.0780, pitchMin: 0.0744, minorMax: 0.0692, minorMin: 0.0641 },
    class3B: { majorMax: 0.0000, majorMin: 0.0860, pitchMax: 0.0765, pitchMin: 0.0744, minorMax: 0.0677, minorMin: 0.0641 },
    tapDrill75: "#50", tapDrillDec75: 0.0700, tapDrill50: "#49", tapDrillDec50: 0.0730,
    stiTapDrill: "#41", stiTapDrillDec: 0.0960, stiInsertSize: "#2-56×1D",
  },
  {
    size: "#3-48", tpi: 48, basicMajorDia: 0.0990, basicPitchDia: 0.0855, basicMinorDia: 0.0734,
    class2A: { majorMax: 0.0990, majorMin: 0.0943, pitchMax: 0.0847, pitchMin: 0.0816, minorMax: 0.0719, minorMin: 0.0667 },
    class3A: { majorMax: 0.0990, majorMin: 0.0961, pitchMax: 0.0855, pitchMin: 0.0830, minorMax: 0.0734, minorMin: 0.0692 },
    class2B: { majorMax: 0.0000, majorMin: 0.0990, pitchMax: 0.0896, pitchMin: 0.0855, minorMax: 0.0788, minorMin: 0.0734 },
    class3B: { majorMax: 0.0000, majorMin: 0.0990, pitchMax: 0.0879, pitchMin: 0.0855, minorMax: 0.0771, minorMin: 0.0734 },
    tapDrill75: "#47", tapDrillDec75: 0.0785, tapDrill50: "#44", tapDrillDec50: 0.0860,
    stiTapDrill: "#37", stiTapDrillDec: 0.1040, stiInsertSize: "#3-48×1D",
  },
  {
    size: "#4-40", tpi: 40, basicMajorDia: 0.1120, basicPitchDia: 0.0958, basicMinorDia: 0.0813,
    class2A: { majorMax: 0.1120, majorMin: 0.1068, pitchMax: 0.0948, pitchMin: 0.0911, minorMax: 0.0795, minorMin: 0.0735 },
    class3A: { majorMax: 0.1120, majorMin: 0.1088, pitchMax: 0.0958, pitchMin: 0.0928, minorMax: 0.0813, minorMin: 0.0764 },
    class2B: { majorMax: 0.0000, majorMin: 0.1120, pitchMax: 0.1004, pitchMin: 0.0958, minorMax: 0.0871, minorMin: 0.0813 },
    class3B: { majorMax: 0.0000, majorMin: 0.1120, pitchMax: 0.0985, pitchMin: 0.0958, minorMax: 0.0849, minorMin: 0.0813 },
    tapDrill75: "#43", tapDrillDec75: 0.0890, tapDrill50: "#41", tapDrillDec50: 0.0960,
    stiTapDrill: "#31", stiTapDrillDec: 0.1200, stiInsertSize: "#4-40×1D",
  },
  {
    size: "#5-40", tpi: 40, basicMajorDia: 0.1250, basicPitchDia: 0.1088, basicMinorDia: 0.0943,
    class2A: { majorMax: 0.1250, majorMin: 0.1195, pitchMax: 0.1078, pitchMin: 0.1039, minorMax: 0.0925, minorMin: 0.0862 },
    class3A: { majorMax: 0.1250, majorMin: 0.1216, pitchMax: 0.1088, pitchMin: 0.1056, minorMax: 0.0943, minorMin: 0.0891 },
    class2B: { majorMax: 0.0000, majorMin: 0.1250, pitchMax: 0.1134, pitchMin: 0.1088, minorMax: 0.1001, minorMin: 0.0943 },
    class3B: { majorMax: 0.0000, majorMin: 0.1250, pitchMax: 0.1115, pitchMin: 0.1088, minorMax: 0.0979, minorMin: 0.0943 },
    tapDrill75: "#38", tapDrillDec75: 0.1015, tapDrill50: "#36", tapDrillDec50: 0.1065,
    stiTapDrill: "#29", stiTapDrillDec: 0.1360, stiInsertSize: "#5-40×1D",
  },
  {
    size: "#6-32", tpi: 32, basicMajorDia: 0.1380, basicPitchDia: 0.1177, basicMinorDia: 0.0997,
    class2A: { majorMax: 0.1380, majorMin: 0.1318, pitchMax: 0.1166, pitchMin: 0.1120, minorMax: 0.0974, minorMin: 0.0900 },
    class3A: { majorMax: 0.1380, majorMin: 0.1343, pitchMax: 0.1177, pitchMin: 0.1141, minorMax: 0.0997, minorMin: 0.0937 },
    class2B: { majorMax: 0.0000, majorMin: 0.1380, pitchMax: 0.1228, pitchMin: 0.1177, minorMax: 0.1063, minorMin: 0.0997 },
    class3B: { majorMax: 0.0000, majorMin: 0.1380, pitchMax: 0.1207, pitchMin: 0.1177, minorMax: 0.1038, minorMin: 0.0997 },
    tapDrill75: "#36", tapDrillDec75: 0.1065, tapDrill50: "#32", tapDrillDec50: 0.1160,
    stiTapDrill: "#25", stiTapDrillDec: 0.1495, stiInsertSize: "#6-32×1D",
  },
  {
    size: "#8-32", tpi: 32, basicMajorDia: 0.1640, basicPitchDia: 0.1437, basicMinorDia: 0.1257,
    class2A: { majorMax: 0.1640, majorMin: 0.1572, pitchMax: 0.1425, pitchMin: 0.1375, minorMax: 0.1234, minorMin: 0.1154 },
    class3A: { majorMax: 0.1640, majorMin: 0.1600, pitchMax: 0.1437, pitchMin: 0.1396, minorMax: 0.1257, minorMin: 0.1191 },
    class2B: { majorMax: 0.0000, majorMin: 0.1640, pitchMax: 0.1492, pitchMin: 0.1437, minorMax: 0.1326, minorMin: 0.1257 },
    class3B: { majorMax: 0.0000, majorMin: 0.1640, pitchMax: 0.1469, pitchMin: 0.1437, minorMax: 0.1299, minorMin: 0.1257 },
    tapDrill75: "#29", tapDrillDec75: 0.1360, tapDrill50: "#27", tapDrillDec50: 0.1440,
    stiTapDrill: "#18", stiTapDrillDec: 0.1695, stiInsertSize: "#8-32×1D",
  },
  {
    size: "#10-24", tpi: 24, basicMajorDia: 0.1900, basicPitchDia: 0.1629, basicMinorDia: 0.1389,
    class2A: { majorMax: 0.1900, majorMin: 0.1822, pitchMax: 0.1615, pitchMin: 0.1557, minorMax: 0.1359, minorMin: 0.1265 },
    class3A: { majorMax: 0.1900, majorMin: 0.1855, pitchMax: 0.1629, pitchMin: 0.1582, minorMax: 0.1389, minorMin: 0.1312 },
    class2B: { majorMax: 0.0000, majorMin: 0.1900, pitchMax: 0.1697, pitchMin: 0.1629, minorMax: 0.1470, minorMin: 0.1389 },
    class3B: { majorMax: 0.0000, majorMin: 0.1900, pitchMax: 0.1672, pitchMin: 0.1629, minorMax: 0.1441, minorMin: 0.1389 },
    tapDrill75: "#25", tapDrillDec75: 0.1495, tapDrill50: "#20", tapDrillDec50: 0.1610,
    stiTapDrill: "#10", stiTapDrillDec: 0.1935, stiInsertSize: "#10-24×1D",
  },
  {
    size: "#10-32", tpi: 32, basicMajorDia: 0.1900, basicPitchDia: 0.1697, basicMinorDia: 0.1517,
    class2A: { majorMax: 0.1900, majorMin: 0.1830, pitchMax: 0.1684, pitchMin: 0.1632, minorMax: 0.1494, minorMin: 0.1410 },
    class3A: { majorMax: 0.1900, majorMin: 0.1859, pitchMax: 0.1697, pitchMin: 0.1654, minorMax: 0.1517, minorMin: 0.1449 },
    class2B: { majorMax: 0.0000, majorMin: 0.1900, pitchMax: 0.1755, pitchMin: 0.1697, minorMax: 0.1590, minorMin: 0.1517 },
    class3B: { majorMax: 0.0000, majorMin: 0.1900, pitchMax: 0.1731, pitchMin: 0.1697, minorMax: 0.1562, minorMin: 0.1517 },
    tapDrill75: "#21", tapDrillDec75: 0.1590, tapDrill50: "#16", tapDrillDec50: 0.1770,
    stiTapDrill: "#3", stiTapDrillDec: 0.2130, stiInsertSize: "#10-32×1D",
  },
  {
    size: "1/4-20", tpi: 20, basicMajorDia: 0.2500, basicPitchDia: 0.2175, basicMinorDia: 0.1887,
    class2A: { majorMax: 0.2500, majorMin: 0.2408, pitchMax: 0.2159, pitchMin: 0.2093, minorMax: 0.1850, minorMin: 0.1744 },
    class3A: { majorMax: 0.2500, majorMin: 0.2447, pitchMax: 0.2175, pitchMin: 0.2121, minorMax: 0.1887, minorMin: 0.1801 },
    class2B: { majorMax: 0.0000, majorMin: 0.2500, pitchMax: 0.2248, pitchMin: 0.2175, minorMax: 0.1981, minorMin: 0.1887 },
    class3B: { majorMax: 0.0000, majorMin: 0.2500, pitchMax: 0.2224, pitchMin: 0.2175, minorMax: 0.1953, minorMin: 0.1887 },
    tapDrill75: "#7", tapDrillDec75: 0.2010, tapDrill50: "7/32\"", tapDrillDec50: 0.2188,
    stiTapDrill: "F", stiTapDrillDec: 0.2570, stiInsertSize: "1/4-20×1D",
  },
  {
    size: "5/16-18", tpi: 18, basicMajorDia: 0.3125, basicPitchDia: 0.2764, basicMinorDia: 0.2443,
    class2A: { majorMax: 0.3125, majorMin: 0.3026, pitchMax: 0.2746, pitchMin: 0.2674, minorMax: 0.2403, minorMin: 0.2288 },
    class3A: { majorMax: 0.3125, majorMin: 0.3069, pitchMax: 0.2764, pitchMin: 0.2706, minorMax: 0.2443, minorMin: 0.2350 },
    class2B: { majorMax: 0.0000, majorMin: 0.3125, pitchMax: 0.2843, pitchMin: 0.2764, minorMax: 0.2547, minorMin: 0.2443 },
    class3B: { majorMax: 0.0000, majorMin: 0.3125, pitchMax: 0.2817, pitchMin: 0.2764, minorMax: 0.2516, minorMin: 0.2443 },
    tapDrill75: "F", tapDrillDec75: 0.2570, tapDrill50: "G", tapDrillDec50: 0.2610,
    stiTapDrill: "Q", stiTapDrillDec: 0.3320, stiInsertSize: "5/16-18×1D",
  },
  {
    size: "3/8-16", tpi: 16, basicMajorDia: 0.3750, basicPitchDia: 0.3344, basicMinorDia: 0.2983,
    class2A: { majorMax: 0.3750, majorMin: 0.3643, pitchMax: 0.3324, pitchMin: 0.3244, minorMax: 0.2938, minorMin: 0.2812 },
    class3A: { majorMax: 0.3750, majorMin: 0.3690, pitchMax: 0.3344, pitchMin: 0.3280, minorMax: 0.2983, minorMin: 0.2880 },
    class2B: { majorMax: 0.0000, majorMin: 0.3750, pitchMax: 0.3432, pitchMin: 0.3344, minorMax: 0.3100, minorMin: 0.2983 },
    class3B: { majorMax: 0.0000, majorMin: 0.3750, pitchMax: 0.3401, pitchMin: 0.3344, minorMax: 0.3063, minorMin: 0.2983 },
    tapDrill75: "5/16\"", tapDrillDec75: 0.3125, tapDrill50: "Q", tapDrillDec50: 0.3320,
    stiTapDrill: "25/64\"", stiTapDrillDec: 0.3906, stiInsertSize: "3/8-16×1D",
  },
  {
    size: "7/16-14", tpi: 14, basicMajorDia: 0.4375, basicPitchDia: 0.3911, basicMinorDia: 0.3499,
    class2A: { majorMax: 0.4375, majorMin: 0.4258, pitchMax: 0.3889, pitchMin: 0.3800, minorMax: 0.3447, minorMin: 0.3307 },
    class3A: { majorMax: 0.4375, majorMin: 0.4310, pitchMax: 0.3911, pitchMin: 0.3839, minorMax: 0.3499, minorMin: 0.3383 },
    class2B: { majorMax: 0.0000, majorMin: 0.4375, pitchMax: 0.4009, pitchMin: 0.3911, minorMax: 0.3625, minorMin: 0.3499 },
    class3B: { majorMax: 0.0000, majorMin: 0.4375, pitchMax: 0.3975, pitchMin: 0.3911, minorMax: 0.3585, minorMin: 0.3499 },
    tapDrill75: "U", tapDrillDec75: 0.3680, tapDrill50: "25/64\"", tapDrillDec50: 0.3906,
    stiTapDrill: "29/64\"", stiTapDrillDec: 0.4531, stiInsertSize: "7/16-14×1D",
  },
  {
    size: "1/2-13", tpi: 13, basicMajorDia: 0.5000, basicPitchDia: 0.4500, basicMinorDia: 0.4056,
    class2A: { majorMax: 0.5000, majorMin: 0.4876, pitchMax: 0.4476, pitchMin: 0.4383, minorMax: 0.4000, minorMin: 0.3851 },
    class3A: { majorMax: 0.5000, majorMin: 0.4931, pitchMax: 0.4500, pitchMin: 0.4424, minorMax: 0.4056, minorMin: 0.3934 },
    class2B: { majorMax: 0.0000, majorMin: 0.5000, pitchMax: 0.4604, pitchMin: 0.4500, minorMax: 0.4196, minorMin: 0.4056 },
    class3B: { majorMax: 0.0000, majorMin: 0.5000, pitchMax: 0.4565, pitchMin: 0.4500, minorMax: 0.4152, minorMin: 0.4056 },
    tapDrill75: "27/64\"", tapDrillDec75: 0.4219, tapDrill50: "29/64\"", tapDrillDec50: 0.4531,
    stiTapDrill: "33/64\"", stiTapDrillDec: 0.5156, stiInsertSize: "1/2-13×1D",
  },
  {
    size: "5/8-11", tpi: 11, basicMajorDia: 0.6250, basicPitchDia: 0.5660, basicMinorDia: 0.5135,
    class2A: { majorMax: 0.6250, majorMin: 0.6113, pitchMax: 0.5632, pitchMin: 0.5528, minorMax: 0.5069, minorMin: 0.4903 },
    class3A: { majorMax: 0.6250, majorMin: 0.6175, pitchMax: 0.5660, pitchMin: 0.5575, minorMax: 0.5135, minorMin: 0.4999 },
    class2B: { majorMax: 0.0000, majorMin: 0.6250, pitchMax: 0.5774, pitchMin: 0.5660, minorMax: 0.5294, minorMin: 0.5135 },
    class3B: { majorMax: 0.0000, majorMin: 0.6250, pitchMax: 0.5732, pitchMin: 0.5660, minorMax: 0.5245, minorMin: 0.5135 },
    tapDrill75: "17/32\"", tapDrillDec75: 0.5312, tapDrill50: "9/16\"", tapDrillDec50: 0.5625,
    stiTapDrill: "41/64\"", stiTapDrillDec: 0.6406, stiInsertSize: "5/8-11×1D",
  },
  {
    size: "3/4-10", tpi: 10, basicMajorDia: 0.7500, basicPitchDia: 0.6850, basicMinorDia: 0.6273,
    class2A: { majorMax: 0.7500, majorMin: 0.7353, pitchMax: 0.6820, pitchMin: 0.6709, minorMax: 0.6201, minorMin: 0.6024 },
    class3A: { majorMax: 0.7500, majorMin: 0.7419, pitchMax: 0.6850, pitchMin: 0.6759, minorMax: 0.6273, minorMin: 0.6129 },
    class2B: { majorMax: 0.0000, majorMin: 0.7500, pitchMax: 0.6972, pitchMin: 0.6850, minorMax: 0.6448, minorMin: 0.6273 },
    class3B: { majorMax: 0.0000, majorMin: 0.7500, pitchMax: 0.6927, pitchMin: 0.6850, minorMax: 0.6395, minorMin: 0.6273 },
    tapDrill75: "21/32\"", tapDrillDec75: 0.6562, tapDrill50: "11/16\"", tapDrillDec50: 0.6875,
    stiTapDrill: "49/64\"", stiTapDrillDec: 0.7656, stiInsertSize: "3/4-10×1D",
  },
  {
    size: "7/8-9", tpi: 9, basicMajorDia: 0.8750, basicPitchDia: 0.8028, basicMinorDia: 0.7387,
    class2A: { majorMax: 0.8750, majorMin: 0.8592, pitchMax: 0.7995, pitchMin: 0.7876, minorMax: 0.7307, minorMin: 0.7118 },
    class3A: { majorMax: 0.8750, majorMin: 0.8663, pitchMax: 0.8028, pitchMin: 0.7930, minorMax: 0.7387, minorMin: 0.7233 },
    class2B: { majorMax: 0.0000, majorMin: 0.8750, pitchMax: 0.8162, pitchMin: 0.8028, minorMax: 0.7578, minorMin: 0.7387 },
    class3B: { majorMax: 0.0000, majorMin: 0.8750, pitchMax: 0.8113, pitchMin: 0.8028, minorMax: 0.7520, minorMin: 0.7387 },
    tapDrill75: "49/64\"", tapDrillDec75: 0.7656, tapDrill50: "51/64\"", tapDrillDec50: 0.7969,
    stiTapDrill: "57/64\"", stiTapDrillDec: 0.8906, stiInsertSize: "7/8-9×1D",
  },
  {
    size: "1\"-8", tpi: 8, basicMajorDia: 1.0000, basicPitchDia: 0.9188, basicMinorDia: 0.8466,
    class2A: { majorMax: 1.0000, majorMin: 0.9828, pitchMax: 0.9151, pitchMin: 0.9023, minorMax: 0.8376, minorMin: 0.8172 },
    class3A: { majorMax: 1.0000, majorMin: 0.9903, pitchMax: 0.9188, pitchMin: 0.9083, minorMax: 0.8466, minorMin: 0.8300 },
    class2B: { majorMax: 0.0000, majorMin: 1.0000, pitchMax: 0.9334, pitchMin: 0.9188, minorMax: 0.8647, minorMin: 0.8466 },
    class3B: { majorMax: 0.0000, majorMin: 1.0000, pitchMax: 0.9280, pitchMin: 0.9188, minorMax: 0.8585, minorMin: 0.8466 },
    tapDrill75: "7/8\"", tapDrillDec75: 0.8750, tapDrill50: "59/64\"", tapDrillDec50: 0.9219,
    stiTapDrill: "1-1/64\"", stiTapDrillDec: 1.0156, stiInsertSize: "1\"-8×1D",
  },
];

// ── UNF Thread Data ──

export const UNF_THREAD_DATA: UnifiedThreadEntry[] = [
  {
    size: "#0-80", tpi: 80, basicMajorDia: 0.0600, basicPitchDia: 0.0519, basicMinorDia: 0.0447,
    class2A: { majorMax: 0.0600, majorMin: 0.0568, pitchMax: 0.0514, pitchMin: 0.0494, minorMax: 0.0438, minorMin: 0.0404 },
    class3A: { majorMax: 0.0600, majorMin: 0.0580, pitchMax: 0.0519, pitchMin: 0.0503, minorMax: 0.0447, minorMin: 0.0419 },
    class2B: { majorMax: 0.0000, majorMin: 0.0600, pitchMax: 0.0545, pitchMin: 0.0519, minorMax: 0.0482, minorMin: 0.0447 },
    class3B: { majorMax: 0.0000, majorMin: 0.0600, pitchMax: 0.0535, pitchMin: 0.0519, minorMax: 0.0472, minorMin: 0.0447 },
    tapDrill75: "3/64\"", tapDrillDec75: 0.0469, tapDrill50: "#55", tapDrillDec50: 0.0520,
    stiTapDrill: "#49", stiTapDrillDec: 0.0730, stiInsertSize: "#0-80×1D",
  },
  {
    size: "#1-72", tpi: 72, basicMajorDia: 0.0730, basicPitchDia: 0.0640, basicMinorDia: 0.0560,
    class2A: { majorMax: 0.0730, majorMin: 0.0695, pitchMax: 0.0634, pitchMin: 0.0613, minorMax: 0.0550, minorMin: 0.0514 },
    class3A: { majorMax: 0.0730, majorMin: 0.0709, pitchMax: 0.0640, pitchMin: 0.0623, minorMax: 0.0560, minorMin: 0.0530 },
    class2B: { majorMax: 0.0000, majorMin: 0.0730, pitchMax: 0.0668, pitchMin: 0.0640, minorMax: 0.0596, minorMin: 0.0560 },
    class3B: { majorMax: 0.0000, majorMin: 0.0730, pitchMax: 0.0657, pitchMin: 0.0640, minorMax: 0.0585, minorMin: 0.0560 },
    tapDrill75: "#53", tapDrillDec75: 0.0595, tapDrill50: "#52", tapDrillDec50: 0.0635,
    stiTapDrill: "#45", stiTapDrillDec: 0.0820, stiInsertSize: "#1-72×1D",
  },
  {
    size: "#2-64", tpi: 64, basicMajorDia: 0.0860, basicPitchDia: 0.0759, basicMinorDia: 0.0668,
    class2A: { majorMax: 0.0860, majorMin: 0.0822, pitchMax: 0.0753, pitchMin: 0.0730, minorMax: 0.0657, minorMin: 0.0618 },
    class3A: { majorMax: 0.0860, majorMin: 0.0836, pitchMax: 0.0759, pitchMin: 0.0740, minorMax: 0.0668, minorMin: 0.0636 },
    class2B: { majorMax: 0.0000, majorMin: 0.0860, pitchMax: 0.0789, pitchMin: 0.0759, minorMax: 0.0708, minorMin: 0.0668 },
    class3B: { majorMax: 0.0000, majorMin: 0.0860, pitchMax: 0.0777, pitchMin: 0.0759, minorMax: 0.0696, minorMin: 0.0668 },
    tapDrill75: "#50", tapDrillDec75: 0.0700, tapDrill50: "#48", tapDrillDec50: 0.0760,
    stiTapDrill: "#42", stiTapDrillDec: 0.0935, stiInsertSize: "#2-64×1D",
  },
  {
    size: "#4-48", tpi: 48, basicMajorDia: 0.1120, basicPitchDia: 0.0985, basicMinorDia: 0.0864,
    class2A: { majorMax: 0.1120, majorMin: 0.1073, pitchMax: 0.0977, pitchMin: 0.0946, minorMax: 0.0849, minorMin: 0.0797 },
    class3A: { majorMax: 0.1120, majorMin: 0.1091, pitchMax: 0.0985, pitchMin: 0.0960, minorMax: 0.0864, minorMin: 0.0822 },
    class2B: { majorMax: 0.0000, majorMin: 0.1120, pitchMax: 0.1026, pitchMin: 0.0985, minorMax: 0.0918, minorMin: 0.0864 },
    class3B: { majorMax: 0.0000, majorMin: 0.1120, pitchMax: 0.1009, pitchMin: 0.0985, minorMax: 0.0901, minorMin: 0.0864 },
    tapDrill75: "#42", tapDrillDec75: 0.0935, tapDrill50: "#40", tapDrillDec50: 0.0980,
    stiTapDrill: "#27", stiTapDrillDec: 0.1440, stiInsertSize: "#4-48×1D",
  },
  {
    size: "#6-40", tpi: 40, basicMajorDia: 0.1380, basicPitchDia: 0.1218, basicMinorDia: 0.1073,
    class2A: { majorMax: 0.1380, majorMin: 0.1328, pitchMax: 0.1208, pitchMin: 0.1172, minorMax: 0.1055, minorMin: 0.0995 },
    class3A: { majorMax: 0.1380, majorMin: 0.1348, pitchMax: 0.1218, pitchMin: 0.1189, minorMax: 0.1073, minorMin: 0.1024 },
    class2B: { majorMax: 0.0000, majorMin: 0.1380, pitchMax: 0.1264, pitchMin: 0.1218, minorMax: 0.1131, minorMin: 0.1073 },
    class3B: { majorMax: 0.0000, majorMin: 0.1380, pitchMax: 0.1245, pitchMin: 0.1218, minorMax: 0.1109, minorMin: 0.1073 },
    tapDrill75: "#33", tapDrillDec75: 0.1130, tapDrill50: "#31", tapDrillDec50: 0.1200,
    stiTapDrill: "#19", stiTapDrillDec: 0.1660, stiInsertSize: "#6-40×1D",
  },
  {
    size: "#8-36", tpi: 36, basicMajorDia: 0.1640, basicPitchDia: 0.1460, basicMinorDia: 0.1299,
    class2A: { majorMax: 0.1640, majorMin: 0.1585, pitchMax: 0.1449, pitchMin: 0.1410, minorMax: 0.1279, minorMin: 0.1214 },
    class3A: { majorMax: 0.1640, majorMin: 0.1607, pitchMax: 0.1460, pitchMin: 0.1428, minorMax: 0.1299, minorMin: 0.1246 },
    class2B: { majorMax: 0.0000, majorMin: 0.1640, pitchMax: 0.1510, pitchMin: 0.1460, minorMax: 0.1360, minorMin: 0.1299 },
    class3B: { majorMax: 0.0000, majorMin: 0.1640, pitchMax: 0.1492, pitchMin: 0.1460, minorMax: 0.1339, minorMin: 0.1299 },
    tapDrill75: "#29", tapDrillDec75: 0.1360, tapDrill50: "#27", tapDrillDec50: 0.1440,
    stiTapDrill: "#13", stiTapDrillDec: 0.1850, stiInsertSize: "#8-36×1D",
  },
  {
    size: "#10-32", tpi: 32, basicMajorDia: 0.1900, basicPitchDia: 0.1697, basicMinorDia: 0.1517,
    class2A: { majorMax: 0.1900, majorMin: 0.1840, pitchMax: 0.1684, pitchMin: 0.1641, minorMax: 0.1494, minorMin: 0.1421 },
    class3A: { majorMax: 0.1900, majorMin: 0.1864, pitchMax: 0.1697, pitchMin: 0.1661, minorMax: 0.1517, minorMin: 0.1456 },
    class2B: { majorMax: 0.0000, majorMin: 0.1900, pitchMax: 0.1755, pitchMin: 0.1697, minorMax: 0.1590, minorMin: 0.1517 },
    class3B: { majorMax: 0.0000, majorMin: 0.1900, pitchMax: 0.1731, pitchMin: 0.1697, minorMax: 0.1562, minorMin: 0.1517 },
    tapDrill75: "#21", tapDrillDec75: 0.1590, tapDrill50: "#16", tapDrillDec50: 0.1770,
    stiTapDrill: "#3", stiTapDrillDec: 0.2130, stiInsertSize: "#10-32×1D",
  },
  {
    size: "1/4-28", tpi: 28, basicMajorDia: 0.2500, basicPitchDia: 0.2268, basicMinorDia: 0.2062,
    class2A: { majorMax: 0.2500, majorMin: 0.2435, pitchMax: 0.2255, pitchMin: 0.2207, minorMax: 0.2036, minorMin: 0.1956 },
    class3A: { majorMax: 0.2500, majorMin: 0.2462, pitchMax: 0.2268, pitchMin: 0.2228, minorMax: 0.2062, minorMin: 0.1995 },
    class2B: { majorMax: 0.0000, majorMin: 0.2500, pitchMax: 0.2332, pitchMin: 0.2268, minorMax: 0.2143, minorMin: 0.2062 },
    class3B: { majorMax: 0.0000, majorMin: 0.2500, pitchMax: 0.2311, pitchMin: 0.2268, minorMax: 0.2117, minorMin: 0.2062 },
    tapDrill75: "#3", tapDrillDec75: 0.2130, tapDrill50: "7/32\"", tapDrillDec50: 0.2188,
    stiTapDrill: "H", stiTapDrillDec: 0.2660, stiInsertSize: "1/4-28×1D",
  },
  {
    size: "5/16-24", tpi: 24, basicMajorDia: 0.3125, basicPitchDia: 0.2854, basicMinorDia: 0.2614,
    class2A: { majorMax: 0.3125, majorMin: 0.3053, pitchMax: 0.2840, pitchMin: 0.2786, minorMax: 0.2584, minorMin: 0.2496 },
    class3A: { majorMax: 0.3125, majorMin: 0.3082, pitchMax: 0.2854, pitchMin: 0.2809, minorMax: 0.2614, minorMin: 0.2541 },
    class2B: { majorMax: 0.0000, majorMin: 0.3125, pitchMax: 0.2922, pitchMin: 0.2854, minorMax: 0.2695, minorMin: 0.2614 },
    class3B: { majorMax: 0.0000, majorMin: 0.3125, pitchMax: 0.2897, pitchMin: 0.2854, minorMax: 0.2666, minorMin: 0.2614 },
    tapDrill75: "I", tapDrillDec75: 0.2720, tapDrill50: "J", tapDrillDec50: 0.2770,
    stiTapDrill: "S", stiTapDrillDec: 0.3480, stiInsertSize: "5/16-24×1D",
  },
  {
    size: "3/8-24", tpi: 24, basicMajorDia: 0.3750, basicPitchDia: 0.3479, basicMinorDia: 0.3239,
    class2A: { majorMax: 0.3750, majorMin: 0.3674, pitchMax: 0.3464, pitchMin: 0.3406, minorMax: 0.3209, minorMin: 0.3115 },
    class3A: { majorMax: 0.3750, majorMin: 0.3705, pitchMax: 0.3479, pitchMin: 0.3432, minorMax: 0.3239, minorMin: 0.3162 },
    class2B: { majorMax: 0.0000, majorMin: 0.3750, pitchMax: 0.3550, pitchMin: 0.3479, minorMax: 0.3322, minorMin: 0.3239 },
    class3B: { majorMax: 0.0000, majorMin: 0.3750, pitchMax: 0.3524, pitchMin: 0.3479, minorMax: 0.3292, minorMin: 0.3239 },
    tapDrill75: "Q", tapDrillDec75: 0.3320, tapDrill50: "S", tapDrillDec50: 0.3480,
    stiTapDrill: "27/64\"", stiTapDrillDec: 0.4219, stiInsertSize: "3/8-24×1D",
  },
  {
    size: "7/16-20", tpi: 20, basicMajorDia: 0.4375, basicPitchDia: 0.4050, basicMinorDia: 0.3762,
    class2A: { majorMax: 0.4375, majorMin: 0.4290, pitchMax: 0.4033, pitchMin: 0.3968, minorMax: 0.3725, minorMin: 0.3620 },
    class3A: { majorMax: 0.4375, majorMin: 0.4325, pitchMax: 0.4050, pitchMin: 0.3997, minorMax: 0.3762, minorMin: 0.3676 },
    class2B: { majorMax: 0.0000, majorMin: 0.4375, pitchMax: 0.4123, pitchMin: 0.4050, minorMax: 0.3856, minorMin: 0.3762 },
    class3B: { majorMax: 0.0000, majorMin: 0.4375, pitchMax: 0.4099, pitchMin: 0.4050, minorMax: 0.3828, minorMin: 0.3762 },
    tapDrill75: "W", tapDrillDec75: 0.3860, tapDrill50: "X", tapDrillDec50: 0.3970,
    stiTapDrill: "31/64\"", stiTapDrillDec: 0.4844, stiInsertSize: "7/16-20×1D",
  },
  {
    size: "1/2-20", tpi: 20, basicMajorDia: 0.5000, basicPitchDia: 0.4675, basicMinorDia: 0.4387,
    class2A: { majorMax: 0.5000, majorMin: 0.4912, pitchMax: 0.4658, pitchMin: 0.4590, minorMax: 0.4350, minorMin: 0.4240 },
    class3A: { majorMax: 0.5000, majorMin: 0.4950, pitchMax: 0.4675, pitchMin: 0.4620, minorMax: 0.4387, minorMin: 0.4299 },
    class2B: { majorMax: 0.0000, majorMin: 0.5000, pitchMax: 0.4751, pitchMin: 0.4675, minorMax: 0.4483, minorMin: 0.4387 },
    class3B: { majorMax: 0.0000, majorMin: 0.5000, pitchMax: 0.4725, pitchMin: 0.4675, minorMax: 0.4453, minorMin: 0.4387 },
    tapDrill75: "29/64\"", tapDrillDec75: 0.4531, tapDrill50: "15/32\"", tapDrillDec50: 0.4688,
    stiTapDrill: "35/64\"", stiTapDrillDec: 0.5469, stiInsertSize: "1/2-20×1D",
  },
  {
    size: "9/16-18", tpi: 18, basicMajorDia: 0.5625, basicPitchDia: 0.5264, basicMinorDia: 0.4943,
    class2A: { majorMax: 0.5625, majorMin: 0.5531, pitchMax: 0.5246, pitchMin: 0.5174, minorMax: 0.4903, minorMin: 0.4788 },
    class3A: { majorMax: 0.5625, majorMin: 0.5572, pitchMax: 0.5264, pitchMin: 0.5206, minorMax: 0.4943, minorMin: 0.4850 },
    class2B: { majorMax: 0.0000, majorMin: 0.5625, pitchMax: 0.5343, pitchMin: 0.5264, minorMax: 0.5047, minorMin: 0.4943 },
    class3B: { majorMax: 0.0000, majorMin: 0.5625, pitchMax: 0.5317, pitchMin: 0.5264, minorMax: 0.5016, minorMin: 0.4943 },
    tapDrill75: "33/64\"", tapDrillDec75: 0.5156, tapDrill50: "17/32\"", tapDrillDec50: 0.5312,
    stiTapDrill: "39/64\"", stiTapDrillDec: 0.6094, stiInsertSize: "9/16-18×1D",
  },
  {
    size: "3/4-16", tpi: 16, basicMajorDia: 0.7500, basicPitchDia: 0.7094, basicMinorDia: 0.6733,
    class2A: { majorMax: 0.7500, majorMin: 0.7399, pitchMax: 0.7074, pitchMin: 0.6994, minorMax: 0.6688, minorMin: 0.6562 },
    class3A: { majorMax: 0.7500, majorMin: 0.7444, pitchMax: 0.7094, pitchMin: 0.7030, minorMax: 0.6733, minorMin: 0.6630 },
    class2B: { majorMax: 0.0000, majorMin: 0.7500, pitchMax: 0.7182, pitchMin: 0.7094, minorMax: 0.6850, minorMin: 0.6733 },
    class3B: { majorMax: 0.0000, majorMin: 0.7500, pitchMax: 0.7151, pitchMin: 0.7094, minorMax: 0.6813, minorMin: 0.6733 },
    tapDrill75: "11/16\"", tapDrillDec75: 0.6875, tapDrill50: "45/64\"", tapDrillDec50: 0.7031,
    stiTapDrill: "53/64\"", stiTapDrillDec: 0.8281, stiInsertSize: "3/4-16×1D",
  },
];

// ── Metric Thread Data (ISO 261, Machinery's Handbook) ──

export const METRIC_THREAD_DATA: MetricThreadEntry[] = [
  {
    size: "M3×0.5", pitch: 0.5, basicMajorDia: 3.000, basicPitchDia: 2.675, basicMinorDia: 2.459,
    class6g: { majorMax: 2.980, majorMin: 2.874, pitchMax: 2.655, pitchMin: 2.580, minorMax: 2.419, minorMin: 2.307 },
    class4g6g: { majorMax: 2.980, majorMin: 2.894, pitchMax: 2.655, pitchMin: 2.603, minorMax: 2.419, minorMin: 2.341 },
    class6H: { majorMax: 3.000, majorMin: 3.000, pitchMax: 2.775, pitchMin: 2.675, minorMax: 2.599, minorMin: 2.459 },
    class4H5H: { majorMax: 3.000, majorMin: 3.000, pitchMax: 2.750, pitchMin: 2.675, minorMax: 2.559, minorMin: 2.459 },
    tapDrill75: "2.5mm", tapDrillDec75: 2.50, tapDrill50: "2.6mm", tapDrillDec50: 2.60,
    stiTapDrill: "3.4mm", stiTapDrillDec: 3.40, stiInsertSize: "M3×0.5×1D",
  },
  {
    size: "M4×0.7", pitch: 0.7, basicMajorDia: 4.000, basicPitchDia: 3.545, basicMinorDia: 3.242,
    class6g: { majorMax: 3.978, majorMin: 3.838, pitchMax: 3.523, pitchMin: 3.433, minorMax: 3.196, minorMin: 3.060 },
    class4g6g: { majorMax: 3.978, majorMin: 3.862, pitchMax: 3.523, pitchMin: 3.460, minorMax: 3.196, minorMin: 3.101 },
    class6H: { majorMax: 4.000, majorMin: 4.000, pitchMax: 3.663, pitchMin: 3.545, minorMax: 3.422, minorMin: 3.242 },
    class4H5H: { majorMax: 4.000, majorMin: 4.000, pitchMax: 3.631, pitchMin: 3.545, minorMax: 3.372, minorMin: 3.242 },
    tapDrill75: "3.3mm", tapDrillDec75: 3.30, tapDrill50: "3.5mm", tapDrillDec50: 3.50,
    stiTapDrill: "4.5mm", stiTapDrillDec: 4.50, stiInsertSize: "M4×0.7×1D",
  },
  {
    size: "M5×0.8", pitch: 0.8, basicMajorDia: 5.000, basicPitchDia: 4.480, basicMinorDia: 4.134,
    class6g: { majorMax: 4.976, majorMin: 4.826, pitchMax: 4.456, pitchMin: 4.361, minorMax: 4.084, minorMin: 3.938 },
    class4g6g: { majorMax: 4.976, majorMin: 4.852, pitchMax: 4.456, pitchMin: 4.390, minorMax: 4.084, minorMin: 3.983 },
    class6H: { majorMax: 5.000, majorMin: 5.000, pitchMax: 4.605, pitchMin: 4.480, minorMax: 4.334, minorMin: 4.134 },
    class4H5H: { majorMax: 5.000, majorMin: 5.000, pitchMax: 4.570, pitchMin: 4.480, minorMax: 4.279, minorMin: 4.134 },
    tapDrill75: "4.2mm", tapDrillDec75: 4.20, tapDrill50: "4.4mm", tapDrillDec50: 4.40,
    stiTapDrill: "5.6mm", stiTapDrillDec: 5.60, stiInsertSize: "M5×0.8×1D",
  },
  {
    size: "M6×1.0", pitch: 1.0, basicMajorDia: 6.000, basicPitchDia: 5.350, basicMinorDia: 4.917,
    class6g: { majorMax: 5.974, majorMin: 5.794, pitchMax: 5.324, pitchMin: 5.212, minorMax: 4.859, minorMin: 4.689 },
    class4g6g: { majorMax: 5.974, majorMin: 5.824, pitchMax: 5.324, pitchMin: 5.244, minorMax: 4.859, minorMin: 4.741 },
    class6H: { majorMax: 6.000, majorMin: 6.000, pitchMax: 5.500, pitchMin: 5.350, minorMax: 5.153, minorMin: 4.917 },
    class4H5H: { majorMax: 6.000, majorMin: 6.000, pitchMax: 5.458, pitchMin: 5.350, minorMax: 5.088, minorMin: 4.917 },
    tapDrill75: "5.0mm", tapDrillDec75: 5.00, tapDrill50: "5.2mm", tapDrillDec50: 5.20,
    stiTapDrill: "6.7mm", stiTapDrillDec: 6.70, stiInsertSize: "M6×1.0×1D",
  },
  {
    size: "M8×1.25", pitch: 1.25, basicMajorDia: 8.000, basicPitchDia: 7.188, basicMinorDia: 6.647,
    class6g: { majorMax: 7.972, majorMin: 7.760, pitchMax: 7.160, pitchMin: 7.028, minorMax: 6.581, minorMin: 6.386 },
    class4g6g: { majorMax: 7.972, majorMin: 7.794, pitchMax: 7.160, pitchMin: 7.065, minorMax: 6.581, minorMin: 6.446 },
    class6H: { majorMax: 8.000, majorMin: 8.000, pitchMax: 7.348, pitchMin: 7.188, minorMax: 6.912, minorMin: 6.647 },
    class4H5H: { majorMax: 8.000, majorMin: 8.000, pitchMax: 7.300, pitchMin: 7.188, minorMax: 6.838, minorMin: 6.647 },
    tapDrill75: "6.8mm", tapDrillDec75: 6.80, tapDrill50: "7.1mm", tapDrillDec50: 7.10,
    stiTapDrill: "9.0mm", stiTapDrillDec: 9.00, stiInsertSize: "M8×1.25×1D",
  },
  {
    size: "M10×1.5", pitch: 1.5, basicMajorDia: 10.000, basicPitchDia: 9.026, basicMinorDia: 8.376,
    class6g: { majorMax: 9.968, majorMin: 9.732, pitchMax: 8.994, pitchMin: 8.844, minorMax: 8.302, minorMin: 8.084 },
    class4g6g: { majorMax: 9.968, majorMin: 9.770, pitchMax: 8.994, pitchMin: 8.886, minorMax: 8.302, minorMin: 8.152 },
    class6H: { majorMax: 10.000, majorMin: 10.000, pitchMax: 9.206, pitchMin: 9.026, minorMax: 8.676, minorMin: 8.376 },
    class4H5H: { majorMax: 10.000, majorMin: 10.000, pitchMax: 9.150, pitchMin: 9.026, minorMax: 8.592, minorMin: 8.376 },
    tapDrill75: "8.5mm", tapDrillDec75: 8.50, tapDrill50: "8.8mm", tapDrillDec50: 8.80,
    stiTapDrill: "10.7mm", stiTapDrillDec: 10.70, stiInsertSize: "M10×1.5×1D",
  },
  {
    size: "M12×1.75", pitch: 1.75, basicMajorDia: 12.000, basicPitchDia: 10.863, basicMinorDia: 10.106,
    class6g: { majorMax: 11.966, majorMin: 11.701, pitchMax: 10.829, pitchMin: 10.661, minorMax: 10.024, minorMin: 9.782 },
    class4g6g: { majorMax: 11.966, majorMin: 11.743, pitchMax: 10.829, pitchMin: 10.708, minorMax: 10.024, minorMin: 9.858 },
    class6H: { majorMax: 12.000, majorMin: 12.000, pitchMax: 11.063, pitchMin: 10.863, minorMax: 10.441, minorMin: 10.106 },
    class4H5H: { majorMax: 12.000, majorMin: 12.000, pitchMax: 11.001, pitchMin: 10.863, minorMax: 10.347, minorMin: 10.106 },
    tapDrill75: "10.2mm", tapDrillDec75: 10.20, tapDrill50: "10.5mm", tapDrillDec50: 10.50,
    stiTapDrill: "12.8mm", stiTapDrillDec: 12.80, stiInsertSize: "M12×1.75×1D",
  },
  {
    size: "M14×2.0", pitch: 2.0, basicMajorDia: 14.000, basicPitchDia: 12.701, basicMinorDia: 11.835,
    class6g: { majorMax: 13.962, majorMin: 13.682, pitchMax: 12.663, pitchMin: 12.478, minorMax: 11.745, minorMin: 11.482 },
    class4g6g: { majorMax: 13.962, majorMin: 13.728, pitchMax: 12.663, pitchMin: 12.530, minorMax: 11.745, minorMin: 11.566 },
    class6H: { majorMax: 14.000, majorMin: 14.000, pitchMax: 12.921, pitchMin: 12.701, minorMax: 12.210, minorMin: 11.835 },
    class4H5H: { majorMax: 14.000, majorMin: 14.000, pitchMax: 12.854, pitchMin: 12.701, minorMax: 12.106, minorMin: 11.835 },
    tapDrill75: "12.0mm", tapDrillDec75: 12.00, tapDrill50: "12.5mm", tapDrillDec50: 12.50,
    stiTapDrill: "15.0mm", stiTapDrillDec: 15.00, stiInsertSize: "M14×2.0×1D",
  },
  {
    size: "M16×2.0", pitch: 2.0, basicMajorDia: 16.000, basicPitchDia: 14.701, basicMinorDia: 13.835,
    class6g: { majorMax: 15.962, majorMin: 15.682, pitchMax: 14.663, pitchMin: 14.478, minorMax: 13.745, minorMin: 13.482 },
    class4g6g: { majorMax: 15.962, majorMin: 15.728, pitchMax: 14.663, pitchMin: 14.530, minorMax: 13.745, minorMin: 13.566 },
    class6H: { majorMax: 16.000, majorMin: 16.000, pitchMax: 14.921, pitchMin: 14.701, minorMax: 14.210, minorMin: 13.835 },
    class4H5H: { majorMax: 16.000, majorMin: 16.000, pitchMax: 14.854, pitchMin: 14.701, minorMax: 14.106, minorMin: 13.835 },
    tapDrill75: "14.0mm", tapDrillDec75: 14.00, tapDrill50: "14.5mm", tapDrillDec50: 14.50,
    stiTapDrill: "17.0mm", stiTapDrillDec: 17.00, stiInsertSize: "M16×2.0×1D",
  },
  {
    size: "M20×2.5", pitch: 2.5, basicMajorDia: 20.000, basicPitchDia: 18.376, basicMinorDia: 17.294,
    class6g: { majorMax: 19.958, majorMin: 19.623, pitchMax: 18.334, pitchMin: 18.119, minorMax: 17.196, minorMin: 16.891 },
    class4g6g: { majorMax: 19.958, majorMin: 19.675, pitchMax: 18.334, pitchMin: 18.179, minorMax: 17.196, minorMin: 16.987 },
    class6H: { majorMax: 20.000, majorMin: 20.000, pitchMax: 18.626, pitchMin: 18.376, minorMax: 17.744, minorMin: 17.294 },
    class4H5H: { majorMax: 20.000, majorMin: 20.000, pitchMax: 18.550, pitchMin: 18.376, minorMax: 17.627, minorMin: 17.294 },
    tapDrill75: "17.5mm", tapDrillDec75: 17.50, tapDrill50: "18.0mm", tapDrillDec50: 18.00,
    stiTapDrill: "21.5mm", stiTapDrillDec: 21.50, stiInsertSize: "M20×2.5×1D",
  },
  {
    size: "M24×3.0", pitch: 3.0, basicMajorDia: 24.000, basicPitchDia: 22.051, basicMinorDia: 20.752,
    class6g: { majorMax: 23.952, majorMin: 23.577, pitchMax: 22.003, pitchMin: 21.760, minorMax: 20.644, minorMin: 20.297 },
    class4g6g: { majorMax: 23.952, majorMin: 23.635, pitchMax: 22.003, pitchMin: 21.828, minorMax: 20.644, minorMin: 20.404 },
    class6H: { majorMax: 24.000, majorMin: 24.000, pitchMax: 22.316, pitchMin: 22.051, minorMax: 21.252, minorMin: 20.752 },
    class4H5H: { majorMax: 24.000, majorMin: 24.000, pitchMax: 22.233, pitchMin: 22.051, minorMax: 21.121, minorMin: 20.752 },
    tapDrill75: "21.0mm", tapDrillDec75: 21.00, tapDrill50: "21.5mm", tapDrillDec50: 21.50,
    stiTapDrill: "25.5mm", stiTapDrillDec: 25.50, stiInsertSize: "M24×3.0×1D",
  },
];
