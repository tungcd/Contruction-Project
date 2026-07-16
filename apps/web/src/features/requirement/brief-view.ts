import type { Requirement } from "@acc/shared-types";
import {
  architecturalStyleLabel,
  bool,
  budgetRange,
  buildingTypeLabel,
  constructionScopeLabel,
  openEnumLabel,
  projectTypeLabel,
  roofTypeLabel,
} from "./requirement-view";

/**
 * Project Brief (P0-001) — render TRỰC TIẾP từ Requirement đã chuẩn hoá.
 *
 * KHÔNG gọi AI để sinh nội dung (ticket: "Không làm: AI Rewrite"; section 9
 * "Không suy đoán ngoài Requirement"). Toàn bộ là hàm thuần, deterministic —
 * cùng Requirement luôn ra cùng Brief.
 */

export interface BriefField {
  label: string;
  value: string;
}

export interface BriefSection {
  title: string;
  /** Field đã có giá trị — field null bị lược bỏ, không hiện "chưa rõ" trong Brief. */
  fields: BriefField[];
}

function present(label: string, value: string | null): BriefField | null {
  return value ? { label, value } : null;
}

function compact(fields: (BriefField | null)[]): BriefField[] {
  return fields.filter((f): f is BriefField => f !== null);
}

/** Section 1-4: thông tin nền — luôn hiển thị (có thể rỗng nếu chưa thu thập gì). */
export function buildCoreSections(r: Requirement): BriefSection[] {
  const location = [r.project.district, r.project.province]
    .filter((v): v is string => !!v)
    .join(", ");

  return [
    {
      title: "Thông tin dự án",
      fields: compact([
        present(
          "Loại công trình",
          r.project.projectType ? projectTypeLabel[r.project.projectType] ?? null : null,
        ),
        present(
          "Loại nhà",
          openEnumLabel(r.project.buildingType, buildingTypeLabel, r.project.buildingTypeNote),
        ),
        present("Địa điểm", location || null),
      ]),
    },
    {
      title: "Thông tin khu đất",
      fields: compact([
        present("Diện tích đất", r.site.landArea !== null ? `${r.site.landArea} m²` : null),
        present(
          "Diện tích xây dựng (tầng 1)",
          r.site.buildingFootprint !== null ? `${r.site.buildingFootprint} m²` : null,
        ),
        present(
          "Tổng diện tích sàn",
          r.site.totalFloorArea !== null ? `${r.site.totalFloorArea} m²` : null,
        ),
        present("Số tầng", r.building.floors !== null ? `${r.building.floors} tầng` : null),
        present(
          "Mái",
          openEnumLabel(r.building.roofType, roofTypeLabel, r.building.roofTypeNote),
        ),
      ]),
    },
    {
      title: "Thông tin gia đình",
      fields: compact([
        present("Người lớn", r.household.adults !== null ? String(r.household.adults) : null),
        present("Trẻ em", r.household.children !== null ? String(r.household.children) : null),
        present("Người già", bool(r.household.hasElderly)),
      ]),
    },
    {
      title: "Nhu cầu công năng",
      fields: compact([
        present("Phòng ngủ", r.functional.bedrooms !== null ? String(r.functional.bedrooms) : null),
        present("WC", r.functional.bathrooms !== null ? String(r.functional.bathrooms) : null),
        present("Phòng khách", bool(r.functional.livingRoom)),
        present("Bếp", bool(r.functional.kitchen)),
        present("Phòng thờ", bool(r.functional.worshipRoom)),
        present("Gara", bool(r.functional.garage)),
        present("Ban công", bool(r.functional.balcony)),
        present("Kho", bool(r.functional.storage)),
        present(
          "Phòng khác",
          r.functional.otherRooms.length ? r.functional.otherRooms.join(", ") : null,
        ),
      ]),
    },
  ];
}

/** Section 5: Ngân sách — chỉ hiện nếu có (ticket: "Nếu có"). */
export function buildBudgetSection(r: Requirement): BriefSection | null {
  const range = budgetRange(r.budget.budgetMin, r.budget.budgetMax);
  const fields = compact([
    present("Ngân sách dự kiến", range),
    present("Ghi chú", r.budget.budgetNote),
  ]);
  return fields.length ? { title: "Ngân sách", fields } : null;
}

/** Section 6: Phạm vi báo giá — chỉ hiện nếu có. */
export function buildScopeSection(r: Requirement): BriefSection | null {
  const fields = compact([
    present(
      "Phạm vi báo giá",
      r.budget.constructionScope ? constructionScopeLabel[r.budget.constructionScope] ?? null : null,
    ),
    present("Ghi chú", r.budget.constructionScopeNote),
  ]);
  return fields.length ? { title: "Phạm vi báo giá", fields } : null;
}

/**
 * Section 9: Đánh giá sơ bộ — đoạn văn ngắn ghép từ Requirement hiện có.
 * KHÔNG dùng AI, KHÔNG suy đoán thêm field nào ngoài dữ liệu đã có.
 */
export function buildSummaryParagraph(r: Requirement): string {
  const parts: string[] = [];

  const projectTypeText = r.project.projectType ? projectTypeLabel[r.project.projectType] : null;
  const location = [r.project.district, r.project.province].filter((v): v is string => !!v).join(", ");
  if (projectTypeText || location) {
    parts.push(
      `Dự án ${projectTypeText ? projectTypeText.toLowerCase() : "chưa rõ loại hình"}${location ? ` tại ${location}` : ""}.`,
    );
  }

  const siteBits: string[] = [];
  if (r.site.landArea !== null) siteBits.push(`đất ${r.site.landArea}m²`);
  if (r.building.floors !== null) siteBits.push(`${r.building.floors} tầng`);
  if (siteBits.length) parts.push(`Quy mô: ${siteBits.join(", ")}.`);

  const needBits: string[] = [];
  if (r.functional.bedrooms !== null) needBits.push(`${r.functional.bedrooms} phòng ngủ`);
  if (r.functional.bathrooms !== null) needBits.push(`${r.functional.bathrooms} WC`);
  if (needBits.length) parts.push(`Công năng chính: ${needBits.join(", ")}.`);

  const budget = budgetRange(r.budget.budgetMin, r.budget.budgetMax);
  const scope = r.budget.constructionScope
    ? constructionScopeLabel[r.budget.constructionScope]
    : null;
  if (budget || scope) {
    parts.push(
      `Ngân sách${budget ? ` khoảng ${budget}` : " chưa xác định"}${scope ? `, phạm vi báo giá: ${scope.toLowerCase()}` : ""}.`,
    );
  }

  if (parts.length === 0) {
    return "Chưa có đủ thông tin để đánh giá sơ bộ. Cần khai thác thêm yêu cầu khách hàng.";
  }
  return parts.join(" ");
}
