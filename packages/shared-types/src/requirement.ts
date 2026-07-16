import { z } from "zod";

/**
 * Requirement = Source of Truth của một dự án (xem 03-Data-Model.md v0.2 — ĐÃ ĐÓNG BĂNG).
 * Mọi field đều nullable: null = chưa biết (Unknown). AI chỉ ghi đè field
 * được cập nhật, không xoá dữ liệu cũ (xem 05-Prompt-and-AI-Contract.md).
 */

// --- Enums dùng chung ---
export const ProjectType = z.enum([
  "new_build", // Xây mới
  "renovation", // Cải tạo
  "interior", // Chỉ nội thất
  "extension", // Nâng tầng / cơi nới
]);
export type ProjectType = z.infer<typeof ProjectType>;

export const BuildingType = z.enum([
  "townhouse", // Nhà phố
  "villa", // Biệt thự
  "apartment", // Chung cư / Căn hộ
  "level4", // Nhà cấp 4
  "shophouse", // Nhà phố thương mại
  "other",
]);
export type BuildingType = z.infer<typeof BuildingType>;

export const RoofType = z.enum([
  "flat", // Mái bằng
  "japanese", // Mái Nhật
  "thai", // Mái Thái
  "tile", // Mái ngói
  "metal", // Mái tôn
  "sloped", // Mái lệch
  "other",
]);
export type RoofType = z.infer<typeof RoofType>;

export const ArchitecturalStyle = z.enum([
  "modern", // Hiện đại
  "neoclassical", // Tân cổ điển
  "classical", // Cổ điển
  "minimalist", // Tối giản
  "indochine", // Đông Dương
  "tropical", // Nhiệt đới
  "scandinavian", // Bắc Âu
  "other",
]);
export type ArchitecturalStyle = z.infer<typeof ArchitecturalStyle>;

export const ConstructionScope = z.enum([
  "labor_only", // Chỉ nhân công
  "rough_and_finishing_labor", // Phần thô + nhân công hoàn thiện
  "turnkey", // Xây dựng trọn gói
  "turnkey_with_interior", // Trọn gói + nội thất
]);
export type ConstructionScope = z.infer<typeof ConstructionScope>;

export const FoundationType = z.enum([
  "single", // Móng đơn
  "strip", // Móng băng
  "raft", // Móng bè
  "pile", // Móng cọc
  "unknown", // Chưa khảo sát — giá trị hợp lệ ở Discovery
]);
export type FoundationType = z.infer<typeof FoundationType>;

// --- Nhóm thông tin (xem 03-Data-Model mục 5.3) ---

export const ProjectInfoSchema = z.object({
  projectType: ProjectType.nullable().default(null),
  buildingType: BuildingType.nullable().default(null),
  buildingTypeNote: z.string().nullable().default(null),
  province: z.string().nullable().default(null),
  district: z.string().nullable().default(null),
  addressDetail: z.string().nullable().default(null),
});

export const SiteInfoSchema = z.object({
  landArea: z.number().positive().nullable().default(null), // m² — diện tích khu đất
  buildingFootprint: z.number().positive().nullable().default(null), // m² — chiếm đất tầng 1
  totalFloorArea: z.number().positive().nullable().default(null), // m² — TỔNG sàn (biến chính BOQ)
  frontage: z.number().positive().nullable().default(null), // m
  depth: z.number().positive().nullable().default(null), // m
  roadWidth: z.number().positive().nullable().default(null), // m
});

export const BuildingInfoSchema = z.object({
  floors: z.number().int().positive().nullable().default(null), // tầng nổi chính
  basementLevels: z.number().int().nonnegative().nullable().default(null), // 0 hợp lệ
  roofType: RoofType.nullable().default(null),
  roofTypeNote: z.string().nullable().default(null),
  architecturalStyle: ArchitecturalStyle.nullable().default(null),
  architecturalStyleNote: z.string().nullable().default(null),
  foundationType: FoundationType.nullable().default(null),
});

export const HouseholdInfoSchema = z.object({
  adults: z.number().int().nonnegative().nullable().default(null),
  children: z.number().int().nonnegative().nullable().default(null),
  hasElderly: z.boolean().nullable().default(null), // có người già ở cùng
  cars: z.number().int().nonnegative().nullable().default(null),
});

export const FunctionalNeedsSchema = z.object({
  bedrooms: z.number().int().nonnegative().nullable().default(null),
  bathrooms: z.number().int().nonnegative().nullable().default(null),
  livingRoom: z.boolean().nullable().default(null),
  kitchen: z.boolean().nullable().default(null),
  worshipRoom: z.boolean().nullable().default(null), // phòng thờ
  storage: z.boolean().nullable().default(null), // kho
  garage: z.boolean().nullable().default(null), // gara / sân ô tô
  garden: z.boolean().nullable().default(null), // sân vườn
  balcony: z.boolean().nullable().default(null), // ban công
  otherRooms: z.array(z.string()).default([]), // phòng ngoài danh sách
});

export const BudgetInfoSchema = z.object({
  budgetMin: z.number().positive().nullable().default(null), // VNĐ — cận dưới
  budgetMax: z.number().positive().nullable().default(null), // VNĐ — cận trên
  budgetNote: z.string().nullable().default(null), // nguyên văn
  constructionScope: ConstructionScope.nullable().default(null),
  constructionScopeNote: z.string().nullable().default(null),
});

export const TimelineInfoSchema = z.object({
  expectedStart: z.string().nullable().default(null),
  expectedFinish: z.string().nullable().default(null),
});

// --- Requirement tổng ---
export const RequirementSchema = z.object({
  project: ProjectInfoSchema.default({}),
  site: SiteInfoSchema.default({}),
  building: BuildingInfoSchema.default({}),
  household: HouseholdInfoSchema.default({}),
  functional: FunctionalNeedsSchema.default({}),
  budget: BudgetInfoSchema.default({}),
  timeline: TimelineInfoSchema.default({}),
  notes: z.string().nullable().default(null),
});

export type Requirement = z.infer<typeof RequirementSchema>;

/** Requirement rỗng — dùng khi tạo Project mới. */
export function emptyRequirement(): Requirement {
  return RequirementSchema.parse({});
}
