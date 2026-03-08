# PRD 17: Operator & Manufacturing Tools

**Status**: ✅ Active  
**Last Updated**: 2026-03-08  
**Route**: `/tools`

---

## 1. Overview

The **Tools** area provides a curated set of small, standalone utility calculators and reference tools commonly needed by CNC operators, machinists, programmers, engineers, and supervisors on the manufacturing floor. These tools are available to all authenticated users and require no backend persistence — they are pure client-side computational components.

### Design Philosophy
- **Instant, zero-friction access** — no login wall for public tools; authenticated users get the full suite
- **Mobile-first** — operators use tablets and phones at the machine
- **Self-contained** — each tool is an independent component with no cross-dependencies
- **Easily extensible** — adding a new tool = one component file + one registry entry

---

## 2. Architecture

### File Structure
```
src/
├── pages/
│   └── Tools.tsx                    # Hub page with tool grid
├── components/
│   └── tools/
│       ├── index.ts                 # Barrel export + tool registry
│       ├── ToolCard.tsx             # Reusable card wrapper
│       ├── ToolLayout.tsx           # Shared layout with back nav
│       │
│       ├── SfmCalculator.tsx        # Speed & feed calculator
│       ├── TapDrillChart.tsx        # Tap drill size reference
│       ├── ToleranceCalculator.tsx  # Fits & tolerance stackup
│       ├── ThreadCalculator.tsx     # Thread pitch / TPI lookup
│       ├── MaterialRemovalRate.tsx  # MRR calculator
│       ├── CycleTimeEstimator.tsx   # Cycle time from params
│       ├── UnitConverter.tsx        # in↔mm, lb↔kg, etc.
│       ├── SurfaceFinishCalc.tsx    # Ra/Rz from feed & nose radius
│       ├── HardnessConverter.tsx    # HRC↔HRB↔BHN↔Vickers
│       └── TrigCalculator.tsx       # Right-triangle solver
```

### Tool Registry Pattern
```typescript
// components/tools/index.ts
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: 'machining' | 'measurement' | 'conversion' | 'reference';
  component: React.ComponentType;
  tags: string[];
}

export const TOOL_REGISTRY: ToolDefinition[] = [...]
```

### Component Contract
Every tool component:
1. Accepts no props (self-contained)
2. Uses only semantic design tokens
3. Stores no data to backend
4. Is wrapped in `ToolLayout` for consistent header/back nav
5. Uses standard form inputs from shadcn/ui
6. Performs all math inline with native JS `Math.*` — no external math libraries needed

---

## 3. Tool Specifications

### 3.1 SFM / Speed & Feed Calculator
**Category**: Machining  
**Purpose**: Calculate spindle RPM from cutting speed (SFM/m-min) and cutter diameter, or vice versa.

**Formulas**:
```
RPM = (SFM × 12) / (π × D)        [imperial]
RPM = (Vc × 1000) / (π × D)       [metric]
Feed Rate = RPM × FPT × Z          [IPM or mm/min]
```

**Inputs**: SFM or Vc, Cutter Diameter, Flutes, Feed per Tooth  
**Outputs**: RPM, Feed Rate (IPM), Chip Load verification  
**Presets**: Common materials (aluminum, steel, stainless, titanium) with recommended SFM ranges

---

### 3.2 Tap Drill Chart
**Category**: Reference  
**Purpose**: Look up recommended tap drill sizes for standard thread sizes.

**Data**: Static lookup table for:
- UNC (Unified National Coarse): #0-80 through 1"-8
- UNF (Unified National Fine): #0-80 through 1"-12
- Metric Coarse: M1.6 through M24
- Metric Fine: M8×1.0 through M24×1.5

**Inputs**: Thread type selector, thread size selector, desired thread percentage (50–100%)  
**Outputs**: Tap drill diameter (decimal & fractional), minor diameter, recommended tap drill letter/number

---

### 3.3 Tolerance Calculator
**Category**: Measurement  
**Purpose**: Calculate min/max dimensions from nominal + tolerance, bilateral tolerance stackup.

**Formulas**:
```
Max = Nominal + Upper Tolerance
Min = Nominal + Lower Tolerance  (lower tol is negative for bilateral)
Range = Max - Min
Midpoint = (Max + Min) / 2
```

**Features**:
- Toggle bilateral (±) vs unilateral tolerance
- Multi-row stackup: add multiple features, compute total tolerance band
- Pass/fail indicator with measured value input
- Color-coded: green (in-spec), amber (near limit), red (out-of-spec)

---

### 3.4 Thread Pitch Calculator
**Category**: Reference  
**Purpose**: Convert between TPI (threads per inch) and pitch (mm), lookup standard thread specs.

