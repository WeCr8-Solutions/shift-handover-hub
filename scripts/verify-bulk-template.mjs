// E2E verify: regenerated template parses cleanly with zero errors.
import ExcelJS from 'exceljs';

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile('public/templates/JobLine_Setup_Template.xlsx');
const names = wb.worksheets.map(w => w.name);
const required = ['Instructions','Teams','Departments','Stations','Users','Work Orders','Routing Templates'];
const missing = required.filter(r => !names.includes(r));
const tooLong = names.filter(n => n.length > 31);
const dupes = names.filter((n,i) => names.indexOf(n) !== i);
console.log('Sheets:', names.length, '| missing:', missing, '| >31char:', tooLong, '| dupes:', dupes);

// Row counts per sheet
for (const sn of required) {
  const ws = wb.getWorksheet(sn);
  console.log(`  ${sn}: ${ws.rowCount - 1} data row(s)`);
}
const fail = missing.length || tooLong.length || dupes.length;
console.log(fail ? '❌ FAIL' : '✅ PASS — template is parseable and matches expected schema');
process.exit(fail ? 1 : 0);
