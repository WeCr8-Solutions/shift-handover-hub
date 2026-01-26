import * as XLSX from 'xlsx';
import { ALL_WORK_CENTER_TYPES } from '@/types/handoff';

// Template data with sample rows
export const STATIONS_TEMPLATE = {
  sheetName: 'Stations',
  headers: ['Station ID', 'Station Name', 'Work Center', 'Work Center Type', 'Team Name (optional)', 'Active (yes/no)'],
  sampleData: [
    ['CNC-001', 'Haas VF-2 Mill #1', 'CNC Bay 1', 'CNC Mill', 'Day Shift Team', 'yes'],
    ['CNC-002', 'Haas VF-2 Mill #2', 'CNC Bay 1', 'CNC Mill', 'Day Shift Team', 'yes'],
    ['LATHE-001', 'Mazak QT-250 Lathe', 'CNC Bay 2', 'CNC Lathe', 'Night Shift Team', 'yes'],
    ['WJ-001', 'Flow Waterjet', 'Cutting Area', 'Water Jet', '', 'yes'],
    ['WELD-001', 'TIG Station 1', 'Welding Bay', 'TIG Welding', 'Welding Team', 'yes'],
    ['INSP-001', 'CMM Station', 'Quality Lab', 'Incoming Inspection', '', 'yes'],
  ],
  validValues: {
    'Work Center Type': ALL_WORK_CENTER_TYPES,
    'Active (yes/no)': ['yes', 'no'],
  },
};

export const USERS_TEMPLATE = {
  sheetName: 'Users',
  headers: ['Email', 'Display Name', 'Role', 'Team Name (optional)'],
  sampleData: [
    ['john.smith@company.com', 'John Smith', 'operator', 'Day Shift Team'],
    ['jane.doe@company.com', 'Jane Doe', 'supervisor', 'Day Shift Team'],
    ['mike.wilson@company.com', 'Mike Wilson', 'operator', 'Night Shift Team'],
    ['sarah.johnson@company.com', 'Sarah Johnson', 'admin', ''],
    ['tom.brown@company.com', 'Tom Brown', 'viewer', ''],
  ],
  validValues: {
    'Role': ['admin', 'supervisor', 'operator', 'viewer'],
  },
};

export const TEAMS_TEMPLATE = {
  sheetName: 'Teams',
  headers: ['Team Name', 'Description'],
  sampleData: [
    ['Day Shift Team', 'Primary day shift operations team, 6AM-2PM'],
    ['Night Shift Team', 'Night shift operations, 10PM-6AM'],
    ['Swing Shift Team', 'Swing shift coverage, 2PM-10PM'],
    ['Welding Team', 'Specialized welding and fabrication team'],
    ['Quality Team', 'Quality assurance and inspection team'],
  ],
  validValues: {},
};

