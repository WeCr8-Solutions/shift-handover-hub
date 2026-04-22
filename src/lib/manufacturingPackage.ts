export type ManufacturingPackageStatus =
  | "draft"
  | "in_review"
  | "released"
  | "superseded"
  | "archived";

export type ManufacturingPackageDocumentStatus = "draft" | "released" | "obsolete";

export interface ManufacturingPackageDocument {
  id: string;
  documentType: string;
  status: ManufacturingPackageDocumentStatus;
  routingStepId?: string | null;
  operationType?: string | null;
}

export interface ManufacturingPackageRequirement {
  id: string;
  requiredDocumentType: string;
  requiredMinCount: number;
  routingStepId?: string | null;
  operationType?: string | null;
  isBlocking: boolean;
}

export interface ManufacturingPackageReadinessInput {
  packageStatus: ManufacturingPackageStatus;
  packageRevision?: string | null;
  assignedRevision?: string | null;
  documents: ManufacturingPackageDocument[];
  requirements: ManufacturingPackageRequirement[];
}

export type ManufacturingPackageReadinessStatus =
  | "ready"
  | "missing_documents"
  | "draft_documents_present"
  | "mismatched_revision"
  | "superseded_package";

export interface ManufacturingPackageReadiness {
  status: ManufacturingPackageReadinessStatus;
  isReady: boolean;
  missingRequirements: string[];
  draftDocumentTypes: string[];
}

function matchesScope(
  document: ManufacturingPackageDocument,
  requirement: ManufacturingPackageRequirement,
) {
  const routingMatches = !requirement.routingStepId || requirement.routingStepId === document.routingStepId;
  const operationMatches = !requirement.operationType || requirement.operationType === document.operationType;
  return routingMatches && operationMatches;
}

export function evaluateManufacturingPackageReadiness(
  input: ManufacturingPackageReadinessInput,
): ManufacturingPackageReadiness {
  if (input.packageStatus === "superseded" || input.packageStatus === "archived") {
    return {
      status: "superseded_package",
      isReady: false,
      missingRequirements: [],
      draftDocumentTypes: [],
    };
  }

  if (
    input.packageRevision &&
    input.assignedRevision &&
    input.packageRevision !== input.assignedRevision
  ) {
    return {
      status: "mismatched_revision",
      isReady: false,
      missingRequirements: [],
      draftDocumentTypes: [],
    };
  }

  const blockingRequirements = input.requirements.filter((requirement) => requirement.isBlocking);
  const missingRequirements = blockingRequirements
    .filter((requirement) => {
      const releasedCount = input.documents.filter(
        (document) =>
          document.documentType === requirement.requiredDocumentType &&
          document.status === "released" &&
          matchesScope(document, requirement),
      ).length;

      return releasedCount < requirement.requiredMinCount;
    })
    .map((requirement) => requirement.requiredDocumentType);

  if (missingRequirements.length > 0) {
    return {
      status: "missing_documents",
      isReady: false,
      missingRequirements,
      draftDocumentTypes: [],
    };
  }

  const draftDocumentTypes = Array.from(
    new Set(
      input.documents
        .filter((document) => document.status === "draft")
        .map((document) => document.documentType),
    ),
  );

  if (draftDocumentTypes.length > 0 || input.packageStatus !== "released") {
    return {
      status: "draft_documents_present",
      isReady: false,
      missingRequirements: [],
      draftDocumentTypes,
    };
  }

  return {
    status: "ready",
    isReady: true,
    missingRequirements: [],
    draftDocumentTypes: [],
  };
}