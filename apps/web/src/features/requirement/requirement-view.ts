import type { Requirement } from "@acc/shared-types";

/**
 * Chuyển Requirement (JSON) thành các nhóm để hiển thị (02-UI-Flow mục 9).
 * Enum KHÔNG hiển thị thô — luôn dịch qua bảng nhãn ở đây (03-Data-Model mục 5.3.2).
 * Enum "mở" dùng field *Note khi giá trị = "other".
 */

export const projectTypeLabel: Record<string, string> = {
  new_build: "Xây mới",
  renovation: "Cải tạo",
  interior: "Nội thất",
  extension: "Nâng tầng / Cơi nới",
};

export const buildingTypeLabel: Record<string, string> = {
  townhouse: "Nhà phố",
  villa: "Biệt thự",
  apartment: "Chung cư",
  level4: "Nhà cấp 4",
  shophouse: "Nhà phố thương mại",
  other: "Khác",
};

export const roofTypeLabel: Record<string, string> = {
  flat: "Mái bằng",
  japanese: "Mái Nhật",
  thai: "Mái Thái",
  tile: "Mái ngói",
  metal: "Mái tôn",
  sloped: "Mái lệch",
  other: "Khác",
};

export const architecturalStyleLabel: Record<string, string> = {
  modern: "Hiện đại",
  neoclassical: "Tân cổ điển",
  classical: "Cổ điển",
  minimalist: "Tối giản",
  indochine: "Đông Dương",
  tropical: "Nhiệt đới",
  scandinavian: "Bắc Âu",
  other: "Khác",
};

export const foundationTypeLabel: Record<string, string> = {
  single: "Móng đơn",
  strip: "Móng băng",
  raft: "Móng bè",
  pile: "Móng cọc",
  unknown: "Chưa khảo sát",
};

/** Nhãn UI 4 gói — CHỐT bởi Founder (Task Approval mục 2). KHÔNG hiển thị enum thô. */
export const constructionScopeLabel: Record<string, string> = {
  labor_only: "Chỉ nhân công",
  rough_and_finishing_labor: "Phần thô + nhân công hoàn thiện",
  turnkey: "Xây dựng trọn gói",
  turnkey_with_interior: "Xây dựng trọn gói + nội thất",
};

export function bool(v: boolean | null): string | null {
  if (v === null) return null;
  return v ? "Có" : "Không";
}

export function money(v: number | null): string {
  if (v === null) return "";
  if (v >= 1_000_000_000)
    return `${(v / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")} tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} triệu`;
  return `${v.toLocaleString("vi-VN")} đ`;
}

/** Hiển thị dải ngân sách (Budget là Requirement, không quy về 1 số — Founder Decision). */
export function budgetRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null) {
    if (min === max) return money(min);
    return `${money(min)} - ${money(max)}`;
  }
  if (min !== null) return `Từ ${money(min)}`;
  return `Dưới ${money(max)}`;
}

/** Dịch giá trị enum "mở": nếu = other thì ưu tiên hiển thị *Note nguyên văn. */
export function openEnumLabel(
  value: string | null,
  table: Record<string, string>,
  note: string | null,
): string | null {
  if (value === null) return null;
  if (value === "other" && note) return note;
  return table[value] ?? value;
}

export interface RequirementField {
  label: string;
  value: string | null; // null = chưa rõ
}
export interface RequirementGroup {
  title: string;
  fields: RequirementField[];
}

