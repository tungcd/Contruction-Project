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
 * Founder Decision (M3-003 completion review, mục 5.4): CHỐT gộp khoá cửa
 * + phụ kiện vào đơn giá cửa, không tách dòng riêng — không phải lựa chọn
 * tạm thời của prototype.
 *
 * M3-008 — Business Code `door.bedroom` đo theo SỐ LƯỢNG bộ cửa (bộ), trong
 * khi Standard PriceBook V1 định giá cửa composite theo DIỆN TÍCH (m2,
 * `door.composite_panel`) — khác đơn vị/công thức, KHÔNG được gộp mã (đúng
 * nguyên tắc ticket M3-008 mục "Unit"). Đây là giới hạn đã biết: dòng này sẽ
 * không tự tra được giá từ Standard PriceBook cho tới khi có quyết định đổi
 * công thức R3 sang tính m2 (thay đổi Business Rule — cần Founder duyệt).
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
      code: "door.bedroom",
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
 *
 * M3-008 — Business Code `flooring.tile_600x600`: Standard PriceBook V1 có
 * 2 dòng gạch lát nền (600x600 và 800x800) với giá khác nhau. Rule Engine
 * chỉ ra 1 dòng gộp nên PHẢI chọn 1 kích thước mặc định để tra giá — chọn
 * 600x600 (phổ biến hơn, giá thấp hơn). Đây là giả định ngầm định đã tồn
 * tại từ M3-002 (rule gộp không phân biệt loại gạch), refactor này chỉ làm
 * rõ giả định đó bằng tên mã, KHÔNG đổi công thức/Business Rule.
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
      code: "flooring.tile_600x600",
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
 *
 * M3-008 — Business Code `masonry.wall_110`: Standard PriceBook V1 định giá
 * riêng tường 110 và tường 220 (giá khác nhau nhiều). Rule Engine chỉ ra 1
 * dòng gộp nên PHẢI chọn 1 độ dày mặc định — chọn 110 (phổ biến hơn cho
 * tường ngăn phòng nhà ở). Giả định này đã ngầm định từ M3-002, refactor chỉ
 * làm rõ bằng tên mã, KHÔNG đổi công thức tính `wallArea`.
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
    code: "masonry.wall_110",
    category: "Tường xây",
    itemName: "Xây tường 110 (ước lượng thô)",
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
 *
 * M3-008 — Standard PriceBook V1 định giá trát/sơn trong nhà và ngoài nhà
 * KHÁC NHAU (`plaster.interior_wall` vs `plaster.exterior_wall`, tương tự
 * sơn). Tách 4 dòng (trước là 2) để tra đúng giá từng loại — KHÔNG đổi
 * công thức: `wallArea` (1 mặt tường) đã đại diện đúng 1 bên trong HOẶC
 * ngoài; `PLASTER_SIDES_MULTIPLIER=2` trước đây nhân đôi để ra tổng 2 mặt —
 * nay tách thành interior = `wallArea`, exterior = `wallArea`, tổng vẫn
 * bằng công thức cũ (interior + exterior = 2 × wallArea). Tương tự cho sơn:
 * mỗi mặt = plasterArea mặt đó × `PAINT_COVERAGE_RATIO`, tổng không đổi.
 */
export function rulePlasterAndPaint(
  wallArea: number | null,
  priceBook: PriceBook,
  settings: EstimateSettings,
): BOQDraftLine[] {
  if (wallArea === null) return [];

  const round2 = (n: number) => Math.round(n * 100) / 100;
  // Mỗi mặt tường (trong/ngoài) = wallArea — tổng 2 mặt vẫn đúng bằng
  // wallArea × PLASTER_SIDES_MULTIPLIER (công thức gốc M3-002, không đổi).
  const interiorPlasterArea = round2(wallArea);
  const exteriorPlasterArea = round2(wallArea * (PLASTER_SIDES_MULTIPLIER - 1));
  const interiorPaintArea = round2(interiorPlasterArea * PAINT_COVERAGE_RATIO);
  const exteriorPaintArea = round2(exteriorPlasterArea * PAINT_COVERAGE_RATIO);

  return [
    buildRuleEstimatedLine({
      code: "plaster.interior_wall",
      category: "Trát tường",
      itemName: "Trát tường trong nhà (ước lượng thô)",
      unit: "m2",
      quantity: interiorPlasterArea,
      confidence: "low",
      note: `${interiorPlasterArea} = diện tích tường xây (1 mặt). ${LOW_CONFIDENCE_NOTE}`,
      sourceRuleId: "R5",
      priceBook,
      settings,
    }),
    buildRuleEstimatedLine({
      code: "plaster.exterior_wall",
      category: "Trát tường",
      itemName: "Trát tường ngoài nhà (ước lượng thô)",
      unit: "m2",
      quantity: exteriorPlasterArea,
      confidence: "low",
      note: `${exteriorPlasterArea} = diện tích tường xây (1 mặt). ${LOW_CONFIDENCE_NOTE}`,
      sourceRuleId: "R5",
      priceBook,
      settings,
    }),
    buildRuleEstimatedLine({
      code: "paint.interior",
      category: "Sơn nước",
      itemName: "Sơn nước trong nhà (ước lượng thô)",
      unit: "m2",
      quantity: interiorPaintArea,
      confidence: "low",
      note: `${interiorPaintArea} = diện tích trát trong × ${PAINT_COVERAGE_RATIO} (trừ hao cửa/cửa sổ). ${LOW_CONFIDENCE_NOTE}`,
      sourceRuleId: "R5",
      priceBook,
      settings,
    }),
    buildRuleEstimatedLine({
      code: "paint.exterior",
      category: "Sơn nước",
      itemName: "Sơn nước ngoài nhà (ước lượng thô)",
      unit: "m2",
      quantity: exteriorPaintArea,
      confidence: "low",
      note: `${exteriorPaintArea} = diện tích trát ngoài × ${PAINT_COVERAGE_RATIO} (trừ hao cửa/cửa sổ). ${LOW_CONFIDENCE_NOTE}`,
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
 *
 * M3-008 — Business Code `stair.step_count` đo theo SỐ BẬC (bậc). Standard
 * PriceBook V1 chỉ có giá cầu thang theo THỂ TÍCH bê tông (m3,
 * `structure.stair_concrete_m250`) — khác đơn vị/nghiệp vụ hoàn toàn (đúng
 * ví dụ cảnh báo của ticket M3-008: không được map 2 mã này). Dòng này
 * KHÔNG tự tra được giá từ Standard PriceBook — giới hạn đã biết, không
 * phải lỗi.
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
      code: "stair.step_count",
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
