import ExcelJS from 'exceljs';
import { ALL_WORK_CENTER_TYPES } from '@/types/handoff';

// Template data with sample rows
export const STATIONS_TEMPLATE = {
  sheetName: 'Stations',
  headers: ['Station ID', 'Station Name', 'Work Center', 'Work Center Type', 'Team Name (optional)', 'Department (optional)', 'Active (yes/no)'],
  sampleData: [
    ['CNC-001', 'Haas VF-2 Mill #1', 'CNC Bay 1', 'CNC Mill', 'Day Shift Team', 'Machining', 'yes'],
    ['CNC-002', 'Haas VF-2 Mill #2', 'CNC Bay 1', 'CNC Mill', 'Day Shift Team', 'Machining', 'yes'],
    ['LATHE-001', 'Mazak QT-250 Lathe', 'CNC Bay 2', 'CNC Lathe', 'Night Shift Team', 'Machining', 'yes'],
    ['WJ-001', 'Flow Waterjet', 'Cutting Area', 'Water Jet', '', 'Cutting', 'yes'],
    ['WELD-001', 'TIG Station 1', 'Welding Bay', 'TIG Welding', 'Welding Team', 'Fabrication', 'yes'],
    ['INSP-001', 'CMM Station', 'Quality Lab', 'Incoming Inspection', '', 'Quality', 'yes'],
  ],
  validValues: {
    'Work Center Type': ALL_WORK_CENTER_TYPES,
    'Active (yes/no)': ['yes', 'no'],
  },
};

export const USERS_TEMPLATE = {
  sheetName: 'Users',
  headers: ['Email', 'Display Name', 'Role', 'Team Name (optional)', 'Department (optional)'],
  sampleData: [
    ['john.smith@company.com', 'John Smith', 'operator', 'Day Shift Team', 'Machining'],
    ['jane.doe@company.com', 'Jane Doe', 'supervisor', 'Day Shift Team', 'Machining'],
    ['mike.wilson@company.com', 'Mike Wilson', 'operator', 'Night Shift Team', 'Fabrication'],
    ['sarah.johnson@company.com', 'Sarah Johnson', 'admin', '', ''],
    ['tom.brown@company.com', 'Tom Brown', 'viewer', '', 'Quality'],
  ],
  validValues: {
    'Role': ['admin', 'supervisor', 'operator', 'viewer'],
  },
};

export const TEAMS_TEMPLATE = {
  sheetName: 'Teams',
  headers: ['Team Name', 'Description', 'Departments (comma-separated)'],
  sampleData: [
    ['Day Shift Team', 'Primary day shift operations team, 6AM-2PM', 'Machining, Assembly'],
    ['Night Shift Team', 'Night shift operations, 10PM-6AM', 'Machining, Fabrication'],
    ['Swing Shift Team', 'Swing shift coverage, 2PM-10PM', 'Machining'],
    ['Welding Team', 'Specialized welding and fabrication team', 'Fabrication'],
    ['Quality Team', 'Quality assurance and inspection team', 'Quality, Shipping'],
  ],
  validValues: {},
};

export const ROUTING_TEMPLATE = {
  sheetName: 'Routing Templates',
  headers: ['Template Name', 'Part Number Pattern', 'Step #', 'Operation Name', 'Type', 'Work Center', 'Est. Duration (min)', 'Vendor (if outside)', 'Instructions'],
  sampleData: [
    ['Standard Manufacturing', 'PART-*', '1', 'Quote Review & Approval', 'quote', 'Quoting', '30', '', 'Review quote and customer requirements'],
    ['Standard Manufacturing', 'PART-*', '2', 'Engineering Review', 'engineering', 'Engineering', '60', '', 'Review drawings, tolerances, and material specs'],
    ['Standard Manufacturing', 'PART-*', '3', 'Programming/CAM', 'engineering', 'Programming/CAM', '120', '', 'Create CNC programs and toolpaths'],
    ['Standard Manufacturing', 'PART-*', '4', 'Materials Purchasing', 'purchasing', 'Purchasing', '30', '', 'Order raw materials and special tooling'],
    ['Standard Manufacturing', 'PART-*', '5', 'Materials Receiving', 'receiving', 'Receiving', '15', '', 'Receive and verify material certifications'],
    ['Standard Manufacturing', 'PART-*', '6', 'Incoming Inspection', 'inspection', 'Incoming Inspection', '30', '', 'Verify material dimensions and condition'],
    ['Standard Manufacturing', 'PART-*', '7', 'Material Cutting/Prep', 'internal', 'Saw', '30', '', 'Cut material to rough size'],
    ['Standard Manufacturing', 'PART-*', '8', 'Tool Setup & Prep', 'internal', 'Tool Crib', '45', '', 'Pull and verify tooling, fixtures, and gages'],
    ['Standard Manufacturing', 'PART-*', '9', 'First Article Setup', 'internal', 'CNC Mill', '90', '', 'Setup machine and run first article'],
    ['Standard Manufacturing', 'PART-*', '10', 'First Article Inspection', 'inspection', 'CMM', '60', '', 'Full dimensional inspection per drawing'],
    ['Standard Manufacturing', 'PART-*', '11', 'Production Run', 'internal', 'CNC Mill', '240', '', 'Complete production quantity'],
    ['Standard Manufacturing', 'PART-*', '12', 'Deburr/Finish', 'internal', 'Deburr', '30', '', 'Remove burrs and clean parts'],
    ['Standard Manufacturing', 'PART-*', '13', 'Heat Treat', 'outside_processing', '', '480', 'ABC Heat Treat', 'HRC 58-62 per spec'],
    ['Standard Manufacturing', 'PART-*', '14', 'Final Inspection', 'inspection', 'Final Inspection', '30', '', 'Final QC check before shipping'],
    ['Standard Manufacturing', 'PART-*', '15', 'Packaging', 'internal', 'Packaging', '15', '', 'Package per customer requirements'],
    ['Standard Manufacturing', 'PART-*', '16', 'Ship to Customer', 'shipping', 'Shipping', '15', '', 'Generate shipping labels and ship'],
  ],
  validValues: {
    'Type': ['quote', 'engineering', 'purchasing', 'receiving', 'internal', 'outside_processing', 'inspection', 'shipping'],
  },
};

