import ExcelJS from "exceljs";
import { QuoteWithLinkedData } from "@/hooks/useQuoteHistory";
import { format } from "date-fns";

export async function exportQuotesToExcel(
  quotes: QuoteWithLinkedData[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JobLine AI";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Quotes");
  sheet.columns = [
    { header: "Quote #", key: "quote_number", width: 15 },
    { header: "Part Number", key: "part_number", width: 15 },
    { header: "Title", key: "title", width: 30 },
    { header: "Status", key: "status", width: 12 },
    { header: "Priority", key: "priority", width: 10 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Station", key: "station_name", width: 20 },
    { header: "Team", key: "team_name", width: 20 },
    { header: "Created At", key: "created_at", width: 18 },
    { header: "Completed At", key: "completed_at", width: 18 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  quotes.forEach((q) => {
    sheet.addRow({
      quote_number: q.work_order || "",
      part_number: q.part_number || "",
      title: q.title,
      status: q.status,
      priority: q.priority,
      quantity: q.quantity || 0,
      station_name: q.station_name || "",
      team_name: q.team_name || "",
      created_at: format(new Date(q.created_at), "yyyy-MM-dd HH:mm"),
      completed_at: q.completed_at ? format(new Date(q.completed_at), "yyyy-MM-dd HH:mm") : "",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function exportQuotesToQuickBooksCSV(
  quotes: QuoteWithLinkedData[]
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

  const rows = quotes.map((q) => {
    const date = q.completed_at
      ? format(new Date(q.completed_at), "MM/dd/yyyy")
      : q.created_at
        ? format(new Date(q.created_at), "MM/dd/yyyy")
        : "";

    return [
      date,
      "Estimate",
      q.work_order || "",
      q.team_name || "",
      q.part_number || "",
      q.title || "",
      String(q.quantity || 1),
      "",
      "",
      q.station_name || "",
      `Priority: ${q.priority || "normal"} | Status: ${q.status}`,
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
