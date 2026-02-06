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
  headers: ['Email', 'Display Name', 'App Role', 'Org Role (optional)', 'Team Role (optional)', 'Team Name (optional)', 'Department (optional)'],
  sampleData: [
    ['john.smith@company.com', 'John Smith', 'operator', 'member', 'member', 'Day Shift Team', 'Machining'],
    ['jane.doe@company.com', 'Jane Doe', 'supervisor', 'admin', 'admin', 'Day Shift Team', 'Machining'],
    ['mike.wilson@company.com', 'Mike Wilson', 'operator', 'member', 'member', 'Night Shift Team', 'Fabrication'],
    ['sarah.johnson@company.com', 'Sarah Johnson', 'admin', 'owner', '', '', ''],
    ['tom.brown@company.com', 'Tom Brown', 'viewer', 'member', '', '', 'Quality'],
  ],
  validValues: {
    'App Role': ['admin', 'supervisor', 'operator', 'viewer'],
    'Org Role (optional)': ['owner', 'admin', 'member'],
    'Team Role (optional)': ['owner', 'admin', 'member'],
  },
};

export const TEAMS_TEMPLATE = {
  sheetName: 'Teams',
  headers: ['Team Name', 'Description', 'Shift Schedule (optional)'],
  sampleData: [
    ['Day Shift Team', 'Primary day shift operations team, 6AM-2PM', '6:00 AM - 2:00 PM'],
    ['Night Shift Team', 'Night shift operations, 10PM-6AM', '10:00 PM - 6:00 AM'],
    ['Swing Shift Team', 'Swing shift coverage, 2PM-10PM', '2:00 PM - 10:00 PM'],
    ['Welding Team', 'Specialized welding and fabrication team', '7:00 AM - 3:30 PM'],
    ['Quality Team', 'Quality assurance and inspection team', '7:00 AM - 3:30 PM'],
  ],
  validValues: {},
};

export const DEPARTMENTS_TEMPLATE = {
  sheetName: 'Departments',
  headers: ['Department Name', 'Team Name', 'Description (optional)'],
  sampleData: [
    ['Machining', 'Day Shift Team', 'CNC milling and lathe operations'],
    ['Machining', 'Night Shift Team', 'CNC milling and lathe operations - night shift'],
    ['Fabrication', 'Welding Team', 'Welding and sheet metal work'],
    ['Quality', 'Quality Team', 'Inspection and QC operations'],
    ['Shipping', 'Day Shift Team', 'Packaging and logistics'],
    ['Assembly', 'Day Shift Team', 'Final assembly and hardware installation'],
    ['Cutting', 'Day Shift Team', 'Saw and waterjet cutting operations'],
  ],
  validValues: {},
};

