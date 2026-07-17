import type { Requirement } from "@acc/shared-types";
import type { BOQDraftLine, EstimateSettings, PriceBook } from "../types";
import { buildRuleEstimatedLine } from "../lineBuilders";
import {
  FLOOR_TILE_COVERAGE_RATIO,
  PAINT_COVERAGE_RATIO,
  PLASTER_SIDES_MULTIPLIER,
  STAIR_STEPS_PER_FLOOR,
  WALL_AREA_PER_FLOOR_AREA,
} from "../constants";

const LOW_CONFIDENCE_NOTE =
  "Ước lượng thô theo hệ số kinh nghiệm — sai số có thể >30%, cần đo lại khi có bản vẽ.";

/**
 * Rule R3 — `bedrooms` → cửa phòng ngủ (M3-002 mục 4).
 * Confidence: medium — số lượng đáng tin, kích thước/vật liệu là giả định.
 * Known limitations: không tính khoá cửa/phụ kiện riêng (gộp vào đơn giá cửa).
 */
export function ruleBedroomDoors(
  requirement: Requirement,
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  const bedrooms = requirement.functional.bedrooms;
  if (bedrooms === null || bedrooms <= 0) return [];

  return [
    buildRuleEstimatedLine({
      code: "finishing.bedroom_door",
      category: "Cửa",
      itemName: "Cửa đi phòng ngủ (900x2100, composite, đã gồm khoá + phụ kiện)",
      unit: "bộ",
      quantity: bedrooms,
      confidence: "medium",
      note: `Số lượng = số phòng ngủ (${bedrooms}). Kích thước/vật liệu là giả định.`,
      sourceRuleId: "R3",
      priceBook,
      settings,
    }),
  ];
}

/**
 * Rule R4 — `totalFloorArea` → ước lượng diện tích lát nền (M3-002 mục 4).
 * Confidence: low — hệ số kinh nghiệm, không kiểm chứng bằng 2 file mẫu.
 * Known limitations: không phân biệt loại gạch/khu vực (WC khác phòng khách).
 */
export function ruleFloorTile(
  requirement: Requirement,
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  const totalFloorArea = requirement.site.totalFloorArea;
  if (totalFloorArea === null || totalFloorArea <= 0) return [];

  const quantity = Math.round(totalFloorArea * FLOOR_TILE_COVERAGE_RATIO * 100) / 100;

  return [
    buildRuleEstimatedLine({
      code: "finishing.floor_tile",
      category: "Lát nền",
      itemName: "Gạch lát nền (gộp, chưa phân khu vực)",
      unit: "m2",
      quantity,
      confidence: "low",
      note: `${quantity} = tổng diện tích sàn (${totalFloorArea}) × ${FLOOR_TILE_COVERAGE_RATIO}. ${LOW_CONFIDENCE_NOTE}`,
      sourceRuleId: "R4",
      priceBook,
      settings,
    }),
  ];
}

/**
 * Rule R5 — `totalFloorArea` → ước lượng diện tích tường xây (phần
 * `construction`). Confidence: low — RỦI RO NHẤT trong Rule Catalog
 * (M3-002 mục 4, Rule R5): phụ thuộc mật độ tường ngăn phòng mà Requirement
 * không có field phản ánh.
 *
 * Trả về cả `plasterArea`/`paintArea` đã tính sẵn để `rulePlasterAndPaint`
 * (thuộc section `finishing`) dùng lại — tránh tính trùng công thức R5 ở
 * 2 nơi khi lắp ráp section (xem sections.ts).
 */
export function ruleWallMasonryEstimate(
  requirement: Requirement,
  priceBook: PriceBook,
  settings: EstimateSettings,
): { lines: BOQDraftLine[]; wallArea: number | null } {
  const totalFloorArea = requirement.site.totalFloorArea;
  if (totalFloorArea === null || totalFloorArea <= 0) {
    return { lines: [], wallArea: null };
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const wallArea = round2(totalFloorArea * WALL_AREA_PER_FLOOR_AREA);

  const line = buildRuleEstimatedLine({
    code: "construction.wall_masonry",
    category: "Tường xây",
    itemName: "Xây tường (ước lượng thô)",
    unit: "m2",
    quantity: wallArea,
    confidence: "low",
    note: `${wallArea} = tổng diện tích sàn (${totalFloorArea}) × ${WALL_AREA_PER_FLOOR_AREA}. ${LOW_CONFIDENCE_NOTE}`,
    sourceRuleId: "R5",
    priceBook,
    settings,
  });

  return { lines: [line], wallArea };
}

/**
 * Rule R5 (tiếp) — trát + sơn, thuộc section `finishing`. Nhận `wallArea`
 * đã tính từ `ruleWallMasonryEstimate` để không tính lại công thức R5.
 */
export function rulePlasterAndPaint(
  wallArea: number | null,
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  if (wallArea === null) return [];

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const plasterArea = round2(wallArea * PLASTER_SIDES_MULTIPLIER);
  const paintArea = round2(plasterArea * PAINT_COVERAGE_RATIO);

  return [
    buildRuleEstimatedLine({
      code: "finishing.plaster",
      category: "Trát tường",
      itemName: "Trát tường trong + ngoài (ước lượng thô)",
      unit: "m2",
      quantity: plasterArea,
      confidence: "low",
      note: `${plasterArea} = diện tích tường xây × ${PLASTER_SIDES_MULTIPLIER}. ${LOW_CONFIDENCE_NOTE}`,
      sourceRuleId: "R5",
      priceBook,
      settings,
    }),
    buildRuleEstimatedLine({
      code: "finishing.paint",
      category: "Sơn nước",
      itemName: "Sơn nước (ước lượng thô)",
      unit: "m2",
      quantity: paintArea,
      confidence: "low",
      note: `${paintArea} = diện tích trát × ${PAINT_COVERAGE_RATIO} (trừ hao cửa/cửa sổ). ${LOW_CONFIDENCE_NOTE}`,
      sourceRuleId: "R5",
      priceBook,
      settings,
    }),
  ];
}

/**
 * Rule R6 — `floors` → ước lượng số bậc cầu thang (M3-002 mục 4).
 * Confidence: low.
 * Known limitations: không biết loại cầu thang (thẳng/chữ L/chữ U) — field
 * còn thiếu (M3-001 mục 7). Không tách chiếu nghỉ/lan can.
 */
export function ruleStairSteps(
  requirement: Requirement,
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  const floors = requirement.building.floors;
  if (floors === null || floors <= 1) return [];

  const quantity = (floors - 1) * STAIR_STEPS_PER_FLOOR;

  return [
    buildRuleEstimatedLine({
      code: "finishing.stair_steps",
      category: "Cầu thang",
      itemName: "Bậc cầu thang (ước lượng thô, chưa gồm chiếu nghỉ/lan can)",
      unit: "bậc",
      quantity,
      confidence: "low",
      note: `${quantity} = (${floors} tầng - 1) × ${STAIR_STEPS_PER_FLOOR} bậc/tầng. Không biết loại cầu thang (thẳng/chữ L/chữ U) nên sai số cao. ${LOW_CONFIDENCE_NOTE}`,
      sourceRuleId: "R6",
      priceBook,
      settings,
    }),
  ];
}