// Generate and download Excel template using ExcelJS
export async function downloadTemplate(templateType: 'stations' | 'users' | 'teams' | 'routing' | 'all') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JobLine.ai';
  workbook.created = new Date();

  const templates = templateType === 'all' 
    ? [STATIONS_TEMPLATE, USERS_TEMPLATE, TEAMS_TEMPLATE, ROUTING_TEMPLATE]
    : templateType === 'stations' 
      ? [STATIONS_TEMPLATE]
      : templateType === 'users'
        ? [USERS_TEMPLATE]
        : templateType === 'teams'
          ? [TEAMS_TEMPLATE]
          : [ROUTING_TEMPLATE];

  templates.forEach(template => {
    // Create worksheet with headers and sample data
    const worksheet = workbook.addWorksheet(template.sheetName);
    
    // Add headers
    worksheet.addRow(template.headers);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add sample data
    template.sampleData.forEach(row => {
      worksheet.addRow(row);
    });

    // Set column widths
    template.headers.forEach((header, i) => {
      const maxLen = Math.max(
        header.length,
        ...template.sampleData.map(row => String(row[i] || '').length)
      );
      worksheet.getColumn(i + 1).width = Math.min(maxLen + 2, 40);
    });

    // Add validation reference sheet for templates with valid values
    if (Object.keys(template.validValues).length > 0) {
      const validationSheet = workbook.addWorksheet(`${template.sheetName} - Valid Values`);
      validationSheet.addRow(['Column', 'Valid Values']);
      
      const valHeaderRow = validationSheet.getRow(1);
      valHeaderRow.font = { bold: true };
      
      Object.entries(template.validValues).forEach(([column, values]) => {
        validationSheet.addRow([column, (values as string[]).join(', ')]);
      });
      
      validationSheet.getColumn(1).width = 25;
      validationSheet.getColumn(2).width = 60;
    }
  });

  // Generate filename
  const filename = templateType === 'all' 
    ? 'JobLine_Setup_Template.xlsx'
    : `JobLine_${templateType.charAt(0).toUpperCase() + templateType.slice(1)}_Template.xlsx`;

  // Write to buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Parse uploaded Excel file
export interface ParsedExcelData {
  stations: Array<{
    station_id: string;
    name: string;
    work_center: string;
    work_center_type: string;
    team_name: string;
    department?: string;
    is_active: boolean;
  }>;
  users: Array<{
    email: string;
    display_name: string;
    role: string;
    team_name: string;
    department?: string;
  }>;
  teams: Array<{
    name: string;
    description: string;
    departments?: string[];
  }>;
  routingTemplates: Array<{
    template_name: string;
    part_number_pattern: string;
    steps: Array<{
      step_number: number;
      operation_name: string;
      operation_type: 'internal' | 'outside_processing' | 'inspection' | 'shipping';
      work_center_type?: string;
      estimated_duration?: number;
      outside_vendor?: string;
      instructions?: string;
    }>;
  }>;
}

export interface ValidationError {
  sheet: string;
  row: number;
  column: string;
  message: string;
  value: string;
}