export const WORK_ORDERS_TEMPLATE = {
  sheetName: 'Work Orders',
  headers: [
    'Work Order #', 
    'Title', 
    'Part Number (optional)', 
    'Operation # (optional)', 
    'Quantity (optional)', 
    'Priority', 
    'Status', 
    'Station ID (optional)', 
    'Team Name (optional)', 
    'Due Date (YYYY-MM-DD)', 
    'Est. Duration (min)', 
    'Tags (comma-separated)', 
    'Description (optional)'
  ],
  sampleData: [
    ['WO-2024-001', 'Bracket Assembly', 'BRK-1234', '10', '50', 'normal', 'pending', 'CNC-001', 'Day Shift Team', '2024-03-15', '120', 'rush,aerospace', 'Machine brackets per drawing REV-B'],
    ['WO-2024-002', 'Housing Machining', 'HSG-5678', '20', '25', 'high', 'queued', 'LATHE-001', 'Night Shift Team', '2024-03-12', '240', 'priority', 'Turn housing components'],
    ['WO-2024-003', 'Cover Plate Inspection', 'CVR-9012', '30', '100', 'normal', 'pending', 'INSP-001', '', '2024-03-20', '60', '', 'Final inspection of cover plates'],
    ['WO-2024-004', 'Shaft Grinding', 'SFT-3456', '40', '10', 'urgent', 'pending', '', 'Welding Team', '2024-03-10', '180', 'hot-job,customer-urgent', 'Precision grinding per spec'],
    ['WO-2024-005', 'Prototype Frame', 'FRM-7890', '10', '2', 'critical', 'in_progress', 'WELD-001', 'Welding Team', '2024-03-08', '480', 'prototype,engineering', 'New product prototype frame'],
  ],
  validValues: {
    'Priority': ['low', 'normal', 'high', 'urgent', 'critical'],
    'Status': ['pending', 'queued', 'in_progress', 'on_hold'],
  },
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

export const INSTRUCTIONS_TEMPLATE = {
  sheetName: 'Instructions',
  headers: ['Sheet Name', 'Column', 'Required', 'Valid Values', 'Description'],
  sampleData: [
    ['General', '', '', '', 'Fill out each sheet with your organization data. Team Names must match exactly across sheets.'],
    ['', '', '', '', ''],
    ['Teams', 'Team Name', 'Yes', '', 'Unique name for the team (e.g., Day Shift Team)'],
    ['Teams', 'Description', 'No', '', 'Brief description of the team\'s purpose'],
    ['Teams', 'Shift Schedule', 'No', '', 'Operating hours (e.g., 6:00 AM - 2:00 PM)'],
    ['', '', '', '', ''],
    ['Departments', 'Department Name', 'Yes', '', 'Name of the department (e.g., Machining)'],
    ['Departments', 'Team Name', 'Yes', '', 'Must match a Team Name from the Teams sheet'],
    ['Departments', 'Description', 'No', '', 'Brief description of the department'],
    ['', '', '', '', ''],
    ['Stations', 'Station ID', 'Yes', '', 'Unique identifier (e.g., CNC-001)'],
    ['Stations', 'Station Name', 'Yes', '', 'Descriptive name for the station'],
    ['Stations', 'Work Center', 'Yes', '', 'Physical area grouping (e.g., CNC Bay 1)'],
    ['Stations', 'Work Center Type', 'Yes', 'See Valid Values sheet', 'Type of work center'],
    ['Stations', 'Team Name', 'No', '', 'Must match a Team Name if provided'],
    ['Stations', 'Department', 'No', '', 'Department assignment'],
    ['Stations', 'Active', 'No', 'yes, no', 'Whether station is currently in use'],
    ['', '', '', '', ''],
    ['Users', 'Email', 'Yes', '', 'Valid email address'],
    ['Users', 'Display Name', 'Yes', '', 'User\'s display name'],
    ['Users', 'App Role', 'Yes', 'admin, supervisor, operator, viewer', 'Application-level role'],
    ['Users', 'Org Role', 'No', 'owner, admin, member', 'Organization-level role'],
    ['Users', 'Team Role', 'No', 'owner, admin, member', 'Team-level role'],
    ['Users', 'Team Name', 'No', '', 'Must match a Team Name if provided'],
    ['Users', 'Department', 'No', '', 'Department assignment'],
    ['', '', '', '', ''],
    ['Work Orders', 'Work Order #', 'Yes', '', 'Unique work order identifier'],
    ['Work Orders', 'Title', 'Yes', '', 'Brief title for the work order'],
    ['Work Orders', 'Part Number', 'No', '', 'Associated part number'],
    ['Work Orders', 'Operation #', 'No', '', 'Operation/step number'],
    ['Work Orders', 'Quantity', 'No', '', 'Number of parts'],
    ['Work Orders', 'Priority', 'No', 'low, normal, high, urgent, critical', 'Priority level'],
    ['Work Orders', 'Status', 'No', 'pending, queued, in_progress, on_hold', 'Current status'],
    ['Work Orders', 'Station ID', 'No', '', 'Must match a Station ID if provided'],
    ['Work Orders', 'Team Name', 'No', '', 'Must match a Team Name if provided'],
    ['Work Orders', 'Due Date', 'No', '', 'Format: YYYY-MM-DD'],
    ['Work Orders', 'Est. Duration', 'No', '', 'Estimated minutes to complete'],
    ['Work Orders', 'Tags', 'No', '', 'Comma-separated tags'],
    ['Work Orders', 'Description', 'No', '', 'Detailed description'],
    ['', '', '', '', ''],
    ['Processing Order', '', '', '', 'Data is processed in this order to satisfy dependencies:'],
    ['', '1. Teams', '', '', 'Teams are created first (no dependencies)'],
    ['', '2. Departments', '', '', 'Departments depend on Teams'],
    ['', '3. Stations', '', '', 'Stations depend on Teams and optionally Departments'],
    ['', '4. Users', '', '', 'Users are queued for invitation (depend on Teams)'],
    ['', '5. Work Orders', '', '', 'Work Orders depend on Teams and Stations'],
  ],
  validValues: {},
};

// Template type definition
interface TemplateDefinition {
  sheetName: string;
  headers: string[];
  sampleData: (string | number)[][];
  validValues: Record<string, string[]>;
}

// Generate and download Excel template using ExcelJS
export async function downloadTemplate(templateType: 'stations' | 'users' | 'teams' | 'departments' | 'workorders' | 'routing' | 'all') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JobLine.ai';
  workbook.created = new Date();

  const templateMap: Record<string, TemplateDefinition> = {
    stations: STATIONS_TEMPLATE as unknown as TemplateDefinition,
    users: USERS_TEMPLATE,
    teams: TEAMS_TEMPLATE,
    departments: DEPARTMENTS_TEMPLATE,
    workorders: WORK_ORDERS_TEMPLATE,
    routing: ROUTING_TEMPLATE,
  };

  const allTemplates: TemplateDefinition[] = [
    INSTRUCTIONS_TEMPLATE, 
    TEAMS_TEMPLATE, 
    DEPARTMENTS_TEMPLATE, 
    STATIONS_TEMPLATE as unknown as TemplateDefinition, 
    USERS_TEMPLATE, 
    WORK_ORDERS_TEMPLATE, 
    ROUTING_TEMPLATE
  ];

  const templates = templateType === 'all' 
    ? allTemplates
    : [templateMap[templateType]];

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
      worksheet.getColumn(i + 1).width = Math.min(maxLen + 2, 50);
    });

    // Add validation reference sheet for templates with valid values
    if (Object.keys(template.validValues).length > 0 && template.sheetName !== 'Instructions') {
      const validationSheet = workbook.addWorksheet(`${template.sheetName} - Valid Values`);
      validationSheet.addRow(['Column', 'Valid Values']);
      
      const valHeaderRow = validationSheet.getRow(1);
      valHeaderRow.font = { bold: true };
      
      Object.entries(template.validValues).forEach(([column, values]) => {
        validationSheet.addRow([column, (values as string[]).join(', ')]);
      });
      
      validationSheet.getColumn(1).width = 30;
      validationSheet.getColumn(2).width = 80;
    }
  });

  // Generate filename
  const filenameMap: Record<string, string> = {
    all: 'JobLine_Setup_Template.xlsx',
    stations: 'JobLine_Stations_Template.xlsx',
    users: 'JobLine_Users_Template.xlsx',
    teams: 'JobLine_Teams_Template.xlsx',
    departments: 'JobLine_Departments_Template.xlsx',
    workorders: 'JobLine_WorkOrders_Template.xlsx',
    routing: 'JobLine_Routing_Template.xlsx',
  };

  const filename = filenameMap[templateType] || 'JobLine_Template.xlsx';

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
    org_role?: string;
    team_role?: string;
    team_name: string;
    department?: string;
  }>;
  teams: Array<{
    name: string;
    description: string;
    shift_schedule?: string;
  }>;
  departments: Array<{
    name: string;
    team_name: string;
    description?: string;
  }>;
  workOrders: Array<{
    work_order: string;
    title: string;
    part_number?: string;
    operation_number?: string;
    quantity?: number;
    priority: string;
    status: string;
    station_id?: string;
    team_name?: string;
    due_date?: string;
    estimated_duration?: number;
    tags?: string[];
    description?: string;
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

export interface ValidationWarning {
  sheet: string;
  row: number;
  column: string;
  message: string;
  value: string;
  referencedValue?: string;
}

export interface ParseResult {
  data: ParsedExcelData;
  errors: ValidationError[];
  warnings: ValidationWarning[];
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
    data: { stations: [], users: [], teams: [], departments: [], workOrders: [], routingTemplates: [] },
    errors: [],
    warnings: [],
  };

  // Parse each sheet if it exists - ORDER MATTERS for cross-sheet validation
  const teamsSheet = workbook.getWorksheet('Teams');
  if (teamsSheet) {
    const parsed = parseTeamsSheet(teamsSheet);
    result.data.teams = parsed.data;
    result.errors.push(...parsed.errors);
  }

  const departmentsSheet = workbook.getWorksheet('Departments');
  if (departmentsSheet) {
    const parsed = parseDepartmentsSheet(departmentsSheet, result.data.teams);
    result.data.departments = parsed.data;
    result.errors.push(...parsed.errors);
    result.warnings.push(...parsed.warnings);
  }

  const stationsSheet = workbook.getWorksheet('Stations');
  if (stationsSheet) {
    const parsed = parseStationsSheet(stationsSheet, result.data.teams);
    result.data.stations = parsed.data;
    result.errors.push(...parsed.errors);
    result.warnings.push(...parsed.warnings);
  }

  const usersSheet = workbook.getWorksheet('Users');
  if (usersSheet) {
    const parsed = parseUsersSheet(usersSheet, result.data.teams);
    result.data.users = parsed.data;
    result.errors.push(...parsed.errors);
    result.warnings.push(...parsed.warnings);
  }

  const workOrdersSheet = workbook.getWorksheet('Work Orders');
  if (workOrdersSheet) {
    const parsed = parseWorkOrdersSheet(workOrdersSheet, result.data.teams, result.data.stations);
    result.data.workOrders = parsed.data;
    result.errors.push(...parsed.errors);
    result.warnings.push(...parsed.warnings);
  }

  const routingSheet = workbook.getWorksheet('Routing Templates');
  if (routingSheet) {
    const parsed = parseRoutingSheet(routingSheet);
    result.data.routingTemplates = parsed.data;
    result.errors.push(...parsed.errors);
  }

  // Check if any data was found
  const hasData = result.data.stations.length > 0 || 
      result.data.users.length > 0 || 
      result.data.teams.length > 0 ||
      result.data.departments.length > 0 ||
      result.data.workOrders.length > 0 ||
      result.data.routingTemplates.length > 0;

  if (!hasData) {
    result.warnings.push({
      sheet: 'General',
      row: 0,
      column: '',
      message: 'No valid data found. Make sure your sheets are named correctly: "Teams", "Departments", "Stations", "Users", "Work Orders", or "Routing Templates".',
      value: '',
    });
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
      // Store both the full header and a simplified version for flexible matching
      headerMap.set(value, colNumber);
      // Also store without (optional) suffix for easier matching
      const simplified = value.replace(/\s*\(optional\)/gi, '').replace(/\s*\(.*\)/gi, '').trim();
      if (simplified !== value) {
        headerMap.set(simplified, colNumber);
      }
    }
  });
  return headerMap;
}

