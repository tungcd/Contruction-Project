import type { BOQDraftLine, EstimateSettings, PriceBook } from "./types";
import { buildPlaceholderLine } from "./lineBuilders";

/**
 * Placeholder cho các nhóm không có rule cover (M3-002 mục 5.2) — toàn bộ
 * đo được từ mét dài/khối lượng THẬT trên bản vẽ, không suy ra được từ
 * Requirement (M3-001 mục 4.1: dây điện, ống nước, ván khuôn, cốt thép
 * phần thân đều đến từ bản vẽ M&E/kết cấu chi tiết).
 *
 * M3-008 — Business Code taxonomy: điện/nước đổi từ đo "theo mét" sang
 * "theo điểm" (Founder Decision, ticket M3-008 — ví dụ `electrical.switch`,
 * `plumbing.cold_water`) vì Standard PriceBook V1 định giá theo điểm lắp
 * đặt, không có đơn giá theo mét cho hạng mục này — khớp đúng cách chủ thầu
 * thực tế báo giá điện nước (theo điểm, không theo mét dây). Số lượng vẫn
 * `null` (placeholder chờ chủ thầu đo/đếm), không đổi Business Rule.
 *
 * Ván khuôn/cốt thép phần thân tách theo cấu kiện (cột/dầm/sàn) vì Standard
 * PriceBook định giá riêng từng cấu kiện — gộp chung sẽ không bao giờ tra
 * được giá dưới cơ chế lookup BusinessCode+Tier (không có fallback tên/loại).
 */
const DRAWING_NOTE = "Cần bản vẽ chi tiết — chủ thầu tự đo và nhập số.";

export function buildElectricalPlaceholderLines(
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  const items: { code: string; itemName: string }[] = [
    { code: "electrical.socket", itemName: "Điểm ổ cắm (đi dây âm tường)" },
    { code: "electrical.switch", itemName: "Điểm công tắc/đèn (đi dây âm tường)" },
  ];
  return items.map((item) =>
    buildPlaceholderLine({
      code: item.code,
      category: "Điện",
      itemName: item.itemName,
      unit: "điểm",
      quantitySource: "needs_measurement",
      note: DRAWING_NOTE,
      priceBook,
      settings,
    }),
  );
}

export function buildPlumbingPlaceholderLines(
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  const items: { code: string; itemName: string }[] = [
    { code: "plumbing.cold_water", itemName: "Điểm cấp nước lạnh" },
    { code: "plumbing.hot_water", itemName: "Điểm cấp nước nóng" },
    { code: "plumbing.drain", itemName: "Điểm thoát nước" },
  ];
  return items.map((item) =>
    buildPlaceholderLine({
      code: item.code,
      category: "Cấp thoát nước",
      itemName: item.itemName,
      unit: "điểm",
      quantitySource: "needs_measurement",
      note: DRAWING_NOTE,
      priceBook,
      settings,
    }),
  );
}

/** Ván khuôn + cốt thép PHẦN THÂN (không phải móng — móng đã ở structurePlaceholders.ts). */
export function buildConstructionPlaceholderLines(
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  const formworkItems: { code: string; itemName: string }[] = [
    { code: "structure.column_formwork", itemName: "Ván khuôn cột" },
    { code: "structure.beam_formwork", itemName: "Ván khuôn dầm" },
    { code: "structure.slab_formwork", itemName: "Ván khuôn sàn" },
  ];
  const rebarItems: { code: string; itemName: string }[] = [
    { code: "structure.beam_rebar", itemName: "Cốt thép dầm gia công lắp dựng" },
    { code: "structure.slab_rebar", itemName: "Cốt thép sàn gia công lắp dựng" },
  ];

  return [
    ...formworkItems.map((item) =>
      buildPlaceholderLine({
        code: item.code,
        category: "Ván khuôn",
        itemName: item.itemName,
        unit: "m2",
        quantitySource: "needs_measurement",
        note: "Suy từ hình học cấu kiện bê tông cụ thể — " + DRAWING_NOTE,
        priceBook,
        settings,
      }),
    ),
    ...rebarItems.map((item) =>
      buildPlaceholderLine({
        code: item.code,
        category: "Cốt thép",
        itemName: item.itemName,
        unit: "kg",
        quantitySource: "needs_measurement",
        note: "Cần bản vẽ kết cấu chi tiết phần thân — " + DRAWING_NOTE,
        priceBook,
        settings,
      }),
    ),
    buildPlaceholderLine({
      code: "masonry.wall_area_measured",
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
