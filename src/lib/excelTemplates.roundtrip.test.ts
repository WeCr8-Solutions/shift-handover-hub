/**
 * E2E roundtrip: load the published static template and parse it back through
 * the in-app parser. Guards against sheet-name truncation collisions, header
 * drift, and sample rows the parser would reject.
 */
// Polyfill stream/promises pipeline issues — ExcelJS load needs Node Buffer.
import { Buffer as NodeBuffer } from 'node:buffer';
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ExcelJS from 'exceljs';
import {
  parseExcelFile,
  STATIONS_TEMPLATE,
  USERS_TEMPLATE,
  TEAMS_TEMPLATE,
  DEPARTMENTS_TEMPLATE,
  WORK_ORDERS_TEMPLATE,
  ROUTING_TEMPLATE,
} from './excelTemplates';

let templateBuffer: ArrayBuffer;

beforeAll(() => {
  const buf = readFileSync(resolve(process.cwd(), 'public/templates/JobLine_Setup_Template.xlsx'));
  // ExcelJS in jsdom prefers a fresh ArrayBuffer copy.
  const copy = new Uint8Array(buf.byteLength);
  copy.set(buf);
  templateBuffer = copy.buffer;
  // Touch NodeBuffer to keep import alive (used by ExcelJS internally).
  void NodeBuffer;
});

function bufferToFile(buf: ArrayBuffer, name = 'tpl.xlsx'): File {
  return { name, arrayBuffer: async () => buf } as unknown as File;
}


describe('Excel bulk-import template roundtrip', () => {
  it('produces a workbook with all 7 expected sheets, none exceeding 31 chars', async () => {
    expect(templateBuffer).toBeTruthy();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(templateBuffer);
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
    const file = bufferToFile(templateBuffer, 'JobLine_Setup_Template.xlsx');
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
    const file = bufferToFile(templateBuffer, 'tpl.xlsx');
    const { data } = await parseExcelFile(file);
    const first = data.workOrders[0];
    expect(first.work_order).toMatch(/^WO-/);
    expect(['low', 'normal', 'high', 'urgent', 'critical']).toContain(first.priority);
    expect(['pending', 'queued', 'in_progress', 'on_hold']).toContain(first.status);
    // Due date stays YYYY-MM-DD per template guidance
    expect(first.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parses sample stations with team_name + department populated for uploader', async () => {
    const file = bufferToFile(templateBuffer, 'tpl.xlsx');
    const { data } = await parseExcelFile(file);
    const cnc = data.stations.find(s => s.station_id === 'CNC-001');
    expect(cnc).toBeTruthy();
    expect(cnc!.team_name).toBe('Day Shift Team');
    expect(cnc!.department).toBe('Machining');
    expect(cnc!.is_active).toBe(true);
  });
});