function parseTeamsSheet(sheet: ExcelJS.Worksheet) {
  const data: ParsedExcelData['teams'] = [];
  const errors: ValidationError[] = [];
  const headerMap = getHeaderMap(sheet);

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const name = getCellValue(row, headerMap.get('Team Name') || 1);
    const description = getCellValue(row, headerMap.get('Description') || 2);
    const shiftSchedule = getCellValue(row, headerMap.get('Shift Schedule') || headerMap.get('Shift Schedule (optional)') || 3);

    // Skip empty rows
    if (!name) {
      if (description || shiftSchedule) {
        errors.push({ sheet: 'Teams', row: rowNumber, column: 'Team Name', message: 'Required field', value: name });
      }
      return;
    }

    data.push({ 
      name, 
      description, 
      shift_schedule: shiftSchedule || undefined,
    });
  });

  return { data, errors };
}

function parseDepartmentsSheet(
  sheet: ExcelJS.Worksheet, 
  existingTeams: ParsedExcelData['teams']
) {
  const data: ParsedExcelData['departments'] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const headerMap = getHeaderMap(sheet);
  const teamNames = new Set(existingTeams.map(t => t.name.toLowerCase()));

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const name = getCellValue(row, headerMap.get('Department Name') || 1);
    const teamName = getCellValue(row, headerMap.get('Team Name') || 2);
    const description = getCellValue(row, headerMap.get('Description') || headerMap.get('Description (optional)') || 3);

    // Skip empty rows
    if (!name && !teamName) return;

    // Validate required fields
    if (!name) {
      errors.push({ sheet: 'Departments', row: rowNumber, column: 'Department Name', message: 'Required field', value: name });
      return;
    }
    if (!teamName) {
      errors.push({ sheet: 'Departments', row: rowNumber, column: 'Team Name', message: 'Required field', value: teamName });
      return;
    }

    // Cross-sheet validation
    if (teamNames.size > 0 && !teamNames.has(teamName.toLowerCase())) {
      warnings.push({
        sheet: 'Departments',
        row: rowNumber,
        column: 'Team Name',
        message: `Team "${teamName}" not found in Teams sheet. Will attempt to match existing team.`,
        value: teamName,
        referencedValue: teamName,
      });
    }

    data.push({ 
      name, 
      team_name: teamName, 
      description: description || undefined,
    });
  });

  return { data, errors, warnings };
}

