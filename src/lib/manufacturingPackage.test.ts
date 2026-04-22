import { describe, expect, it } from "vitest";

import { evaluateManufacturingPackageReadiness } from "./manufacturingPackage";

describe("evaluateManufacturingPackageReadiness", () => {
  it("returns ready when a released package satisfies all blocking requirements", () => {
    const result = evaluateManufacturingPackageReadiness({
      packageStatus: "released",
      packageRevision: "B",
      assignedRevision: "B",
      documents: [
        { id: "doc-1", documentType: "drawing", status: "released" },
        { id: "doc-2", documentType: "setup_sheet", status: "released", routingStepId: "step-1" },
        { id: "doc-3", documentType: "inspection_plan", status: "released" },
      ],
      requirements: [
        { id: "req-1", requiredDocumentType: "drawing", requiredMinCount: 1, isBlocking: true },
        { id: "req-2", requiredDocumentType: "setup_sheet", requiredMinCount: 1, routingStepId: "step-1", isBlocking: true },
      ],
    });

    expect(result).toEqual({
      status: "ready",
      isReady: true,
      missingRequirements: [],
      draftDocumentTypes: [],
    });
  });

  it("returns missing_documents when a blocking required document type is absent", () => {
    const result = evaluateManufacturingPackageReadiness({
      packageStatus: "released",
      packageRevision: "A",
      assignedRevision: "A",
      documents: [{ id: "doc-1", documentType: "drawing", status: "released" }],
      requirements: [
        { id: "req-1", requiredDocumentType: "drawing", requiredMinCount: 1, isBlocking: true },
        { id: "req-2", requiredDocumentType: "inspection_plan", requiredMinCount: 1, isBlocking: true },
      ],
    });

    expect(result.status).toBe("missing_documents");
    expect(result.isReady).toBe(false);
    expect(result.missingRequirements).toEqual(["inspection_plan"]);
  });

  it("returns draft_documents_present when requirements are met but package is not fully released", () => {
    const result = evaluateManufacturingPackageReadiness({
      packageStatus: "in_review",
      packageRevision: "A",
      assignedRevision: "A",
      documents: [
        { id: "doc-1", documentType: "drawing", status: "released" },
        { id: "doc-2", documentType: "setup_sheet", status: "draft" },
      ],
      requirements: [{ id: "req-1", requiredDocumentType: "drawing", requiredMinCount: 1, isBlocking: true }],
    });

    expect(result).toEqual({
      status: "draft_documents_present",
      isReady: false,
      missingRequirements: [],
      draftDocumentTypes: ["setup_sheet"],
    });
  });

  it("returns mismatched_revision when the assigned revision differs from the package revision", () => {
    const result = evaluateManufacturingPackageReadiness({
      packageStatus: "released",
      packageRevision: "B",
      assignedRevision: "A",
      documents: [{ id: "doc-1", documentType: "drawing", status: "released" }],
      requirements: [],
    });

    expect(result.status).toBe("mismatched_revision");
    expect(result.isReady).toBe(false);
  });

  it("returns superseded_package when the package is no longer active", () => {
    const result = evaluateManufacturingPackageReadiness({
      packageStatus: "superseded",
      packageRevision: "A",
      assignedRevision: "A",
      documents: [{ id: "doc-1", documentType: "drawing", status: "released" }],
      requirements: [],
    });

    expect(result.status).toBe("superseded_package");
    expect(result.isReady).toBe(false);
  });
});