**Formulas**:
```
Pitch (mm) = 25.4 / TPI
TPI = 25.4 / Pitch (mm)
```

**Includes**: Major diameter, minor diameter, pitch diameter for common thread classes (2A, 2B, 3A, 3B)

---

### 3.5 Material Removal Rate (MRR)
**Category**: Machining  
**Purpose**: Calculate volumetric material removal rate for milling and turning.

**Formulas**:
```
MRR (milling) = WOC × DOC × Feed Rate     [in³/min or cm³/min]
MRR (turning) = DOC × Feed × SFM × 12     [in³/min]
```

**Inputs**: Width of Cut, Depth of Cut, Feed Rate (or compute from RPM × FPT × Z)  
**Outputs**: MRR, estimated machining time for given volume

---

### 3.6 Cycle Time Estimator
**Category**: Machining  
**Purpose**: Estimate total cycle time from setup, rapid moves, and cutting passes.

**Inputs**: Number of passes, cut length, feed rate, rapid traverse rate, tool change count, tool change time  
**Outputs**: Cutting time, rapid time, tool change time, total cycle time  
**Bonus**: Parts-per-hour calculation

---

### 3.7 Unit Converter
**Category**: Conversion  
**Purpose**: Quick conversion between common manufacturing units.

**Conversions**:
| Category | Units |
|----------|-------|
| Length | in ↔ mm ↔ cm ↔ m ↔ ft |
| Weight | lb ↔ kg ↔ oz ↔ g |
| Pressure | PSI ↔ bar ↔ MPa ↔ kPa |
| Temperature | °F ↔ °C ↔ K |
| Torque | ft-lb ↔ N·m ↔ in-lb |
| Speed | SFM ↔ m/min ↔ ft/s ↔ m/s |

---

### 3.8 Surface Finish Calculator
**Category**: Measurement  
**Purpose**: Theoretical surface finish from feed rate and tool nose radius.

**Formula**:
```
Ra (μin) = (Feed² × 1000000) / (32 × Nose Radius)   [imperial, both in inches]
Ra (μm) = (f² × 1000) / (32 × r)                     [metric, both in mm]
```

**Inputs**: Feed per revolution, nose radius  
**Outputs**: Theoretical Ra, Rz estimate (≈ 4 × Ra), comparison to common finish specs (e.g., 32μin, 16μin, 8μin)

---

### 3.9 Hardness Converter
**Category**: Conversion  
**Purpose**: Convert between hardness scales using ASTM E140 approximation tables.

**Scales**: HRC, HRB, HRA, Brinell (BHN), Vickers (HV), Tensile Strength (ksi approx)  
**Method**: Piecewise linear interpolation from standard conversion tables  
**Input**: Enter any one value → see all equivalent values

---

### 3.10 Right Triangle / Trig Calculator
**Category**: Measurement  
**Purpose**: Solve right triangles — critical for setting angles, calculating bolt hole patterns, and fixture layout.

**Inputs** (any 2 of): Side A, Side B, Hypotenuse, Angle α, Angle β  
**Outputs**: All remaining sides and angles  
**Formulas**: Standard trigonometric identities (`Math.sin`, `Math.cos`, `Math.atan2`, `Math.sqrt`)  
**Visual**: SVG triangle diagram that updates in real-time

---

## 4. Hub Page Design

### Layout
- **Header**: "Operator Tools" with search/filter bar
- **Category Tabs**: All | Machining | Measurement | Conversion | Reference
- **Grid**: 2-col mobile, 3-col tablet, 4-col desktop
- **Cards**: Icon, tool name, 1-line description, category badge

### Search
Client-side filtering on `name`, `description`, and `tags` fields from the registry.

---

## 5. Access Control

| Role | Access Level |
|------|-------------|
| Public (unauthenticated) | Unit Converter, Trig Calculator only |
| Authenticated (any role) | All tools |
| No special permissions needed | — |

---

## 6. Future Expansion Ideas

- **G-Code Quick Reference** (already exists at `/resources/gcode` — link to it)
- **Bolt Circle Calculator** — evenly-spaced holes on a diameter
- **Coolant Ratio Calculator** — refractometer reading to mix ratio
- **Drill Point Length Calculator** — from drill diameter and point angle
- **Thermal Expansion Calculator** — length change from ΔT
- **Wire EDM Offset Calculator** — from wire diameter and overburn
- **Press Fit / Interference Calculator** — shaft/hole tolerance classes

---

## 7. Technical Notes

- All math uses native `Math.*` — no external math library required
- `date-fns` already installed for any time-related formatting
- Components use shadcn `Input`, `Select`, `Card`, `Badge`, `Tabs`
- No database tables needed — all client-side
- Tools are lazy-loadable for performance (each is a standalone chunk)