function parseStationsSheet(
  sheet: ExcelJS.Worksheet,
  existingTeams: ParsedExcelData['teams']
) {
  const data: ParsedExcelData['stations'] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const headerMap = getHeaderMap(sheet);
  const teamNames = new Set(existingTeams.map(t => t.name.toLowerCase()));

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const stationId = getCellValue(row, headerMap.get('Station ID') || 1);
    const name = getCellValue(row, headerMap.get('Station Name') || 2);
    const workCenter = getCellValue(row, headerMap.get('Work Center') || 3);
    const workCenterType = getCellValue(row, headerMap.get('Work Center Type') || 4);
    const teamName = getCellValue(row, headerMap.get('Team Name') || headerMap.get('Team Name (optional)') || 5);
    const department = getCellValue(row, headerMap.get('Department') || headerMap.get('Department (optional)') || 6);
    const activeStr = getCellValue(row, headerMap.get('Active') || headerMap.get('Active (yes/no)') || 7).toLowerCase() || 'yes';

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

    // Cross-sheet validation for team name
    if (teamName && teamNames.size > 0 && !teamNames.has(teamName.toLowerCase())) {
      warnings.push({
        sheet: 'Stations',
        row: rowNumber,
        column: 'Team Name',
        message: `Team "${teamName}" not found in Teams sheet. Will attempt to match existing team.`,
        value: teamName,
        referencedValue: teamName,
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

  return { data, errors, warnings };
}

function parseUsersSheet(
  sheet: ExcelJS.Worksheet,
  existingTeams: ParsedExcelData['teams']
) {
  const data: ParsedExcelData['users'] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validRoles = ['admin', 'supervisor', 'operator', 'viewer'];
  const validOrgRoles = ['owner', 'admin', 'member'];
  const validTeamRoles = ['owner', 'admin', 'member'];
  const headerMap = getHeaderMap(sheet);
  const teamNames = new Set(existingTeams.map(t => t.name.toLowerCase()));

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const email = getCellValue(row, headerMap.get('Email') || 1).toLowerCase();
    const displayName = getCellValue(row, headerMap.get('Display Name') || 2);
    const role = getCellValue(row, headerMap.get('App Role') || headerMap.get('Role') || 3).toLowerCase() || 'operator';
    const orgRole = getCellValue(row, headerMap.get('Org Role') || headerMap.get('Org Role (optional)') || 4).toLowerCase();
    const teamRole = getCellValue(row, headerMap.get('Team Role') || headerMap.get('Team Role (optional)') || 5).toLowerCase();
    const teamName = getCellValue(row, headerMap.get('Team Name') || headerMap.get('Team Name (optional)') || 6);
    const department = getCellValue(row, headerMap.get('Department') || headerMap.get('Department (optional)') || 7);

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
        column: 'App Role', 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        value: role 
      });
    }
    if (orgRole && !validOrgRoles.includes(orgRole)) {
      errors.push({ 
        sheet: 'Users', 
        row: rowNumber, 
        column: 'Org Role', 
        message: `Invalid org role. Must be one of: ${validOrgRoles.join(', ')}`,
        value: orgRole 
      });
    }
    if (teamRole && !validTeamRoles.includes(teamRole)) {
      errors.push({ 
        sheet: 'Users', 
        row: rowNumber, 
        column: 'Team Role', 
        message: `Invalid team role. Must be one of: ${validTeamRoles.join(', ')}`,
        value: teamRole 
      });
    }

    // Cross-sheet validation for team name
    if (teamName && teamNames.size > 0 && !teamNames.has(teamName.toLowerCase())) {
      warnings.push({
        sheet: 'Users',
        row: rowNumber,
        column: 'Team Name',
        message: `Team "${teamName}" not found in Teams sheet. Will attempt to match existing team.`,
        value: teamName,
        referencedValue: teamName,
      });
    }

    if (email && displayName && validRoles.includes(role) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      data.push({ 
        email, 
        display_name: displayName, 
        role, 
        org_role: orgRole || undefined,
        team_role: teamRole || undefined,
        team_name: teamName,
        department: department || undefined,
      });
    }
  });

  return { data, errors, warnings };
}