export function toRequirementGroups(r: Requirement): RequirementGroup[] {
  const num = (v: number | null, unit: string) =>
    v === null ? null : `${v}${unit}`;

  const location = [r.project.district, r.project.province]
    .filter((v): v is string => !!v)
    .join(", ");

  return [
    {
      title: "Thông tin dự án",
      fields: [
        { label: "Loại công trình", value: r.project.projectType ? projectTypeLabel[r.project.projectType] ?? null : null },
        {
          label: "Loại nhà",
          value: openEnumLabel(r.project.buildingType, buildingTypeLabel, r.project.buildingTypeNote),
        },
        { label: "Địa điểm", value: location || null },
        { label: "Địa chỉ chi tiết", value: r.project.addressDetail },
      ],
    },
    {
      title: "Thông tin khu đất",
      fields: [
        { label: "Diện tích đất", value: num(r.site.landArea, " m²") },
        { label: "Diện tích xây dựng (tầng 1)", value: num(r.site.buildingFootprint, " m²") },
        { label: "Tổng diện tích sàn", value: num(r.site.totalFloorArea, " m²") },
        { label: "Mặt tiền", value: num(r.site.frontage, " m") },
        { label: "Chiều sâu", value: num(r.site.depth, " m") },
        { label: "Đường vào", value: num(r.site.roadWidth, " m") },
      ],
    },
    {
      title: "Hộ gia đình",
      fields: [
        { label: "Người lớn", value: r.household.adults === null ? null : String(r.household.adults) },
        { label: "Trẻ nhỏ", value: r.household.children === null ? null : String(r.household.children) },
        { label: "Có người già", value: bool(r.household.hasElderly) },
        { label: "Số ô tô", value: r.household.cars === null ? null : String(r.household.cars) },
      ],
    },
    {
      title: "Thông tin xây dựng",
      fields: [
        { label: "Số tầng", value: num(r.building.floors, " tầng") },
        { label: "Số tầng hầm", value: r.building.basementLevels === null ? null : String(r.building.basementLevels) },
        { label: "Loại mái", value: openEnumLabel(r.building.roofType, roofTypeLabel, r.building.roofTypeNote) },
        {
          label: "Phong cách",
          value: openEnumLabel(r.building.architecturalStyle, architecturalStyleLabel, r.building.architecturalStyleNote),
        },
        { label: "Loại móng", value: r.building.foundationType ? foundationTypeLabel[r.building.foundationType] ?? null : null },
      ],
    },
    {
      title: "Công năng",
      fields: [
        { label: "Phòng ngủ", value: r.functional.bedrooms === null ? null : String(r.functional.bedrooms) },
        { label: "WC", value: r.functional.bathrooms === null ? null : String(r.functional.bathrooms) },
        { label: "Phòng khách", value: bool(r.functional.livingRoom) },
        { label: "Bếp", value: bool(r.functional.kitchen) },
        { label: "Phòng thờ", value: bool(r.functional.worshipRoom) },
        { label: "Gara / sân ô tô", value: bool(r.functional.garage) },
        { label: "Kho", value: bool(r.functional.storage) },
        { label: "Sân vườn", value: bool(r.functional.garden) },
        { label: "Ban công", value: bool(r.functional.balcony) },
        { label: "Phòng khác", value: r.functional.otherRooms.length ? r.functional.otherRooms.join(", ") : null },
      ],
    },
    {
      title: "Ngân sách & tiến độ",
      fields: [
        { label: "Ngân sách", value: budgetRange(r.budget.budgetMin, r.budget.budgetMax) },
        {
          label: "Phạm vi báo giá",
          value: r.budget.constructionScope ? constructionScopeLabel[r.budget.constructionScope] ?? null : null,
        },
        { label: "Khởi công", value: r.timeline.expectedStart },
        { label: "Hoàn thành", value: r.timeline.expectedFinish },
      ],
    },
  ];
}

// --- Score UI (02-UI-Flow mục 12) — CHỈ hiển thị tiến độ, KHÔNG quyết định readiness ---
export function scoreColorClass(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}
export function scoreBarClass(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}
export function scoreHint(score: number): string {
  if (score >= 80) return "Đã thu thập gần đầy đủ thông tin.";
  if (score >= 50) return "Đã thu thập được một phần thông tin.";
  return "Còn thiếu nhiều thông tin.";
}

const statusLabel: Record<string, string> = {
  Discovery: "Đang khai thác",
  ReadyForBrief: "Sẵn sàng tạo Brief",
  BriefGenerated: "Đã tạo Brief",
};
export function projectStatusLabel(status: string): string {
  return statusLabel[status] ?? status;
}
