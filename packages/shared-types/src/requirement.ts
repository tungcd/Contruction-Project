import { z } from "zod";

/**
 * Requirement = Source of Truth của một dự án (xem 03-Data-Model.md).
 * Mọi field đều nullable: null = chưa biết (Unknown). AI chỉ ghi đè field
 * được cập nhật, không xoá dữ liệu cũ (xem 05-Prompt-and-AI-Contract.md).
 */

// --- Enums dùng chung ---
export const ProjectType = z.enum(["new_build", "renovation", "interior"]);
export type ProjectType = z.infer<typeof ProjectType>;

export const BuildingType = z.enum([
  "townhouse", // Nhà phố
  "villa", // Biệt thự
  "apartment", // Chung cư / Căn hộ
  "other",
]);
export type BuildingType = z.infer<typeof BuildingType>;

export const ConstructionScope = z.enum([
  "rough", // Phần thô
  "turnkey", // Trọn gói
  "interior", // Bao gồm nội thất
]);
export type ConstructionScope = z.infer<typeof ConstructionScope>;

// --- Nhóm thông tin (xem 02-UI-Flow mục 9 & 03-Data-Model mục 5.3) ---

export const ProjectInfoSchema = z.object({
  projectType: ProjectType.nullable().default(null),
  buildingType: BuildingType.nullable().default(null),
  location: z.string().nullable().default(null),
});

export const SiteInfoSchema = z.object({
  landArea: z.number().positive().nullable().default(null), // m2
  constructionArea: z.number().positive().nullable().default(null), // m2/tầng
  frontage: z.number().positive().nullable().default(null), // mặt tiền (m)
  depth: z.number().positive().nullable().default(null), // chiều sâu (m)
  roadWidth: z.number().positive().nullable().default(null), // đường vào (m)
});

export const BuildingInfoSchema = z.object({
  floors: z.number().int().positive().nullable().default(null),
  roofType: z.string().nullable().default(null), // mái Nhật, mái Thái, mái bằng...
  architecturalStyle: z.string().nullable().default(null), // hiện đại, tân cổ điển...
});

export const HouseholdInfoSchema = z.object({
  adults: z.number().int().nonnegative().nullable().default(null),
  children: z.number().int().nonnegative().nullable().default(null),
  elderly: z.boolean().nullable().default(null), // có người già ở cùng
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
});

export const BudgetInfoSchema = z.object({
  budget: z.number().positive().nullable().default(null), // VNĐ
  constructionScope: ConstructionScope.nullable().default(null),
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

/** Requirement rỗng (mọi field = null) — dùng khi tạo Project mới. */
export function emptyRequirement(): Requirement {
  return RequirementSchema.parse({});
}