// Generate and download Excel template
export function downloadTemplate(templateType: 'stations' | 'users' | 'teams' | 'all') {
  const workbook = XLSX.utils.book_new();

  const templates = templateType === 'all' 
    ? [STATIONS_TEMPLATE, USERS_TEMPLATE, TEAMS_TEMPLATE]
    : templateType === 'stations' 
      ? [STATIONS_TEMPLATE]
      : templateType === 'users'
        ? [USERS_TEMPLATE]
        : [TEAMS_TEMPLATE];

  templates.forEach(template => {
    // Create worksheet with headers and sample data
    const wsData = [template.headers, ...template.sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = template.headers.map((header, i) => {
      const maxLen = Math.max(
        header.length,
        ...template.sampleData.map(row => String(row[i] || '').length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, ws, template.sheetName);

    // Add validation reference sheet for templates with valid values
    if (Object.keys(template.validValues).length > 0) {
      const validationData: string[][] = [['Column', 'Valid Values']];
      Object.entries(template.validValues).forEach(([column, values]) => {
        validationData.push([column, (values as string[]).join(', ')]);
      });
      const validationWs = XLSX.utils.aoa_to_sheet(validationData);
      validationWs['!cols'] = [{ wch: 25 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(workbook, validationWs, `${template.sheetName} - Valid Values`);
    }
  });

  // Generate filename
  const filename = templateType === 'all' 
    ? 'JobLine_Setup_Template.xlsx'
    : `JobLine_${templateType.charAt(0).toUpperCase() + templateType.slice(1)}_Template.xlsx`;

  XLSX.writeFile(workbook, filename);
}

// Parse uploaded Excel file
export interface ParsedExcelData {
  stations: Array<{
    station_id: string;
    name: string;
    work_center: string;
    work_center_type: string;
    team_name: string;
    is_active: boolean;
  }>;
  users: Array<{
    email: string;
    display_name: string;
    role: string;
    team_name: string;
  }>;
  teams: Array<{
    name: string;
    description: string;
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

export function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: ParseResult = {
          data: { stations: [], users: [], teams: [] },
          errors: [],
          warnings: [],
        };

        // Parse each sheet if it exists
        if (workbook.SheetNames.includes('Stations')) {
          const parsed = parseStationsSheet(workbook.Sheets['Stations']);
          result.data.stations = parsed.data;
          result.errors.push(...parsed.errors);
        }

        if (workbook.SheetNames.includes('Users')) {
          const parsed = parseUsersSheet(workbook.Sheets['Users']);
          result.data.users = parsed.data;
          result.errors.push(...parsed.errors);
        }

        if (workbook.SheetNames.includes('Teams')) {
          const parsed = parseTeamsSheet(workbook.Sheets['Teams']);
          result.data.teams = parsed.data;
          result.errors.push(...parsed.errors);
        }

        // Check if any data was found
        if (result.data.stations.length === 0 && 
            result.data.users.length === 0 && 
            result.data.teams.length === 0) {
          result.warnings.push('No valid data found. Make sure your sheets are named "Stations", "Users", or "Teams".');
        }

        resolve(result);
      } catch (error) {
        reject(new Error('Failed to parse Excel file. Please ensure it\'s a valid .xlsx file.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

function parseStationsSheet(sheet: XLSX.WorkSheet) {
  const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
  const data: ParsedExcelData['stations'] = [];
  const errors: ValidationError[] = [];

  rawData.forEach((row, index) => {
    const rowNum = index + 2; // Account for header row
    
    const stationId = String(row['Station ID'] || '').trim();
    const name = String(row['Station Name'] || '').trim();
    const workCenter = String(row['Work Center'] || '').trim();
    const workCenterType = String(row['Work Center Type'] || '').trim();
    const teamName = String(row['Team Name (optional)'] || '').trim();
    const activeStr = String(row['Active (yes/no)'] || 'yes').toLowerCase().trim();

    // Validate required fields
    if (!stationId) {
      errors.push({ sheet: 'Stations', row: rowNum, column: 'Station ID', message: 'Required field', value: stationId });
    }
    if (!name) {
      errors.push({ sheet: 'Stations', row: rowNum, column: 'Station Name', message: 'Required field', value: name });
    }
    if (!workCenter) {
      errors.push({ sheet: 'Stations', row: rowNum, column: 'Work Center', message: 'Required field', value: workCenter });
    }
    if (!workCenterType) {
      errors.push({ sheet: 'Stations', row: rowNum, column: 'Work Center Type', message: 'Required field', value: workCenterType });
    } else if (!ALL_WORK_CENTER_TYPES.includes(workCenterType as any)) {
      errors.push({ 
        sheet: 'Stations', 
        row: rowNum, 
        column: 'Work Center Type', 
        message: `Invalid value. Must be one of: ${ALL_WORK_CENTER_TYPES.join(', ')}`,
        value: workCenterType 
      });
    }

    if (stationId && name && workCenter && workCenterType && ALL_WORK_CENTER_TYPES.includes(workCenterType as any)) {
      data.push({
        station_id: stationId,
        name,
        work_center: workCenter,
        work_center_type: workCenterType,
        team_name: teamName,
        is_active: activeStr !== 'no',
      });
    }
  });

  return { data, errors };
}

function parseUsersSheet(sheet: XLSX.WorkSheet) {
  const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
  const data: ParsedExcelData['users'] = [];
  const errors: ValidationError[] = [];
  const validRoles = ['admin', 'supervisor', 'operator', 'viewer'];

  rawData.forEach((row, index) => {
    const rowNum = index + 2;
    
    const email = String(row['Email'] || '').trim().toLowerCase();
    const displayName = String(row['Display Name'] || '').trim();
    const role = String(row['Role'] || 'operator').trim().toLowerCase();
    const teamName = String(row['Team Name (optional)'] || '').trim();

    // Validate
    if (!email) {
      errors.push({ sheet: 'Users', row: rowNum, column: 'Email', message: 'Required field', value: email });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ sheet: 'Users', row: rowNum, column: 'Email', message: 'Invalid email format', value: email });
    }
    if (!displayName) {
      errors.push({ sheet: 'Users', row: rowNum, column: 'Display Name', message: 'Required field', value: displayName });
    }
    if (!validRoles.includes(role)) {
      errors.push({ 
        sheet: 'Users', 
        row: rowNum, 
        column: 'Role', 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        value: role 
      });
    }

    if (email && displayName && validRoles.includes(role) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      data.push({ email, display_name: displayName, role, team_name: teamName });
    }
  });

  return { data, errors };
}

function parseTeamsSheet(sheet: XLSX.WorkSheet) {
  const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
  const data: ParsedExcelData['teams'] = [];
  const errors: ValidationError[] = [];

  rawData.forEach((row, index) => {
    const rowNum = index + 2;
    
    const name = String(row['Team Name'] || '').trim();
    const description = String(row['Description'] || '').trim();

    if (!name) {
      errors.push({ sheet: 'Teams', row: rowNum, column: 'Team Name', message: 'Required field', value: name });
    }

    if (name) {
      data.push({ name, description });
    }
  });

  return { data, errors };
}
