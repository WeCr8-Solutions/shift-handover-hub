#!/usr/bin/env node
/**
 * Regenerates public/templates/JobLine_Setup_Template.xlsx from the in-code
 * template definitions in src/lib/excelTemplates.ts so the static download
 * never drifts from the in-app parser.
 *
 * Run: bun scripts/regenerate-bulk-template.mjs
 */
import ExcelJS from 'exceljs';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  STATIONS_TEMPLATE,
  USERS_TEMPLATE,
  TEAMS_TEMPLATE,
  DEPARTMENTS_TEMPLATE,
  WORK_ORDERS_TEMPLATE,
  ROUTING_TEMPLATE,
  INSTRUCTIONS_TEMPLATE,
} from '../src/lib/excelTemplates.ts';

const templates = [
  INSTRUCTIONS_TEMPLATE,
  TEAMS_TEMPLATE,
  DEPARTMENTS_TEMPLATE,
  STATIONS_TEMPLATE,
  USERS_TEMPLATE,
  WORK_ORDERS_TEMPLATE,
  ROUTING_TEMPLATE,
];

const workbook = new ExcelJS.Workbook();
workbook.creator = 'JobLine.ai';
workbook.created = new Date();

for (const t of templates) {
  const ws = workbook.addWorksheet(t.sheetName);
  ws.addRow(t.headers);
  const head = ws.getRow(1);
  head.font = { bold: true };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  for (const row of t.sampleData) ws.addRow(row);
  t.headers.forEach((h, i) => {
    const maxLen = Math.max(h.length, ...t.sampleData.map(r => String(r[i] ?? '').length));
    ws.getColumn(i + 1).width = Math.min(maxLen + 2, 50);
  });
  if (Object.keys(t.validValues).length && t.sheetName !== 'Instructions') {
    const raw = `${t.sheetName} - Valid Values`;
    const name = raw.length <= 31 ? raw : `${t.sheetName} - Valid`.slice(0, 31);
    const vs = workbook.addWorksheet(name);
    vs.addRow(['Column', 'Valid Values']);
    vs.getRow(1).font = { bold: true };
    for (const [col, vals] of Object.entries(t.validValues)) {
      vs.addRow([col, vals.join(', ')]);
    }
    vs.getColumn(1).width = 30;
    vs.getColumn(2).width = 80;
  }
}

mkdirSync('public/templates', { recursive: true });
const buf = await workbook.xlsx.writeBuffer();
writeFileSync('public/templates/JobLine_Setup_Template.xlsx', Buffer.from(buf));
console.log(`✓ Regenerated JobLine_Setup_Template.xlsx (${buf.byteLength} bytes)`);
