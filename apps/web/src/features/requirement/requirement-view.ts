import type { Requirement } from "@acc/shared-types";

/** Chuyển Requirement (JSON) thành các nhóm để hiển thị (02-UI-Flow mục 9). */

const projectTypeLabel: Record<string, string> = {
  new_build: "Xây mới",
  renovation: "Cải tạo",
  interior: "Nội thất",
};
const buildingTypeLabel: Record<string, string> = {
  townhouse: "Nhà phố",
  villa: "Biệt thự",
  apartment: "Chung cư",
  other: "Khác",
};
const scopeLabel: Record<string, string> = {
  rough: "Phần thô",
  turnkey: "Trọn gói",
  interior: "Bao gồm nội thất",
};

function bool(v: boolean | null): string | null {
  if (v === null) return null;
  return v ? "Có" : "Không";
}

function money(v: number | null): string | null {
  if (v === null) return null;
  if (v >= 1_000_000_000)
    return `${(v / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")} tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} triệu`;
  return `${v.toLocaleString("vi-VN")} đ`;
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

  return [
    {
      title: "Thông tin dự án",
      fields: [
        { label: "Loại công trình", value: r.project.projectType ? projectTypeLabel[r.project.projectType] ?? null : null },
        { label: "Loại nhà", value: r.project.buildingType ? buildingTypeLabel[r.project.buildingType] ?? null : null },
        { label: "Địa điểm", value: r.project.location },
      ],
    },
    {
      title: "Thông tin khu đất",
      fields: [
        { label: "Diện tích đất", value: num(r.site.landArea, " m²") },
        { label: "Diện tích xây dựng/tầng", value: num(r.site.constructionArea, " m²") },
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
        { label: "Có người già", value: bool(r.household.elderly) },
        { label: "Số ô tô", value: r.household.cars === null ? null : String(r.household.cars) },
      ],
    },
    {
      title: "Thông tin xây dựng",
      fields: [
        { label: "Số tầng", value: num(r.building.floors, " tầng") },
        { label: "Loại mái", value: r.building.roofType },
        { label: "Phong cách", value: r.building.architecturalStyle },
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
      ],
    },
    {
      title: "Ngân sách & tiến độ",
      fields: [
        { label: "Ngân sách", value: money(r.budget.budget) },
        { label: "Phạm vi báo giá", value: r.budget.constructionScope ? scopeLabel[r.budget.constructionScope] ?? null : null },
        { label: "Khởi công", value: r.timeline.expectedStart },
        { label: "Hoàn thành", value: r.timeline.expectedFinish },
      ],
    },
  ];
}

// --- Score UI (02-UI-Flow mục 12) ---
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
  if (score >= 80) return "Sẵn sàng tạo Project Brief.";
  if (score >= 50)
    return "Có thể tư vấn sơ bộ, chưa đủ để bóc tách khối lượng.";
  return "Thiếu nhiều thông tin.";
}

const statusLabel: Record<string, string> = {
  Discovery: "Đang khai thác",
  ReadyForBrief: "Sẵn sàng tạo Brief",
  BriefGenerated: "Đã tạo Brief",
};
export function projectStatusLabel(status: string): string {
  return statusLabel[status] ?? status;
}
