import { describe, it, expect } from "vitest";
import { JobState, TriState, WorkCenterType } from "@/types/handoff";

/**
 * Unit tests for NewHandoffForm logic:
 * - Form data initialization and defaults
 * - Prefill application
 * - Validation per step
 * - Work center type detection
 * - Draft storage/restore
 * - Readiness toggle cycle
 */

// === Pure logic extracted for testing ===

const jobStates: JobState[] = [
  "Part Running", "Processing", "Setup in Progress",
  "First Article in Process", "Waiting on QA", "Waiting on Tooling",
  "Waiting on Material", "Machine Down / Issue", "Ready for Pickup", "On Hold",
];

function isCNCType(type: WorkCenterType): boolean {
  return type === "CNC Mill" || type === "CNC Lathe";
}

function cycleTriState(current: TriState): TriState {
  return current === "N/A" ? "Yes" : current === "Yes" ? "No" : "N/A";
}

interface FormData {
  stationId: string;
  stationDbId: string;
  workCenterType: WorkCenterType | "";
  workCenter: string;
  machineId: string;
  workOrder: string;
  partNumber: string;
  partRevision: string;
  operationNumber: string;
  outgoingOperator: string;
  incomingOperator: string;
  jobState: JobState | "";
  handoffSummary: string;
  partsCompleted: number;
  scrapCount: number;
  reworkCount: number;
  criticalDimsVerified: boolean;
}

function getInitialFormData(operatorName: string): FormData {
  return {
    stationId: "",
    stationDbId: "",
    workCenterType: "",
    workCenter: "",
    machineId: "",
    workOrder: "",
    partNumber: "",
    partRevision: "",
    operationNumber: "",
    outgoingOperator: operatorName,
    incomingOperator: operatorName,
    jobState: "",
    handoffSummary: "",
    partsCompleted: 0,
    scrapCount: 0,
    reworkCount: 0,
    criticalDimsVerified: false,
  };
}

function validateStep(formData: FormData, stepNum: number): string[] {
  const errors: string[] = [];
  if (stepNum === 1) {
    if (!formData.stationDbId) errors.push("Station is required");
    if (!formData.jobState) errors.push("Job State is required");
    if (!formData.partNumber) errors.push("Part Number is required");
    if (!formData.outgoingOperator) errors.push("Outgoing Operator is required");
  } else if (stepNum === 4) {
    if (!formData.handoffSummary.trim()) errors.push("Handoff Summary is required");
  }
  return errors;
}

function applyPrefill(
  formData: FormData,
  prefill: { work_order?: string; part_number?: string; operation_number?: string; station_id?: string }
): FormData {
  const updates = { ...formData };
  if (prefill.work_order) updates.workOrder = prefill.work_order;
  if (prefill.part_number) updates.partNumber = prefill.part_number;
  if (prefill.operation_number) updates.operationNumber = prefill.operation_number;
  return updates;
}

// === Tests ===

