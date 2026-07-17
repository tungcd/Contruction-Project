import type { BOQDraftLine, EstimateSettings, PriceBook } from "./types";
import { buildPlaceholderLine } from "./lineBuilders";

/**
 * Placeholder cho các nhóm không có rule cover (M3-002 mục 5.2) — toàn bộ
 * đo được từ mét dài/khối lượng THẬT trên bản vẽ, không suy ra được từ
 * Requirement (M3-001 mục 4.1: dây điện, ống nước, ván khuôn, cốt thép
 * phần thân đều đến từ bản vẽ M&E/kết cấu chi tiết).
 */
const DRAWING_NOTE = "Cần bản vẽ chi tiết — chủ thầu tự đo và nhập số.";

export function buildElectricalPlaceholderLines(
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  return [
    buildPlaceholderLine({
      code: "electrical.wiring",
      category: "Dây điện",
      itemName: "Dây điện (theo mét, theo tiết diện)",
      unit: "m",
      quantitySource: "needs_measurement",
      note: DRAWING_NOTE,
      priceBook,
      settings,
    }),
  ];
}

export function buildPlumbingPlaceholderLines(
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  return [
    buildPlaceholderLine({
      code: "plumbing.pipe",
      category: "Ống cấp thoát nước",
      itemName: "Ống nước (theo mét, theo đường kính)",
      unit: "m",
      quantitySource: "needs_measurement",
      note: DRAWING_NOTE,
      priceBook,
      settings,
    }),
  ];
}

/** Ván khuôn + cốt thép PHẦN THÂN (không phải móng — móng đã ở structurePlaceholders.ts). */
export function buildConstructionPlaceholderLines(
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  return [
    buildPlaceholderLine({
      code: "construction.formwork_body",
      category: "Ván khuôn",
      itemName: "Ván khuôn (phần thân, không phải móng)",
      unit: "m2",
      quantitySource: "needs_measurement",
      note: "Suy từ hình học cấu kiện bê tông cụ thể — " + DRAWING_NOTE,
      priceBook,
      settings,
    }),
    buildPlaceholderLine({
      code: "construction.rebar_body",
      category: "Cốt thép",
      itemName: "Cốt thép sàn/dầm (phần thân, không phải móng)",
      unit: "tấn",
      quantitySource: "needs_measurement",
      note: "Cần bản vẽ kết cấu chi tiết phần thân — " + DRAWING_NOTE,
      priceBook,
      settings,
    }),
    buildPlaceholderLine({
      code: "construction.wall_area_exact",
      category: "Tường xây",
      itemName: "Diện tích tường xây (đo chính xác)",
      unit: "m2",
      quantitySource: "needs_measurement",
      note:
        "Diện tích ước lượng thô đã có ở mục Hoàn thiện (rule_estimated) — " +
        "dòng này để chủ thầu điền số ĐO THẬT khi có bản vẽ mặt bằng chi tiết.",
      priceBook,
      settings,
    }),
  ];
}
