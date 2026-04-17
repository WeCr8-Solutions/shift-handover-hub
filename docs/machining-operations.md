# Machining Operations Catalog

Shared catalog of cutting/forming operations used by both **GCA** and **OAP** programs. Built on the same canonical-vs-org pattern as `inspection_tools` and the polymorphic `training_media` layer.

---

## 1. Checklist

### Phase 1 — Schema & Seed
- [x] `machining_operation_categories` (canonical + org-owned)
- [x] `machining_operations` with `profession_tags`, `role_tags`, `machine_tags`, `typical_tooling`, `difficulty`, `common_pitfalls`, `safety_notes`
- [x] `org_machining_operation_overrides` (hide / re-spec / role-required per employer)
- [x] RLS: authed read of canonical + own-org; writes scoped to org admin/supervisor; canonical to platform admin
- [x] Extend `training_media_entity` enum with `machining_operation` and `machining_operation_category`
- [x] Seed 8 canonical categories
- [x] Seed ~50 canonical operations across milling, turning, drilling/hole-making, grinding, EDM, gear/thread, finishing/deburr, specialty

### Phase 2 — Hook & Renderer
- [x] `useMachiningOperations({ professionTag, roleTag, machineTag, categorySlug })`
- [x] Reuse `<TrainingMedia entityType="machining_operation" entityId={op.id} />`
- [x] Reuse `<TrainingMediaUploader entityType="machining_operation" />`

### Phase 3 — Admin Panel
- [x] `<MachiningOperationsCatalog>` in Training Library tab
- [x] Filters: search, category, profession, role, machine
- [x] Per-operation drill-in dialog with spec + media gallery + uploader
- [ ] Org-override UI (hide / required-for-roles)
- [ ] Bulk-tag UI

### Phase 4 — Learner-Facing Rendering
- [ ] GCA test screens render media for `machining_operation` references
- [ ] OAP lessons can attach a `machining_operation` reference and render its media inline
- [ ] OAP walkthrough items can reference a machining operation as a check-off subject

---

## 2. Categories seeded

| Slug | Name |
|---|---|
| `milling` | Milling |
| `turning` | Turning |
| `drilling-hole-making` | Drilling & Hole-Making |
| `grinding` | Grinding |
| `edm` | EDM |
| `gear-thread` | Gear & Thread Generation |
| `finishing-deburr` | Finishing & Deburring |
| `specialty` | Specialty |

## 3. Canonical operations seeded (50+)

**Milling** — Face Milling, Contouring (2D/3D), Pocketing, Slotting, Helical Interpolation, Ramp Entry, 3D Surfacing, 5-Axis Positional (3+2), 5-Axis Simultaneous, Engraving, Chamfer/Deburr.

**Turning** — OD Turning, Facing, ID Boring, OD Grooving, ID Grooving, Parting/Cut-Off, Single-Point Threading, Taper Turning, Knurling, Live Tooling on Lathe, Swiss-Type Turning.

**Drilling & Hole-Making** — Spot Drilling, Standard Drilling (G81), Peck Drilling (G83), Reaming, Rigid Tapping (G84), Form Tapping, Thread Milling, Counterboring, Countersinking, Deep Hole / Gun Drilling, Precision Boring.

**Grinding** — Surface, OD Cylindrical, ID Cylindrical, Centerless, Jig Grinding.

**EDM** — Wire, Sinker (Ram), Small-Hole.

**Gear & Thread** — Gear Hobbing, Gear Shaping, Broaching.

**Finishing & Deburring** — Manual Deburr, Vibratory/Tumble, Bead/Sand Blasting, Polishing/Buffing, Lapping, Honing.

**Specialty** — Waterjet, Laser Cutting, Additive (DMLS/SLM).

---

## 4. Tag taxonomy

- **profession_tags**: `machinist`, `programmer`, `toolmaker`, `grinder`, `edm`, `gear-cutter`, `finisher`, `assembler`, `waterjet-op`, `laser-op`, `additive`
- **role_tags**: `operator`, `supervisor`, `programmer`
- **machine_tags**: `vmc`, `hmc`, `5-axis`, `lathe`, `swiss`, `mill-turn`, `live-tool-lathe`, `surface-grinder`, `cylindrical-grinder`, `id-grinder`, `centerless-grinder`, `jig-grinder`, `wire-edm`, `ram-edm`, `hole-popper`, `hobbing-machine`, `gear-shaper`, `broach`, `tumbler`, `vibratory-bowl`, `blast-cabinet`, `polishing-wheel`, `lapping-plate`, `honing-machine`, `waterjet`, `fiber-laser`, `co2-laser`, `dmls`, `slm`, `gun-drill`, `bench`

Employers can extend any of these via org-owned operations.

---

## 5. Media usage

```tsx
import { TrainingMedia } from "@/components/training/TrainingMedia";
import { TrainingMediaUploader } from "@/components/training/TrainingMediaUploader";

<TrainingMedia entityType="machining_operation" entityId={op.id} />
<TrainingMediaUploader
  entityType="machining_operation"
  entityId={op.id}
  defaultProgram="oap"
  allowCanonical={isPlatformAdmin}
/>
```

Same buckets, MIME validation, and signed-URL minting as the inspection tool layer.

---

## 6. Access matrix

| Action | Operator | Supervisor | Org Admin | Platform Admin |
|---|:-:|:-:|:-:|:-:|
| Read canonical operations | ✅ | ✅ | ✅ | ✅ |
| Read own-org operations / overrides | ✅ | ✅ | ✅ | ✅ |
| Create / edit own-org operations | ❌ | ✅ | ✅ | ✅ |
| Create / edit canonical operations | ❌ | ❌ | ❌ | ✅ |
| Upload media to own-org operation | ❌ | ✅ | ✅ | ✅ |
| Upload canonical Jobline media | ❌ | ❌ | ❌ | ✅ |
