import { describe, expect, it } from "vitest";

import { evaluateLegacySetupSheetPackageReadiness } from "./legacyPackageReadiness";

describe("evaluateLegacySetupSheetPackageReadiness", () => {
  it("returns ready when a standard operation has a setup sheet", () => {
    const result = evaluateLegacySetupSheetPackageReadiness([
      {
        id: "sheet-1",
        routing_step_id: "step-1",
        queue_item_id: "queue-1",
        organization_id: "org-1",
        title: "Primary Setup",
        sheet_type: "setup_sheet",
        file_url: null,
        file_name: null,
        external_link: null,
        description: null,
        revision: "B",
        uploaded_by: null,
        uploaded_by_name: null,
        created_at: "2026-04-21T10:00:00.000Z",
        updated_at: "2026-04-21T10:00:00.000Z",
      },
    ]);

    expect(result.readiness.status).toBe("ready");
    expect(result.packageRevision).toBe("B");
    expect(result.requiredDocumentTypes).toEqual(["setup_sheet"]);
  });

  it("returns missing_documents when an inspection step lacks its inspection package docs", () => {
    const result = evaluateLegacySetupSheetPackageReadiness([
      {
        id: "sheet-1",
        routing_step_id: "step-1",
        queue_item_id: "queue-1",
        organization_id: "org-1",
        title: "Primary Setup",
        sheet_type: "setup_sheet",
        file_url: null,
        file_name: null,
        external_link: null,
        description: null,
        revision: "A",
        uploaded_by: null,
        uploaded_by_name: null,
        created_at: "2026-04-21T10:00:00.000Z",
        updated_at: "2026-04-21T10:00:00.000Z",
      },
    ], "inspection");

    expect(result.readiness.status).toBe("missing_documents");
    expect(result.readiness.missingRequirements).toEqual(["inspection_plan", "drawing"]);
  });

  it("returns mismatched_revision when legacy docs mix revisions", () => {
    const result = evaluateLegacySetupSheetPackageReadiness([
      {
        id: "sheet-1",
        routing_step_id: "step-1",
        queue_item_id: "queue-1",
        organization_id: "org-1",
        title: "Primary Setup",
        sheet_type: "setup_sheet",
        file_url: null,
        file_name: null,
        external_link: null,
        description: null,
        revision: "A",
        uploaded_by: null,
        uploaded_by_name: null,
        created_at: "2026-04-21T10:00:00.000Z",
        updated_at: "2026-04-21T10:00:00.000Z",
      },
      {
        id: "sheet-2",
        routing_step_id: "step-1",
        queue_item_id: "queue-1",
        organization_id: "org-1",
        title: "Engineering Drawing",
        sheet_type: "drawing",
        file_url: null,
        file_name: null,
        external_link: null,
        description: null,
        revision: "B",
        uploaded_by: null,
        uploaded_by_name: null,
        created_at: "2026-04-21T10:00:00.000Z",
        updated_at: "2026-04-21T10:00:00.000Z",
      },
    ], "engineering");

    expect(result.readiness.status).toBe("mismatched_revision");
    expect(result.packageRevision).toBe("A");
  });
});