import type { Requirement } from "@acc/shared-types";
import type {
  BOQSection,
  EstimateSettings,
  PriceBook,
  SectionCode,
} from "./types";
import { buildStructureLines } from "./structurePlaceholders";
import {
  buildConstructionPlaceholderLines,
  buildElectricalPlaceholderLines,
  buildPlumbingPlaceholderLines,
} from "./mepPlaceholders";
import { ruleBathroomFixtures, ruleKitchenFixtures } from "./rules/sanitaryEquipment";
import {
  ruleBedroomDoors,
  ruleFloorTile,
  ruleStairSteps,
  ruleWallMasonryEstimate,
  rulePlasterAndPaint,
} from "./rules/finishing";

const SECTION_NAMES: Record<SectionCode, string> = {
  structure: "Kết cấu",
  construction: "Phần xây dựng thô",
  finishing: "Hoàn thiện",
  sanitary_equipment: "Thiết bị vệ sinh + bếp",
  plumbing: "Cấp thoát nước",
  electrical: "Điện",
};

/**
 * Rule R7 — `constructionScope` → bật/tắt section (M3-002 mục 3.1, 4).
 * Confidence: n/a (nhị phân có/không, không có khái niệm sai số).
 *
 * Theo đúng bảng M3-002 mục 3.1: structure/construction/finishing/plumbing/
 * electrical LUÔN bật bất kể constructionScope. Chỉ sanitary_equipment phụ
 * thuộc scope (chỉ bật ở turnkey_with_interior — "nội thất/thiết bị").
 *
 * air_conditioning KHÔNG có trong prototype này: M3-002 mục 3 ghi rõ đây là
 * section "tuỳ chọn, hỏi thêm chủ thầu, không map field Requirement nào
 * trực tiếp" — không có field/EstimateSettings nào hiện tại để engine tự
 * quyết định bật/tắt, nên bỏ qua thay vì đoán. Xem completion report.
 */
function isSectionEnabled(code: SectionCode, requirement: Requirement): boolean {
  if (code === "sanitary_equipment") {
    return requirement.budget.constructionScope === "turnkey_with_interior";
  }
  return true; // structure, construction, finishing, plumbing, electrical luôn bật
}

export function buildSections(
  requirement: Requirement,
  settings: EstimateSettings,
  priceBook: PriceBook,
): BOQSection[] {
  const order: SectionCode[] = [
    "structure",
    "construction",
    "finishing",
    "sanitary_equipment",
    "plumbing",
    "electrical",
  ];

  // R5 (tường xây) tính 1 LẦN DUY NHẤT ở đây rồi chia sẻ `wallArea` cho cả
  // 2 section construction/finishing — tránh tính trùng công thức.
  const wallMasonry = ruleWallMasonryEstimate(requirement, priceBook, settings);

  const sections: BOQSection[] = [];

  // `order` đánh số liền mạch theo section THỰC SỰ có mặt (1..N) — nếu đánh
  // theo vị trí gốc trong `order` (mảng khai báo phía trên), số sẽ nhảy cóc
  // khi 1 section bị loại theo constructionScope (vd 1,2,3,5,6), trông như
  // thiếu sót khi Founder đọc JSON.
  let nextOrder = 1;
  for (const code of order) {
    if (!isSectionEnabled(code, requirement)) continue;

    const lines = buildSectionLines(code, requirement, settings, priceBook, wallMasonry);
    sections.push({
      code,
      name: SECTION_NAMES[code],
      order: nextOrder++,
      lines,
    });
  }

  return sections;
}

function buildSectionLines(
  code: SectionCode,
  requirement: Requirement,
  settings: EstimateSettings,
  priceBook: PriceBook,
  wallMasonry: ReturnType<typeof ruleWallMasonryEstimate>,
) {
  switch (code) {
    case "structure":
      // Founder Decision (M3-002 mục 3.2): luôn placeholder, không tính số.
      return buildStructureLines(priceBook, settings);

    case "construction":
      return [
        ...wallMasonry.lines,
        ...buildConstructionPlaceholderLines(priceBook, settings),
      ];

    case "finishing":
      return [
        ...ruleBedroomDoors(requirement, priceBook, settings),
        ...ruleFloorTile(requirement, priceBook, settings),
        ...rulePlasterAndPaint(wallMasonry.wallArea, priceBook, settings),
        ...ruleStairSteps(requirement, priceBook, settings),
      ];

    case "sanitary_equipment":
      return [
        ...ruleBathroomFixtures(requirement, priceBook, settings),
        ...ruleKitchenFixtures(requirement, priceBook, settings),
      ];

    case "plumbing":
      return buildPlumbingPlaceholderLines(priceBook, settings);

    case "electrical":
      return buildElectricalPlaceholderLines(priceBook, settings);

    default:
      return [];
  }
}
