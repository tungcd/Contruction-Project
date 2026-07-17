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
 */
const SURVEY_NOTE =
  "Chờ khảo sát địa chất và bản vẽ kết cấu — Founder bổ sung thủ công.";

const STRUCTURE_ITEMS: { code: string; itemName: string; unit: string }[] = [
  { code: "structure.pile_driving", itemName: "Ép cọc bê tông cốt thép", unit: "m" },
  { code: "structure.excavation", itemName: "Đào móng công trình", unit: "m3" },
  { code: "structure.lean_concrete", itemName: "Bê tông lót móng", unit: "m3" },
  { code: "structure.footing_concrete", itemName: "Bê tông móng", unit: "m3" },
  { code: "structure.footing_rebar", itemName: "Cốt thép móng", unit: "tấn" },
  { code: "structure.footing_formwork", itemName: "Ván khuôn móng", unit: "m2" },
  { code: "structure.footing_masonry", itemName: "Xây tường móng", unit: "m3" },
  { code: "structure.tie_beam", itemName: "Giằng tường, dầm móng", unit: "m3" },
  { code: "structure.water_tank", itemName: "Bể nước, bể phốt", unit: "m3" },
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