export interface ParseResult {
  data: ParsedExcelData;
  errors: ValidationError[];
  warnings: string[];
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    await workbook.xlsx.load(arrayBuffer);
  } catch {
    throw new Error('Failed to parse Excel file. Please ensure it\'s a valid .xlsx file.');
  }
  
  const result: ParseResult = {
    data: { stations: [], users: [], teams: [], routingTemplates: [] },
    errors: [],
    warnings: [],
  };

  // Parse each sheet if it exists
  const stationsSheet = workbook.getWorksheet('Stations');
  if (stationsSheet) {
    const parsed = parseStationsSheet(stationsSheet);
    result.data.stations = parsed.data;
    result.errors.push(...parsed.errors);
  }

  const usersSheet = workbook.getWorksheet('Users');
  if (usersSheet) {
    const parsed = parseUsersSheet(usersSheet);
    result.data.users = parsed.data;
    result.errors.push(...parsed.errors);
  }

  const teamsSheet = workbook.getWorksheet('Teams');
  if (teamsSheet) {
    const parsed = parseTeamsSheet(teamsSheet);
    result.data.teams = parsed.data;
    result.errors.push(...parsed.errors);
  }

  const routingSheet = workbook.getWorksheet('Routing Templates');
  if (routingSheet) {
    const parsed = parseRoutingSheet(routingSheet);
    result.data.routingTemplates = parsed.data;
    result.errors.push(...parsed.errors);
  }

  // Check if any data was found
  if (result.data.stations.length === 0 && 
      result.data.users.length === 0 && 
      result.data.teams.length === 0 &&
      result.data.routingTemplates.length === 0) {
    result.warnings.push('No valid data found. Make sure your sheets are named "Stations", "Users", "Teams", or "Routing Templates".');
  }

  return result;
}

// Helper to safely get cell value as string
function getCellValue(row: ExcelJS.Row, colIndex: number): string {
  const cell = row.getCell(colIndex);
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'object' && 'text' in cell.value) {
    return String(cell.value.text || '').trim();
  }
  return String(cell.value).trim();
}

// Get header indices from the first row
function getHeaderMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const headerMap = new Map<string, number>();
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const value = typeof cell.value === 'string' ? cell.value.trim() : String(cell.value || '').trim();
    if (value) {
      headerMap.set(value, colNumber);
    }
  });
  return headerMap;
}

function parseStationsSheet(sheet: ExcelJS.Worksheet) {
  const data: ParsedExcelData['stations'] = [];
  const errors: ValidationError[] = [];
  const headerMap = getHeaderMap(sheet);

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const stationId = getCellValue(row, headerMap.get('Station ID') || 1);
    const name = getCellValue(row, headerMap.get('Station Name') || 2);
    const workCenter = getCellValue(row, headerMap.get('Work Center') || 3);
    const workCenterType = getCellValue(row, headerMap.get('Work Center Type') || 4);
    const teamName = getCellValue(row, headerMap.get('Team Name (optional)') || 5);
    const department = getCellValue(row, headerMap.get('Department (optional)') || 6);
    const activeStr = getCellValue(row, headerMap.get('Active (yes/no)') || 7).toLowerCase() || 'yes';

    // Skip empty rows
    if (!stationId && !name && !workCenter && !workCenterType) return;

    // Validate required fields
    if (!stationId) {
      errors.push({ sheet: 'Stations', row: rowNumber, column: 'Station ID', message: 'Required field', value: stationId });
    }
    if (!name) {
      errors.push({ sheet: 'Stations', row: rowNumber, column: 'Station Name', message: 'Required field', value: name });
    }
    if (!workCenter) {
      errors.push({ sheet: 'Stations', row: rowNumber, column: 'Work Center', message: 'Required field', value: workCenter });
    }
    if (!workCenterType) {
      errors.push({ sheet: 'Stations', row: rowNumber, column: 'Work Center Type', message: 'Required field', value: workCenterType });
    } else if (!ALL_WORK_CENTER_TYPES.includes(workCenterType as typeof ALL_WORK_CENTER_TYPES[number])) {
      errors.push({ 
        sheet: 'Stations', 
        row: rowNumber, 
        column: 'Work Center Type', 
        message: `Invalid value. Must be one of: ${ALL_WORK_CENTER_TYPES.join(', ')}`,
        value: workCenterType 
      });
    }

    if (stationId && name && workCenter && workCenterType && ALL_WORK_CENTER_TYPES.includes(workCenterType as typeof ALL_WORK_CENTER_TYPES[number])) {
      data.push({
        station_id: stationId,
        name,
        work_center: workCenter,
        work_center_type: workCenterType,
        team_name: teamName,
        department: department || undefined,
        is_active: activeStr !== 'no',
      });
    }
  });

  return { data, errors };
}