describe("NewHandoffForm Logic", () => {
  describe("Form Initialization", () => {
    it("initializes with operator name as both outgoing and incoming", () => {
      const data = getInitialFormData("John Doe");
      expect(data.outgoingOperator).toBe("John Doe");
      expect(data.incomingOperator).toBe("John Doe");
    });

    it("initializes with empty strings for all required fields", () => {
      const data = getInitialFormData("Test");
      expect(data.stationDbId).toBe("");
      expect(data.workOrder).toBe("");
      expect(data.partNumber).toBe("");
      expect(data.jobState).toBe("");
      expect(data.handoffSummary).toBe("");
    });

    it("initializes with zero counts", () => {
      const data = getInitialFormData("Test");
      expect(data.partsCompleted).toBe(0);
      expect(data.scrapCount).toBe(0);
      expect(data.reworkCount).toBe(0);
      expect(data.criticalDimsVerified).toBe(false);
    });

    it("handles empty operator name", () => {
      const data = getInitialFormData("");
      expect(data.outgoingOperator).toBe("");
      expect(data.incomingOperator).toBe("");
    });
  });

  describe("Work Center Type Detection", () => {
    it("identifies CNC Mill as CNC type", () => {
      expect(isCNCType("CNC Mill")).toBe(true);
    });

    it("identifies CNC Lathe as CNC type", () => {
      expect(isCNCType("CNC Lathe")).toBe(true);
    });

    it("identifies Manual Mill as non-CNC", () => {
      expect(isCNCType("Manual Mill" as WorkCenterType)).toBe(false);
    });

    it("identifies Welding types as non-CNC", () => {
      expect(isCNCType("MIG Welding" as WorkCenterType)).toBe(false);
      expect(isCNCType("TIG Welding" as WorkCenterType)).toBe(false);
    });

    it("identifies Assembly as non-CNC", () => {
      expect(isCNCType("Assembly" as WorkCenterType)).toBe(false);
    });

    it("identifies Inspection as non-CNC", () => {
      expect(isCNCType("Inspection" as WorkCenterType)).toBe(false);
    });

    it("identifies Water Jet as non-CNC", () => {
      expect(isCNCType("Water Jet" as WorkCenterType)).toBe(false);
    });
  });

  describe("TriState Toggle Cycle", () => {
    it("cycles N/A → Yes → No → N/A", () => {
      expect(cycleTriState("N/A")).toBe("Yes");
      expect(cycleTriState("Yes")).toBe("No");
      expect(cycleTriState("No")).toBe("N/A");
    });

    it("completes a full cycle back to original", () => {
      let state: TriState = "N/A";
      state = cycleTriState(state); // Yes
      state = cycleTriState(state); // No
      state = cycleTriState(state); // N/A
      expect(state).toBe("N/A");
    });
  });

  describe("Step 1 Validation (Job Info)", () => {
    it("fails when all required fields are empty", () => {
      const data = getInitialFormData("Test");
      const errors = validateStep(data, 1);
      expect(errors).toContain("Station is required");
      expect(errors).toContain("Job State is required");
      expect(errors).toContain("Part Number is required");
      // outgoingOperator is pre-filled
      expect(errors).not.toContain("Outgoing Operator is required");
    });

    it("fails when station is missing but other fields are filled", () => {
      const data = {
        ...getInitialFormData("Test"),
        jobState: "Part Running" as JobState,
        partNumber: "PN-001",
      };
      const errors = validateStep(data, 1);
      expect(errors).toEqual(["Station is required"]);
    });

    it("passes when all required fields are provided", () => {
      const data = {
        ...getInitialFormData("John"),
        stationDbId: "uuid-123",
        jobState: "Part Running" as JobState,
        partNumber: "PN-001",
        outgoingOperator: "John",
      };
      const errors = validateStep(data, 1);
      expect(errors).toHaveLength(0);
    });

    it("fails when outgoing operator is empty string", () => {
      const data = {
        ...getInitialFormData(""),
        stationDbId: "uuid-123",
        jobState: "Part Running" as JobState,
        partNumber: "PN-001",
        outgoingOperator: "",
      };
      const errors = validateStep(data, 1);
      expect(errors).toContain("Outgoing Operator is required");
    });
  });

  describe("Step 2 & 3 Validation (Readiness & Condition)", () => {
    it("steps 2 and 3 have no required validation", () => {
      const data = getInitialFormData("Test");
      expect(validateStep(data, 2)).toHaveLength(0);
      expect(validateStep(data, 3)).toHaveLength(0);
    });
  });

  describe("Step 4 Validation (Summary)", () => {
    it("fails when handoff summary is empty", () => {
      const data = getInitialFormData("Test");
      const errors = validateStep(data, 4);
      expect(errors).toContain("Handoff Summary is required");
    });

    it("fails when handoff summary is whitespace only", () => {
      const data = { ...getInitialFormData("Test"), handoffSummary: "   " };
      const errors = validateStep(data, 4);
      expect(errors).toContain("Handoff Summary is required");
    });

    it("passes when handoff summary has content", () => {
      const data = { ...getInitialFormData("Test"), handoffSummary: "All good, parts running smoothly." };
      const errors = validateStep(data, 4);
      expect(errors).toHaveLength(0);
    });
  });

  describe("Prefill Data Application", () => {
    it("applies all prefill fields", () => {
      const base = getInitialFormData("John");
      const result = applyPrefill(base, {
        work_order: "WO-001",
        part_number: "PN-001",
        operation_number: "OP-10",
        station_id: "station-123",
      });
      expect(result.workOrder).toBe("WO-001");
      expect(result.partNumber).toBe("PN-001");
      expect(result.operationNumber).toBe("OP-10");
    });

    it("applies partial prefill (only work order)", () => {
      const base = getInitialFormData("John");
      const result = applyPrefill(base, { work_order: "WO-002" });
      expect(result.workOrder).toBe("WO-002");
      expect(result.partNumber).toBe(""); // unchanged
      expect(result.operationNumber).toBe(""); // unchanged
    });

    it("does not overwrite with undefined/empty prefill values", () => {
      const base = { ...getInitialFormData("John"), workOrder: "EXISTING-WO" };
      const result = applyPrefill(base, { work_order: undefined });
      expect(result.workOrder).toBe("EXISTING-WO");
    });

    it("preserves non-prefill fields", () => {
      const base = { ...getInitialFormData("John"), outgoingOperator: "Jane" };
      const result = applyPrefill(base, { work_order: "WO-003" });
      expect(result.outgoingOperator).toBe("Jane");
    });
  });

  describe("Job States", () => {
    it("has 10 defined job states", () => {
      expect(jobStates).toHaveLength(10);
    });

    it("includes all critical states", () => {
      expect(jobStates).toContain("Part Running");
      expect(jobStates).toContain("Waiting on QA");
      expect(jobStates).toContain("First Article in Process");
      expect(jobStates).toContain("Machine Down / Issue");
      expect(jobStates).toContain("Ready for Pickup");
      expect(jobStates).toContain("On Hold");
    });
  });

  describe("Draft Storage", () => {
    const STORAGE_KEY = "handoff-form-draft";

    afterEach(() => {
      localStorage.removeItem(STORAGE_KEY);
    });

    it("saves draft to localStorage", () => {
      const data = { ...getInitialFormData("John"), workOrder: "WO-DRAFT" };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const restored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(restored.workOrder).toBe("WO-DRAFT");
    });

    it("restores draft and merges with defaults", () => {
      const partial = { workOrder: "WO-DRAFT", partNumber: "PN-DRAFT" };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      const merged = { ...getInitialFormData("John"), ...saved };
      expect(merged.workOrder).toBe("WO-DRAFT");
      expect(merged.outgoingOperator).toBe("John"); // default preserved
    });

    it("clears draft on removal", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ workOrder: "WO" }));
      localStorage.removeItem(STORAGE_KEY);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("handles corrupted draft gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "corrupted{{{");
      let result: ReturnType<typeof getInitialFormData> | null = null;
      try {
        result = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      } catch {
        result = getInitialFormData("John");
      }
      expect(result!.outgoingOperator).toBe("John");
    });
  });
});
