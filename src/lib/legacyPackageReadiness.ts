import {
  evaluateManufacturingPackageReadiness,
  type ManufacturingPackageReadiness,
  type ManufacturingPackageRequirement,
} from "./manufacturingPackage";
import type { SetupSheet } from "@/hooks/useSetupSheets";

const INSPECTION_OPERATION_TYPES = new Set([
  "inspection",
  "quality",
  "quality_inspection",
  "first_article",
  "first_article_inspection",
  "final_inspection",
]);

const ENGINEERING_OPERATION_TYPES = new Set([
  "engineering",
  "programming",
  "setup",
]);

export interface LegacyPackageReadinessSummary {
  readiness: ManufacturingPackageReadiness;
  packageRevision: string | null;
  requiredDocumentTypes: string[];
}

function buildLegacyRequirements(operationType?: string | null): ManufacturingPackageRequirement[] {
  const normalizedOperationType = operationType?.trim().toLowerCase() || "";
  const requirements: ManufacturingPackageRequirement[] = [
    {
      id: "req-setup-sheet",
      requiredDocumentType: "setup_sheet",
      requiredMinCount: 1,
      isBlocking: true,
    },
  ];

  if (ENGINEERING_OPERATION_TYPES.has(normalizedOperationType)) {
    requirements.push(
      {
        id: "req-drawing",
        requiredDocumentType: "drawing",
        requiredMinCount: 1,
        isBlocking: true,
      },
      {
        id: "req-instruction-set",
        requiredDocumentType: "instruction_set",
        requiredMinCount: 1,
        isBlocking: true,
      },
    );
  }

  if (INSPECTION_OPERATION_TYPES.has(normalizedOperationType)) {
    requirements.push(
      {
        id: "req-inspection-plan",
        requiredDocumentType: "inspection_plan",
        requiredMinCount: 1,
        isBlocking: true,
      },
      {
        id: "req-drawing-inspection",
        requiredDocumentType: "drawing",
        requiredMinCount: 1,
        isBlocking: true,
      },
    );
  }

  return requirements;
}

export function evaluateLegacySetupSheetPackageReadiness(
  sheets: SetupSheet[],
  operationType?: string | null,
): LegacyPackageReadinessSummary {
  const revisions = Array.from(
    new Set(
      sheets
        .map((sheet) => sheet.revision?.trim())
        .filter((revision): revision is string => Boolean(revision)),
    ),
  );

  const packageRevision = revisions.length === 1 ? revisions[0] : revisions[0] ?? null;
  const assignedRevision = revisions.length <= 1 ? packageRevision : "mixed";
  const requirements = buildLegacyRequirements(operationType);
  const readiness = evaluateManufacturingPackageReadiness({
    packageStatus: "released",
    packageRevision,
    assignedRevision,
    documents: sheets.map((sheet) => ({
      id: sheet.id,
      documentType: sheet.sheet_type,
      status: "released" as const,
    })),
    requirements,
  });

  return {
    readiness,
    packageRevision,
    requiredDocumentTypes: requirements.map((requirement) => requirement.requiredDocumentType),
  };
}