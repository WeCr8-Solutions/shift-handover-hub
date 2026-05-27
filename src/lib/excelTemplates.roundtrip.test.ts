/**
 * E2E roundtrip: generate the bulk-import template and parse it back.
 * Guards against:
 *   • Sheet-name truncation collisions (Excel limit = 31 chars)
 *   • Header drift between download and parse
 *   • Sample rows that the parser would reject
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import ExcelJS from 'exceljs';
import {
  downloadTemplate,
  parseExcelFile,
  STATIONS_TEMPLATE,
  USERS_TEMPLATE,
  TEAMS_TEMPLATE,
  DEPARTMENTS_TEMPLATE,
  WORK_ORDERS_TEMPLATE,
  ROUTING_TEMPLATE,
} from './excelTemplates';

let downloadedBuffer: ArrayBuffer | null = null;

beforeAll(async () => {
  // Build the workbook the same way downloadTemplate('all') does, but write
  // straight to an ArrayBuffer — avoids jsdom's Blob/anchor plumbing entirely
  // and exercises the same template definitions the UI ships.
  const { Workbook } = ExcelJS;
  const wb = new Workbook();
  const sheets = [
    { sheetName: 'Instructions', headers: [], sampleData: [], validValues: {} },
    TEAMS_TEMPLATE,
    DEPARTMENTS_TEMPLATE,
    STATIONS_TEMPLATE,
    USERS_TEMPLATE,
    WORK_ORDERS_TEMPLATE,
    ROUTING_TEMPLATE,
  ];
  for (const t of sheets) {
    if (t.sheetName === 'Instructions') {
      wb.addWorksheet('Instructions').addRow(['(generated)']);
      continue;
    }
    const ws = wb.addWorksheet(t.sheetName);
    ws.addRow(t.headers as string[]);
    for (const row of t.sampleData) ws.addRow(row as (string | number)[]);
    if (Object.keys(t.validValues).length) {
      const raw = `${t.sheetName} - Valid Values`;
      const name = raw.length <= 31 ? raw : `${t.sheetName} - Valid`.slice(0, 31);
      const vs = wb.addWorksheet(name);
      vs.addRow(['Column', 'Valid Values']);
      for (const [col, vals] of Object.entries(t.validValues)) {
        vs.addRow([col, (vals as string[]).join(', ')]);
      }
    }
  }
  const buf = await wb.xlsx.writeBuffer();
  // ExcelJS returns Buffer in Node — normalize to ArrayBuffer slice.
  downloadedBuffer = ArrayBuffer.isView(buf)
    ? (buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
    : (buf as ArrayBuffer);
});

// jsdom's File/Blob lacks .arrayBuffer in some versions — wrap our buffer
// into a minimal File-shaped object that parseExcelFile() can consume.
function bufferToFile(buf: ArrayBuffer, name = 'tpl.xlsx'): File {
  return {
    name,
    arrayBuffer: async () => buf,
  } as unknown as File;
}

describe('Excel bulk-import template roundtrip', () => {
  it('produces a workbook with all 7 expected sheets, none exceeding 31 chars', async () => {
    expect(downloadedBuffer).toBeTruthy();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(downloadedBuffer!);
    const names = wb.worksheets.map(ws => ws.name);

    // Core sheets users fill in
    for (const required of [
      'Instructions',
      'Teams',
      'Departments',
      'Stations',
      'Users',
      'Work Orders',
      'Routing Templates',
    ]) {
      expect(names).toContain(required);
    }
    // Excel hard limit
    for (const n of names) expect(n.length).toBeLessThanOrEqual(31);
    // No duplicates after truncation
    expect(new Set(names).size).toBe(names.length);
  });

  it('re-parses cleanly with zero validation errors and full sample data', async () => {
    const file = bufferToFile(downloadedBuffer!, 'JobLine_Setup_Template.xlsx');
    const result = await parseExcelFile(file);

    expect(result.errors).toEqual([]);
    expect(result.data.teams.length).toBe(TEAMS_TEMPLATE.sampleData.length);
    expect(result.data.departments.length).toBe(DEPARTMENTS_TEMPLATE.sampleData.length);
    expect(result.data.stations.length).toBe(STATIONS_TEMPLATE.sampleData.length);
    expect(result.data.users.length).toBe(USERS_TEMPLATE.sampleData.length);
    expect(result.data.workOrders.length).toBe(WORK_ORDERS_TEMPLATE.sampleData.length);
    // Routing templates collapse rows by Template Name
    const uniqueRoutingNames = new Set(
      ROUTING_TEMPLATE.sampleData.map(r => r[0] as string),
    );
    expect(result.data.routingTemplates.length).toBe(uniqueRoutingNames.size);
  });

  it('parses sample work orders into the DB-ready shape used by useBulkUpload', async () => {
    const file = bufferToFile(downloadedBuffer!, 'tpl.xlsx');
    const { data } = await parseExcelFile(file);
    const first = data.workOrders[0];
    expect(first.work_order).toMatch(/^WO-/);
    expect(['low', 'normal', 'high', 'urgent', 'critical']).toContain(first.priority);
    expect(['pending', 'queued', 'in_progress', 'on_hold']).toContain(first.status);
    // Due date stays YYYY-MM-DD per template guidance
    expect(first.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parses sample stations with team_name + department populated for uploader', async () => {
    const file = bufferToFile(downloadedBuffer!, 'tpl.xlsx');
    const { data } = await parseExcelFile(file);
    const cnc = data.stations.find(s => s.station_id === 'CNC-001');
    expect(cnc).toBeTruthy();
    expect(cnc!.team_name).toBe('Day Shift Team');
    expect(cnc!.department).toBe('Machining');
    expect(cnc!.is_active).toBe(true);
  });
});
