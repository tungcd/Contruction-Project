import type { BOQDraftLine, EstimateSettings, PriceBook } from "./types";
import { buildPlaceholderLine } from "./lineBuilders";

/**
 * Section "Kết cấu" — theo đúng Founder Decision (M3-002 mục 3.2, 5.1):
 * "Không biết thì để trống. Không được suy đoán."
 *
 * KHÔNG có rule nào tính số ở đây, kể cả khi
 * EstimateSettings.hasStructuralDrawing = true. Đây là quyết định phạm vi
 * (scope cut) cố định cho MVP — không đi theo state machine mục 2.2 chung.
 *
 * Tên hạng mục tham khảo từ File 2 sheet `Ket cau` (M3-001 mục 4.1) —
 * CHỈ mượn tên gọi, KHÔNG mượn cách tính/đơn giá định mức Nhà nước.
 *
 * M3-008 — Business Code taxonomy: đổi từ mã nội bộ (`structure.*`) sang mã
 * có ý nghĩa nghiệp vụ (Founder Decision, ticket M3-008), để khớp trực tiếp
 * với itemCode của Standard PriceBook V1 (không qua lớp alias). Dòng
 * "Bể nước, bể phốt" tách thành 2 dòng riêng (bể phốt / bể nước ngầm) vì
 * Standard PriceBook định giá 2 hạng mục này khác nhau — số lượng vẫn
 * `null` (placeholder), không đổi Business Rule/state machine.
 */
const SURVEY_NOTE =
  "Chờ khảo sát địa chất và bản vẽ kết cấu — Founder bổ sung thủ công.";

const STRUCTURE_ITEMS: { code: string; itemName: string; unit: string }[] = [
  { code: "foundation.precast_pile_200x200.driving", itemName: "Ép cọc bê tông cốt thép 200x200", unit: "m" },
  { code: "foundation.excavation", itemName: "Đào móng công trình", unit: "m3" },
  { code: "foundation.concrete.lean_m100", itemName: "Bê tông lót móng M100", unit: "m3" },
  { code: "foundation.concrete.m250", itemName: "Bê tông móng M250", unit: "m3" },
  { code: "foundation.rebar", itemName: "Cốt thép móng", unit: "kg" },
  { code: "foundation.formwork", itemName: "Ván khuôn móng", unit: "m2" },
  { code: "foundation.wall_masonry", itemName: "Xây tường móng", unit: "m3" },
  { code: "foundation.tie_beam", itemName: "Giằng tường, dầm móng", unit: "m3" },
  { code: "plumbing.septic_tank", itemName: "Bể phốt", unit: "m3" },
  { code: "plumbing.water_tank_underground", itemName: "Bể nước ngầm", unit: "m3" },
];

export function buildStructureLines(
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  return STRUCTURE_ITEMS.map((item) =>
    buildPlaceholderLine({
      code: item.code,
      category: "Kết cấu móng",
      itemName: item.itemName,
      unit: item.unit,
      quantitySource: "needs_survey",
      note: SURVEY_NOTE,
      priceBook,
      settings,
    }),
  );
}
