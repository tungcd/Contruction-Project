import type { Requirement } from "./requirement";

/**
 * Dữ liệu dẫn xuất — KHÔNG lưu DB, tính động (xem 03-Data-Model mục 7).
 *
 * QUAN TRỌNG (Founder Decision): Requirement Score và Readiness là HAI khái niệm
 * ĐỘC LẬP. Score chỉ hiển thị tiến độ; Readiness là business rule riêng.
 */

// =====================================================================
// 1. Requirement Score — CHỈ hiển thị tiến độ (03-Data-Model mục 5.3.1)
// =====================================================================

export interface TrackedField {
  key: string;
  label: string;
  weight: number;
  get: (r: Requirement) => unknown;
}

/** Field tính vào thanh tiến độ. foundationType KHÔNG có mặt (khách không thể biết). */
export const TRACKED_FIELDS: TrackedField[] = [
  { key: "project.projectType", label: "Loại công trình", weight: 1, get: (r) => r.project.projectType },
  { key: "project.buildingType", label: "Loại nhà", weight: 1, get: (r) => r.project.buildingType },
  { key: "project.province", label: "Tỉnh/thành", weight: 1, get: (r) => r.project.province },
  { key: "project.district", label: "Quận/huyện", weight: 0.5, get: (r) => r.project.district },
  { key: "site.landArea", label: "Diện tích đất", weight: 1, get: (r) => r.site.landArea },
  { key: "site.totalFloorArea", label: "Tổng diện tích sàn", weight: 1, get: (r) => r.site.totalFloorArea },
  { key: "site.frontage", label: "Mặt tiền", weight: 1, get: (r) => r.site.frontage },
  { key: "site.roadWidth", label: "Đường vào công trình", weight: 1, get: (r) => r.site.roadWidth },
  { key: "building.floors", label: "Số tầng", weight: 1, get: (r) => r.building.floors },
  { key: "building.basementLevels", label: "Số tầng hầm", weight: 0.5, get: (r) => r.building.basementLevels },
  { key: "building.roofType", label: "Loại mái", weight: 0.5, get: (r) => r.building.roofType },
  { key: "building.architecturalStyle", label: "Phong cách", weight: 0.5, get: (r) => r.building.architecturalStyle },
  { key: "functional.bedrooms", label: "Số phòng ngủ", weight: 1, get: (r) => r.functional.bedrooms },
  { key: "functional.bathrooms", label: "Số WC", weight: 0.5, get: (r) => r.functional.bathrooms },
  { key: "functional.livingRoom", label: "Phòng khách", weight: 0.5, get: (r) => r.functional.livingRoom },
  { key: "functional.kitchen", label: "Bếp", weight: 0.5, get: (r) => r.functional.kitchen },
  { key: "budget.budget", label: "Ngân sách", weight: 1, get: (r) => r.budget.budgetMin ?? r.budget.budgetMax },
  { key: "budget.constructionScope", label: "Phạm vi báo giá", weight: 1, get: (r) => r.budget.constructionScope },
];

function isFilled(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

/** Điểm tiến độ requirement: 0..100. CHỈ để hiển thị, không quyết định readiness. */
export function computeScore(requirement: Requirement): number {
  const total = TRACKED_FIELDS.reduce((s, f) => s + f.weight, 0);
  const filled = TRACKED_FIELDS.reduce(
    (s, f) => (isFilled(f.get(requirement)) ? s + f.weight : s),
    0,
  );
  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}

/** Danh sách field còn thiếu (dùng cho panel gợi ý, không phải readiness). */
export function computeMissingFields(
  requirement: Requirement,
): { key: string; label: string }[] {
  return TRACKED_FIELDS.filter((f) => !isFilled(f.get(requirement))).map(
    ({ key, label }) => ({ key, label }),
  );
}

export type ScoreLevel = "insufficient" | "preliminary" | "ready";

export function scoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "ready";
  if (score >= 50) return "preliminary";
  return "insufficient";
}

// =====================================================================
// 2. Readiness — Business Rule riêng (03-Data-Model mục 5.3.1)
//    MVP chỉ implement briefReady. KHÔNG tạo logic quantity/pricing.
// =====================================================================

export interface BriefReadiness {
  ready: boolean;
  /** Nhãn các điều kiện chưa đạt, để UI chỉ rõ còn thiếu gì. */
  missing: string[];
}

export interface Readiness {
  brief: BriefReadiness;
}

/**
 * Quy tắc briefReady — CHỐT bởi Founder. Dùng null-check TƯỜNG MINH,
 * KHÔNG dùng truthy: `false` (livingRoom/kitchen) là giá trị đã xác nhận hợp lệ.
 */
export function computeBriefReady(r: Requirement): BriefReadiness {
  const checks: { label: string; ok: boolean }[] = [
    { label: "Loại công trình", ok: r.project.projectType !== null },
    { label: "Loại nhà", ok: r.project.buildingType !== null },
    { label: "Tỉnh/thành", ok: r.project.province !== null },
    { label: "Diện tích đất", ok: r.site.landArea !== null },
    { label: "Số tầng", ok: r.building.floors !== null },
    {
      label: "Số phòng ngủ",
      ok: r.functional.bedrooms !== null && r.functional.bedrooms >= 1,
    },
    { label: "Phòng khách", ok: r.functional.livingRoom !== null },
    { label: "Bếp", ok: r.functional.kitchen !== null },
  ];

  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  return { ready: missing.length === 0, missing };
}

export function computeReadiness(r: Requirement): Readiness {
  return { brief: computeBriefReady(r) };
}

/**
 * Thông tin KHÔNG chặn Brief nhưng nên hỏi nốt — hiển thị trong Project Brief.
 * Là dữ liệu dẫn xuất từ Requirement hiện tại, KHÔNG lưu DB (điều kiện 8).
 */
export function computeToConfirm(
  r: Requirement,
): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  if (r.budget.budgetMin === null && r.budget.budgetMax === null)
    out.push({ key: "budget", label: "Ngân sách" });
  if (r.budget.constructionScope === null)
    out.push({ key: "constructionScope", label: "Phạm vi báo giá" });
  if (r.site.totalFloorArea === null)
    out.push({ key: "totalFloorArea", label: "Tổng diện tích sàn" });
  if (r.building.foundationType === null)
    out.push({ key: "foundationType", label: "Loại móng" });
  return out;
}