function parseUsersSheet(sheet: ExcelJS.Worksheet) {
  const data: ParsedExcelData['users'] = [];
  const errors: ValidationError[] = [];
  const validRoles = ['admin', 'supervisor', 'operator', 'viewer'];
  const headerMap = getHeaderMap(sheet);

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const email = getCellValue(row, headerMap.get('Email') || 1).toLowerCase();
    const displayName = getCellValue(row, headerMap.get('Display Name') || 2);
    const role = getCellValue(row, headerMap.get('Role') || 3).toLowerCase() || 'operator';
    const teamName = getCellValue(row, headerMap.get('Team Name (optional)') || 4);
    const department = getCellValue(row, headerMap.get('Department (optional)') || 5);

    // Skip empty rows
    if (!email && !displayName) return;

    // Validate
    if (!email) {
      errors.push({ sheet: 'Users', row: rowNumber, column: 'Email', message: 'Required field', value: email });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ sheet: 'Users', row: rowNumber, column: 'Email', message: 'Invalid email format', value: email });
    }
    if (!displayName) {
      errors.push({ sheet: 'Users', row: rowNumber, column: 'Display Name', message: 'Required field', value: displayName });
    }
    if (!validRoles.includes(role)) {
      errors.push({ 
        sheet: 'Users', 
        row: rowNumber, 
        column: 'Role', 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        value: role 
      });
    }

    if (email && displayName && validRoles.includes(role) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      data.push({ 
        email, 
        display_name: displayName, 
        role, 
        team_name: teamName,
        department: department || undefined,
      });
    }
  });

  return { data, errors };
}

function parseTeamsSheet(sheet: ExcelJS.Worksheet) {
  const data: ParsedExcelData['teams'] = [];
  const errors: ValidationError[] = [];
  const headerMap = getHeaderMap(sheet);

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const name = getCellValue(row, headerMap.get('Team Name') || 1);
    const description = getCellValue(row, headerMap.get('Description') || 2);
    const departmentsStr = getCellValue(row, headerMap.get('Departments (comma-separated)') || 3);
    const departments = departmentsStr ? departmentsStr.split(',').map(d => d.trim()).filter(Boolean) : undefined;

    // Skip empty rows
    if (!name) {
      if (description || departmentsStr) {
        errors.push({ sheet: 'Teams', row: rowNumber, column: 'Team Name', message: 'Required field', value: name });
      }
      return;
    }

    data.push({ name, description, departments });
  });

  return { data, errors };
}

function parseRoutingSheet(sheet: ExcelJS.Worksheet) {
  const errors: ValidationError[] = [];
  const validTypes = ['quote', 'engineering', 'purchasing', 'receiving', 'internal', 'outside_processing', 'inspection', 'shipping'];
  const headerMap = getHeaderMap(sheet);

  // Group rows by template name
  const templateMap = new Map<string, ParsedExcelData['routingTemplates'][0]>();

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const templateName = getCellValue(row, headerMap.get('Template Name') || 1);
    const partPattern = getCellValue(row, headerMap.get('Part Number Pattern') || 2);
    const stepNumStr = getCellValue(row, headerMap.get('Step #') || 3);
    const stepNum = parseInt(stepNumStr) || 0;
    const opName = getCellValue(row, headerMap.get('Operation Name') || 4);
    const opType = getCellValue(row, headerMap.get('Type') || 5).toLowerCase() || 'internal';
    const workCenter = getCellValue(row, headerMap.get('Work Center') || 6);
    const durationStr = getCellValue(row, headerMap.get('Est. Duration (min)') || 7);
    const duration = parseInt(durationStr) || 0;
    const vendor = getCellValue(row, headerMap.get('Vendor (if outside)') || 8);
    const instructions = getCellValue(row, headerMap.get('Instructions') || 9);

    // Skip empty rows
    if (!templateName && !opName) return;

    if (!templateName) {
      errors.push({ sheet: 'Routing Templates', row: rowNumber, column: 'Template Name', message: 'Required field', value: templateName });
      return;
    }
    if (!opName) {
      errors.push({ sheet: 'Routing Templates', row: rowNumber, column: 'Operation Name', message: 'Required field', value: opName });
      return;
    }
    if (!validTypes.includes(opType)) {
      errors.push({ 
        sheet: 'Routing Templates', 
        row: rowNumber, 
        column: 'Type', 
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        value: opType 
      });
      return;
    }

    if (!templateMap.has(templateName)) {
      templateMap.set(templateName, {
        template_name: templateName,
        part_number_pattern: partPattern,
        steps: [],
      });
    }

    const template = templateMap.get(templateName)!;
    template.steps.push({
      step_number: stepNum || template.steps.length + 1,
      operation_name: opName,
      operation_type: opType as 'internal' | 'outside_processing' | 'inspection' | 'shipping',
      work_center_type: workCenter || undefined,
      estimated_duration: duration || undefined,
      outside_vendor: vendor || undefined,
      instructions: instructions || undefined,
    });
  });

  return { data: Array.from(templateMap.values()), errors };
}
