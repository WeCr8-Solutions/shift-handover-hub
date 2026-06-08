import ExcelJS from "exceljs";
import { INTAKE_COLUMNS, WORKSHEET_TITLES, type IntakeWorksheetKey } from "../intakeColumns";

/**
 * Render one intake worksheet as a single-sheet .xlsx file with header row
 * styled to match the master template (JobLine_Setup_Template.xlsx).
 */
export async function renderWorksheetXlsx(key: IntakeWorksheetKey, rowCount = 20): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "JobLine.ai Concierge";
  wb.created = new Date();
  const ws = wb.addWorksheet(WORKSHEET_TITLES[key].slice(0, 31));
  const cols = INTAKE_COLUMNS[key];
  ws.columns = cols.map((c) => ({ header: c, key: c, width: Math.max(14, c.length + 4) }));
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  for (let i = 0; i < rowCount; i++) ws.addRow({});
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
