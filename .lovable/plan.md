

## AI Capabilities Audit — To-Do List

### ✅ Completed Items

#### Phase 1 — Part Specs UI (All Done)
1. ✅ Part Specs fields in CreateWorkOrderDialog — material, dimensions, weight, shape
2. ✅ Part Specs display in QueueItemDetailDialog — shows material, shape, weight, dimensions
3. ✅ Part Catalog CRUD UI (PartCatalogManager in Settings)
4. ✅ Part Catalog auto-fill in CreateWorkOrderDialog

#### Phase 2 — AI Context Enhancements (All Done)
5. ✅ Station Queue Load — AI considers queued items and estimated hours per station
6. ✅ Operator Certifications — AI checks active operator certs vs work center requirements
7. ✅ Multi-Op Sequence Optimization — AI minimizes re-fixturing, considers setup time
8. ✅ Unit Conversion Rules — Part inches → machine mm with shown math
9. ✅ Active Downtime Awareness — AI queries active downtime_events, blocks routing to downed stations
10. ✅ Tolerance & Surface Finish — Added to queue_items + part_catalog, AI validates against machine typical_tolerance
11. ✅ Setup/Cycle/First Article Time — Routing steps now feed granular time data to AI for backlog calculations

---

### What's Working Now

| Feature | Status |
|---|---|
| AI Planning Assistant (streaming chat) | ✅ Working |
| Usage limits (daily tier caps) | ✅ Working |
| Machine Library (verified, $0.99) | ✅ Working |
| Manual Machine Entry (free) | ✅ Working |
| Part specs in work order creation | ✅ Working |
| Part specs in work order detail view | ✅ Working |
| Part catalog CRUD | ✅ Working |
| Part catalog auto-fill | ✅ Working |
| Tolerance & surface finish on parts | ✅ Working |
| AI: machine envelope validation | ✅ Working |
| AI: station load-aware routing | ✅ Working |
| AI: operator certification checks | ✅ Working |
| AI: downtime-aware routing | ✅ Working |
| AI: setup/cycle time awareness | ✅ Working |
| AI: tolerance/finish validation | ✅ Working |

---

### Future Enhancements (Backlog)

#### Work-Holding Constraints
Add vise/chuck capacity fields to machine profiles so the AI can validate whether a part can be physically held on a given machine.

#### Historical Performance Tracking
Track actual vs estimated cycle times per station/part combo to improve future AI time estimates.

#### Material State Tracking
Track pre/post heat-treat state on work orders so the AI knows if different tooling/speeds are needed.

#### Tooling Inventory Integration
Track available tooling per station so the AI can verify required cutters/inserts are available before routing.

#### AI Deep-Link Actions
Add clickable action buttons in AI chat responses to navigate directly to the referenced work order or station.
