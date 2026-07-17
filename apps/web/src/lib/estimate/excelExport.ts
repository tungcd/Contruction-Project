import ExcelJS from "exceljs";
import type { EstimateDraft } from "./types";

/**
 * Milestone Estimate MVP — Feature 6: Export Excel v1. "Không cần giống
 * 100%" (theo đúng chỉ đạo Milestone) — mục tiêu duy nhất: Founder mở được
 * file, xem rõ số liệu, và có thể tiếp tục chỉnh sửa tay trong Excel.
 */

const QUANTITY_SOURCE_LABEL: Record<string, string> = {
  rule_estimated: "Ước lượng theo rule",
  needs_measurement: "Cần đo đạc",
  needs_survey: "Cần khảo sát",
  user_confirmed: "Đã xác nhận",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  "n/a": "—",
};

const HEADER_ROW = [
  "Hạng mục",
  "ĐVT",
  "Khối lượng",
  "Đơn giá",
  "Thành tiền",
  "Nguồn số liệu",
  "Độ tin cậy",
  "Ghi chú",
];

export async function buildEstimateWorkbook(
  draft: EstimateDraft,
  projectName: string,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI Construction Copilot";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Dự toán");
  sheet.columns = [
    { key: "itemName", width: 42 },
    { key: "unit", width: 8 },
    { key: "quantity", width: 12 },
    { key: "unitPrice", width: 14 },
    { key: "amount", width: 16 },
    { key: "quantitySource", width: 18 },
    { key: "confidence", width: 12 },
    { key: "note", width: 45 },
  ];

  sheet.addRow([`Dự án: ${projectName}`]).font = { bold: true, size: 13 };
  sheet.addRow([`Ngày xuất: ${new Date().toLocaleString("vi-VN")}`]);
  if (draft.priceBookIsDemo) {
    const warnRow = sheet.addRow([
      "BẢNG GIÁ DEMO — KHÔNG DÙNG SỐ LIỆU NÀY ĐỂ BÁO GIÁ THẬT CHO KHÁCH",
    ]);
    warnRow.font = { bold: true, color: { argb: "FFCC0000" } };
  }
  sheet.addRow([]);

  const sortedSections = [...draft.sections].sort((a, b) => a.order - b.order);
  let grandTotal = 0;

  for (const section of sortedSections) {
    const titleRow = sheet.addRow([section.name]);
    titleRow.font = { bold: true, size: 12 };

    const headerRow = sheet.addRow(HEADER_ROW);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" },
      };
      cell.border = { bottom: { style: "thin" } };
    });

    let sectionSubtotal = 0;
    for (const line of section.lines) {
      sectionSubtotal += line.amount ?? 0;
      sheet.addRow([
        line.itemName,
        line.unit,
        line.quantity,
        line.unitPrice,
        line.amount,
        QUANTITY_SOURCE_LABEL[line.quantitySource] ?? line.quantitySource,
        CONFIDENCE_LABEL[line.confidence] ?? line.confidence,
        line.note ?? "",
      ]);
    }
    grandTotal += sectionSubtotal;

    const subtotalRow = sheet.addRow(["", "", "", "Tạm tính:", sectionSubtotal]);
    subtotalRow.font = { bold: true };
    sheet.addRow([]);
  }

  const totalRow = sheet.addRow(["", "", "", "TỔNG CỘNG:", grandTotal]);
  totalRow.font = { bold: true, size: 12 };

  sheet.getColumn("unitPrice").numFmt = "#,##0";
  sheet.getColumn("amount").numFmt = "#,##0";

  return workbook.xlsx.writeBuffer();
}
