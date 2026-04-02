import ExcelJS from "exceljs";
import { WorkOrderWithLinkedData, WorkOrderLinkedData } from "@/hooks/useWorkOrderHistory";
import { format } from "date-fns";

// HTML escape function to prevent XSS attacks in generated reports
function escapeHtml(str: string | number | null | undefined): string {
  if (str == null) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

// Excel Export
export async function exportWorkOrdersToExcel(
  workOrders: WorkOrderWithLinkedData[],
  linkedDataMap?: Map<string, WorkOrderLinkedData>
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JobLine AI";
  workbook.created = new Date();

  // Main Work Orders Sheet
  const woSheet = workbook.addWorksheet("Work Orders");
  woSheet.columns = [
    { header: "Work Order", key: "work_order", width: 15 },
    { header: "Part Number", key: "part_number", width: 15 },
    { header: "Title", key: "title", width: 30 },
    { header: "Status", key: "status", width: 12 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Station", key: "station_name", width: 20 },
    { header: "Team", key: "team_name", width: 20 },
    { header: "Started At", key: "started_at", width: 18 },
    { header: "Completed At", key: "completed_at", width: 18 },
    { header: "Created At", key: "created_at", width: 18 },
  ];

  // Style header row
  woSheet.getRow(1).font = { bold: true };
  woSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  workOrders.forEach((wo) => {
    woSheet.addRow({
      work_order: wo.work_order || "",
      part_number: wo.part_number || "",
      title: wo.title,
      status: wo.status,
      priority: wo.priority,
      quantity: wo.quantity || 0,
      station_name: wo.station_name || "",
      team_name: wo.team_name || "",
      started_at: wo.started_at ? format(new Date(wo.started_at), "yyyy-MM-dd HH:mm") : "",
      completed_at: wo.completed_at ? format(new Date(wo.completed_at), "yyyy-MM-dd HH:mm") : "",
      created_at: format(new Date(wo.created_at), "yyyy-MM-dd HH:mm"),
    });
  });

  // Routing Steps Sheet
  if (linkedDataMap && linkedDataMap.size > 0) {
    const routingSheet = workbook.addWorksheet("Routing Steps");
    routingSheet.columns = [
      { header: "Work Order", key: "work_order", width: 15 },
      { header: "Step", key: "step_order", width: 8 },
      { header: "Operation", key: "operation_number", width: 12 },
      { header: "Work Center", key: "work_center", width: 15 },
      { header: "Station", key: "station_name", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Started", key: "started_at", width: 18 },
      { header: "Completed", key: "completed_at", width: 18 },
      { header: "Duration (min)", key: "duration", width: 15 },
      { header: "Operator", key: "operator_name", width: 20 },
      { header: "Inspection", key: "inspection_status", width: 12 },
    ];
    routingSheet.getRow(1).font = { bold: true };
    routingSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    workOrders.forEach((wo) => {
      const linked = linkedDataMap.get(wo.id);
      if (linked?.routing) {
        linked.routing.forEach((r) => {
          routingSheet.addRow({
            work_order: wo.work_order || "",
            step_order: r.step_order,
            operation_number: r.operation_number,
            work_center: r.work_center,
            station_name: r.station_name || "",
            status: r.status,
            started_at: r.started_at ? format(new Date(r.started_at), "yyyy-MM-dd HH:mm") : "",
            completed_at: r.completed_at ? format(new Date(r.completed_at), "yyyy-MM-dd HH:mm") : "",
            duration: r.actual_duration_minutes || "",
            operator_name: r.operator_name || "",
            inspection_status: r.inspection_status || "",
          });
        });
      }
    });

    // Handoffs Sheet
    const handoffsSheet = workbook.addWorksheet("Handoffs");
    handoffsSheet.columns = [
      { header: "Work Order", key: "work_order", width: 15 },
      { header: "Date", key: "date", width: 12 },
      { header: "Shift", key: "shift", width: 10 },
      { header: "Outgoing Operator", key: "outgoing", width: 20 },
      { header: "Incoming Operator", key: "incoming", width: 20 },
      { header: "State", key: "state", width: 15 },
      { header: "Parts Completed", key: "parts", width: 15 },
      { header: "Summary", key: "summary", width: 40 },
    ];
    handoffsSheet.getRow(1).font = { bold: true };
    handoffsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    workOrders.forEach((wo) => {
      const linked = linkedDataMap.get(wo.id);
      if (linked?.handoffs) {
        linked.handoffs.forEach((h) => {
          handoffsSheet.addRow({
            work_order: wo.work_order || "",
            date: h.date,
            shift: h.shift,
            outgoing: h.outgoing_operator_name,
            incoming: h.incoming_operator_name,
            state: h.primary_state,
            parts: h.parts_completed_this_shift,
            summary: h.handoff_summary,
          });
        });
      }
    });

    // Performance Updates Sheet
    const perfSheet = workbook.addWorksheet("Performance Updates");
    perfSheet.columns = [
      { header: "Work Order", key: "work_order", width: 15 },
      { header: "Title", key: "title", width: 30 },
      { header: "Type", key: "type", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Submitted By", key: "user", width: 20 },
      { header: "Created At", key: "created_at", width: 18 },
      { header: "Description", key: "description", width: 50 },
    ];
    perfSheet.getRow(1).font = { bold: true };
    perfSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    workOrders.forEach((wo) => {
      const linked = linkedDataMap.get(wo.id);
      if (linked?.performanceUpdates) {
        linked.performanceUpdates.forEach((p) => {
          perfSheet.addRow({
            work_order: wo.work_order || "",
            title: p.title,
            type: p.update_type,
            status: p.status,
            priority: p.priority,
            user: p.user_name,
            created_at: format(new Date(p.created_at), "yyyy-MM-dd HH:mm"),
            description: p.description,
          });
        });
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// Generate PDF-like HTML report (for printing)
export function generateWorkOrderReport(
  workOrder: WorkOrderWithLinkedData,
  linkedData?: WorkOrderLinkedData
): string {
  const formatDate = (date: string | null) => 
    date ? format(new Date(date), "MMM d, yyyy h:mm a") : "N/A";

  // Escape all user-controlled data to prevent XSS
  const safeWorkOrder = escapeHtml(workOrder.work_order);
  const safeTitle = escapeHtml(workOrder.title);
  const safePartNumber = escapeHtml(workOrder.part_number);
  const safeStatus = escapeHtml(workOrder.status);
  const safePriority = escapeHtml(workOrder.priority);
  const safeStationName = escapeHtml(workOrder.station_name);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Work Order Report - ${safeWorkOrder || safeTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #1a1a2e; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .header-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; }
        .info-box label { font-weight: bold; display: block; margin-bottom: 5px; color: #6b7280; font-size: 12px; }
        .info-box value { font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: bold; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef9c3; color: #854d0e; }
        .status-approved { background: #dbeafe; color: #1e40af; }
        .section { page-break-inside: avoid; }
        @media print { 
          .no-print { display: none; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>Work Order Report</h1>
      
      <div class="header-info">
        <div class="info-box">
          <label>Work Order #</label>
          <value>${safeWorkOrder || "N/A"}</value>
        </div>
        <div class="info-box">
          <label>Part Number</label>
          <value>${safePartNumber || "N/A"}</value>
        </div>
        <div class="info-box">
          <label>Status</label>
          <value><span class="status-badge status-${escapeHtml(workOrder.status)}">${safeStatus.toUpperCase()}</span></value>
        </div>
        <div class="info-box">
          <label>Title</label>
          <value>${safeTitle}</value>
        </div>
        <div class="info-box">
          <label>Quantity</label>
          <value>${escapeHtml(workOrder.quantity) || "N/A"}</value>
        </div>
        <div class="info-box">
          <label>Priority</label>
          <value>${safePriority.toUpperCase()}</value>
        </div>
        <div class="info-box">
          <label>Station</label>
          <value>${safeStationName || "N/A"}</value>
        </div>
        <div class="info-box">
          <label>Started At</label>
          <value>${formatDate(workOrder.started_at)}</value>
        </div>
        <div class="info-box">
          <label>Completed At</label>
          <value>${formatDate(workOrder.completed_at)}</value>
        </div>
      </div>
  `;

  if (linkedData?.routing && linkedData.routing.length > 0) {
    html += `
      <div class="section">
        <h2>Production Routing</h2>
        <table>
          <thead>
            <tr>
              <th>Step</th>
              <th>Operation</th>
              <th>Work Center</th>
              <th>Station</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Operator</th>
            </tr>
          </thead>
          <tbody>
            ${linkedData.routing.map(r => `
              <tr>
                <td>${escapeHtml(r.step_order)}</td>
                <td>${escapeHtml(r.operation_number)}</td>
                <td>${escapeHtml(r.work_center)}</td>
                <td>${escapeHtml(r.station_name) || "-"}</td>
                <td><span class="status-badge status-${escapeHtml(r.status)}">${escapeHtml(r.status)}</span></td>
                <td>${r.actual_duration_minutes ? escapeHtml(r.actual_duration_minutes) + " min" : "-"}</td>
                <td>${escapeHtml(r.operator_name) || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  if (linkedData?.handoffs && linkedData.handoffs.length > 0) {
    html += `
      <div class="section">
        <h2>Shift Handoffs</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th>Outgoing</th>
              <th>Incoming</th>
              <th>State</th>
              <th>Parts</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            ${linkedData.handoffs.map(h => `
              <tr>
                <td>${escapeHtml(h.date)}</td>
                <td>${escapeHtml(h.shift)}</td>
                <td>${escapeHtml(h.outgoing_operator_name)}</td>
                <td>${escapeHtml(h.incoming_operator_name)}</td>
                <td>${escapeHtml(h.primary_state)}</td>
                <td>${escapeHtml(h.parts_completed_this_shift)}</td>
                <td>${escapeHtml(h.handoff_summary)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  if (linkedData?.performanceUpdates && linkedData.performanceUpdates.length > 0) {
    html += `
      <div class="section">
        <h2>Job Performance Updates</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Submitted By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${linkedData.performanceUpdates.map(p => `
              <tr>
                <td>${escapeHtml(p.title)}</td>
                <td>${escapeHtml(p.update_type)}</td>
                <td><span class="status-badge status-${escapeHtml(p.status)}">${escapeHtml(p.status)}</span></td>
                <td>${escapeHtml(p.user_name)}</td>
                <td>${formatDate(p.created_at)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  if (linkedData?.downtimeEvents && linkedData.downtimeEvents.length > 0) {
    html += `
      <div class="section">
        <h2>Downtime Events</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Started</th>
              <th>Ended</th>
              <th>Duration</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${linkedData.downtimeEvents.map(d => `
              <tr>
                <td>${escapeHtml(d.downtime_type)}</td>
                <td>${formatDate(d.started_at)}</td>
                <td>${d.ended_at ? formatDate(d.ended_at) : "Ongoing"}</td>
                <td>${d.duration_minutes ? escapeHtml(d.duration_minutes) + " min" : "-"}</td>
                <td>${escapeHtml(d.reason_code) || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  if (linkedData?.history && linkedData.history.length > 0) {
    html += `
      <div class="section">
        <h2>Change History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${linkedData.history.slice(0, 20).map(h => `
              <tr>
                <td>${formatDate(h.created_at)}</td>
                <td>${escapeHtml(h.user_name)}</td>
                <td>${escapeHtml(h.action)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  html += `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")} by JobLine AI</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

// QuickBooks-compatible CSV export (flat format for IIF/CSV import)
export function exportWorkOrdersToQuickBooksCSV(
  workOrders: WorkOrderWithLinkedData[]
): Blob {
  const headers = [
    "Date",
    "Transaction Type",
    "Num",
    "Name",
    "Item",
    "Description",
    "Qty",
    "Rate",
    "Amount",
    "Class",
    "Memo",
  ];

  const rows = workOrders.map((wo) => {
    const completedDate = wo.completed_at
      ? format(new Date(wo.completed_at), "MM/dd/yyyy")
      : wo.created_at
        ? format(new Date(wo.created_at), "MM/dd/yyyy")
        : "";

    return [
      completedDate,
      "Work Order",
      wo.work_order || "",
      wo.team_name || "",
      wo.part_number || "",
      wo.title || "",
      String(wo.quantity || 1),
      "",
      "",
      wo.station_name || "",
      `Priority: ${wo.priority || "normal"} | Status: ${wo.status}`,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printReport(html: string) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}
