import type { Requirement } from "./requirement";

/**
 * Dữ liệu dẫn xuất — KHÔNG lưu DB, tính động (xem 03-Data-Model mục 7).
 * Đây là công thức CHUẨN dùng chung FE/BE để tránh lệch số.
 */

export interface TrackedField {
  /** path dạng "group.field" */
  key: string;
  label: string;
  /** trọng số cho điểm */
  weight: number;
  get: (r: Requirement) => unknown;
}

/** Danh sách field tính điểm Requirement Score. */
export const TRACKED_FIELDS: TrackedField[] = [
  { key: "project.projectType", label: "Loại công trình", weight: 1, get: (r) => r.project.projectType },
  { key: "project.buildingType", label: "Loại nhà", weight: 1, get: (r) => r.project.buildingType },
  { key: "project.location", label: "Địa điểm", weight: 1, get: (r) => r.project.location },
  { key: "site.landArea", label: "Diện tích đất", weight: 1, get: (r) => r.site.landArea },
  { key: "site.constructionArea", label: "Diện tích xây dựng mỗi tầng", weight: 1, get: (r) => r.site.constructionArea },
  { key: "site.frontage", label: "Mặt tiền", weight: 1, get: (r) => r.site.frontage },
  { key: "site.roadWidth", label: "Đường vào công trình", weight: 1, get: (r) => r.site.roadWidth },
  { key: "building.floors", label: "Số tầng", weight: 1, get: (r) => r.building.floors },
  { key: "building.roofType", label: "Loại mái", weight: 0.5, get: (r) => r.building.roofType },
  { key: "building.architecturalStyle", label: "Phong cách", weight: 0.5, get: (r) => r.building.architecturalStyle },
  { key: "functional.bedrooms", label: "Số phòng ngủ", weight: 1, get: (r) => r.functional.bedrooms },
  { key: "functional.bathrooms", label: "Số WC", weight: 0.5, get: (r) => r.functional.bathrooms },
  { key: "budget.budget", label: "Ngân sách", weight: 1, get: (r) => r.budget.budget },
  { key: "budget.constructionScope", label: "Phạm vi báo giá", weight: 1, get: (r) => r.budget.constructionScope },
];

function isFilled(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

/** Điểm độ đầy đủ requirement: 0..100. */
export function computeScore(requirement: Requirement): number {
  const total = TRACKED_FIELDS.reduce((s, f) => s + f.weight, 0);
  const filled = TRACKED_FIELDS.reduce(
    (s, f) => (isFilled(f.get(requirement)) ? s + f.weight : s),
    0,
  );
  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}

/** Danh sách key/label các field còn thiếu. */
export function computeMissingFields(
  requirement: Requirement,
): { key: string; label: string }[] {
  return TRACKED_FIELDS.filter((f) => !isFilled(f.get(requirement))).map(
    ({ key, label }) => ({ key, label }),
  );
}

/** Ngưỡng cho phép tạo Project Brief (xem 02-UI-Flow mục 17). */
export const BRIEF_READY_SCORE = 70;

export type ScoreLevel = "insufficient" | "preliminary" | "ready";

export function scoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "ready";
  if (score >= 50) return "preliminary";
  return "insufficient";
}