function parseWorkOrdersSheet(
  sheet: ExcelJS.Worksheet,
  existingTeams: ParsedExcelData['teams'],
  existingStations: ParsedExcelData['stations']
) {
  const data: ParsedExcelData['workOrders'] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validPriorities = ['low', 'normal', 'high', 'urgent', 'critical'];
  const validStatuses = ['pending', 'queued', 'in_progress', 'on_hold'];
  const headerMap = getHeaderMap(sheet);
  const teamNames = new Set(existingTeams.map(t => t.name.toLowerCase()));
  const stationIds = new Set(existingStations.map(s => s.station_id.toLowerCase()));

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const workOrder = getCellValue(row, headerMap.get('Work Order #') || 1);
    const title = getCellValue(row, headerMap.get('Title') || 2);
    const partNumber = getCellValue(row, headerMap.get('Part Number') || headerMap.get('Part Number (optional)') || 3);
    const operationNumber = getCellValue(row, headerMap.get('Operation #') || headerMap.get('Operation # (optional)') || 4);
    const quantityStr = getCellValue(row, headerMap.get('Quantity') || headerMap.get('Quantity (optional)') || 5);
    const quantity = quantityStr ? parseInt(quantityStr) : undefined;
    const priority = getCellValue(row, headerMap.get('Priority') || 6).toLowerCase() || 'normal';
    const status = getCellValue(row, headerMap.get('Status') || 7).toLowerCase() || 'pending';
    const stationId = getCellValue(row, headerMap.get('Station ID') || headerMap.get('Station ID (optional)') || 8);
    const teamName = getCellValue(row, headerMap.get('Team Name') || headerMap.get('Team Name (optional)') || 9);
    const dueDate = getCellValue(row, headerMap.get('Due Date') || headerMap.get('Due Date (YYYY-MM-DD)') || 10);
    const durationStr = getCellValue(row, headerMap.get('Est. Duration') || headerMap.get('Est. Duration (min)') || 11);
    const duration = durationStr ? parseInt(durationStr) : undefined;
    const tagsStr = getCellValue(row, headerMap.get('Tags') || headerMap.get('Tags (comma-separated)') || 12);
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : undefined;
    const description = getCellValue(row, headerMap.get('Description') || headerMap.get('Description (optional)') || 13);

    // Skip empty rows
    if (!workOrder && !title) return;

    // Validate required fields
    if (!workOrder) {
      errors.push({ sheet: 'Work Orders', row: rowNumber, column: 'Work Order #', message: 'Required field', value: workOrder });
    }
    if (!title) {
      errors.push({ sheet: 'Work Orders', row: rowNumber, column: 'Title', message: 'Required field', value: title });
    }

    // Validate enum values
    if (!validPriorities.includes(priority)) {
      errors.push({ 
        sheet: 'Work Orders', 
        row: rowNumber, 
        column: 'Priority', 
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
        value: priority 
      });
    }
    if (!validStatuses.includes(status)) {
      errors.push({ 
        sheet: 'Work Orders', 
        row: rowNumber, 
        column: 'Status', 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        value: status 
      });
    }

    // Cross-sheet validation
    if (stationId && stationIds.size > 0 && !stationIds.has(stationId.toLowerCase())) {
      warnings.push({
        sheet: 'Work Orders',
        row: rowNumber,
        column: 'Station ID',
        message: `Station "${stationId}" not found in Stations sheet. Will attempt to match existing station.`,
        value: stationId,
        referencedValue: stationId,
      });
    }
    if (teamName && teamNames.size > 0 && !teamNames.has(teamName.toLowerCase())) {
      warnings.push({
        sheet: 'Work Orders',
        row: rowNumber,
        column: 'Team Name',
        message: `Team "${teamName}" not found in Teams sheet. Will attempt to match existing team.`,
        value: teamName,
        referencedValue: teamName,
      });
    }

    // Validate date format
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      warnings.push({
        sheet: 'Work Orders',
        row: rowNumber,
        column: 'Due Date',
        message: `Date "${dueDate}" is not in YYYY-MM-DD format. Will attempt to parse.`,
        value: dueDate,
      });
    }

    if (workOrder && title && validPriorities.includes(priority) && validStatuses.includes(status)) {
      data.push({
        work_order: workOrder,
        title,
        part_number: partNumber || undefined,
        operation_number: operationNumber || undefined,
        quantity,
        priority,
        status,
        station_id: stationId || undefined,
        team_name: teamName || undefined,
        due_date: dueDate || undefined,
        estimated_duration: duration,
        tags,
        description: description || undefined,
      });
    }
  });

  return { data, errors, warnings };
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
