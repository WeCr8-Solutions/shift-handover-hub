import { describe, expect, it } from "vitest";

import { groupSetupSheetsForPackageView } from "./setupSheetPackages";

describe("groupSetupSheetsForPackageView", () => {
  it("groups documents by type and revision for package-style rendering", () => {
    const groups = groupSetupSheetsForPackageView([
      {
        id: "sheet-1",
        title: "Main Setup",
        sheet_type: "setup_sheet",
        revision: "B",
        created_at: "2026-04-21T10:00:00.000Z",
      },
      {
        id: "sheet-2",
        title: "Fixture Notes",
        sheet_type: "setup_sheet",
        revision: "B",
        created_at: "2026-04-21T12:00:00.000Z",
      },
      {
        id: "sheet-3",
        title: "Inspection Plan",
        sheet_type: "inspection_plan",
        revision: "A",
        created_at: "2026-04-21T11:00:00.000Z",
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      sheetType: "inspection_plan",
      revision: "A",
      count: 1,
    });
    expect(groups[1]).toMatchObject({
      sheetType: "setup_sheet",
      revision: "B",
      count: 2,
    });
    expect(groups[1].items.map((item) => item.id)).toEqual(["sheet-2", "sheet-1"]);
  });

  it("treats blank revisions as unversioned and keeps them grouped together", () => {
    const groups = groupSetupSheetsForPackageView([
      {
        id: "sheet-1",
        title: "Program Notes",
        sheet_type: "instruction_set",
        revision: "",
        created_at: "2026-04-21T10:00:00.000Z",
      },
      {
        id: "sheet-2",
        title: "Operator Notes",
        sheet_type: "instruction_set",
        revision: null,
        created_at: "2026-04-21T11:00:00.000Z",
      },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      sheetType: "instruction_set",
      revision: null,
      count: 2,
    });
  });
});