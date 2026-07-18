import { z } from "zod";
import {
  BuildingType,
  RoofType,
  ArchitecturalStyle,
  ConstructionScope,
  FoundationType,
} from "./requirement";

/**
 * Constraint Set = canonical, deterministic representation của domain
 * constraints, sinh ra bởi Constraint Set Compiler từ Requirement (xem
 * docs/features/concept-design/constraint/constraint-domain-model.md
 * và log thảo luận docs/meeting-notes/2026-07/2026-W29/2026-07-18/).
 *
 * Constraint Set Compiler là Pure Function, Deterministic, No AI —
 * schema này chỉ mô tả HÌNH DẠNG output của compiler, không phải chính
 * compiler (compiler function nằm ở bước "Compiler Prototype", sau
 * schema này).
 *
 * Không mirror 1:1 cấu trúc Requirement — đây là bản đã compile, tổ
 * chức lại theo domain phù hợp cho các module tiêu thụ phía sau (Design
 * Intent Graph, Geometry, Descriptor), không phải "Requirement v2".
 */

// --- ConstraintField<T> — shape chung cho mọi field ĐÃ COMPILE ---

export const ConstraintTypeEnum = z.enum([
  "exact", // giá trị chính xác, không đổi
  "min", // giá trị tối thiểu
  "max", // giá trị tối đa
  "required", // bắt buộc phải có (boolean/list)
  "forbidden", // không được có
  "preferred", // ưu tiên, không bắt buộc — thay cho top-level "preferences" đã bỏ
]);
export type ConstraintType = z.infer<typeof ConstraintTypeEnum>;

/**
 * Field Requirement không nhắc tới (null) → KHÔNG tạo ConstraintField
 * (nullable().default(null) ở đây), đúng nguyên tắc No Information
 * Creation — không phải trường hợp dùng `unresolved`.
 */
export function constraintField<T extends z.ZodTypeAny>(valueSchema: T) {
  return z
    .object({
      value: valueSchema,
      constraintType: ConstraintTypeEnum,
    })
    .nullable()
    .default(null);
}

// --- Range value — cho field dạng dải (vd budget: giữ nguyên min/max, không lấy trung bình) ---
export const RangeValueSchema = z.object({
  min: z.number().nullable().default(null),
  max: z.number().nullable().default(null),
});
export type RangeValue = z.infer<typeof RangeValueSchema>;

// --- metadata — compiler-internal, KHÔNG dùng ConstraintField ---
export const ConstraintSetMetadataSchema = z.object({
  compilerVersion: z.string(),
  compiledAt: z.string(), // ISO timestamp
  sourceRequirementConfirmedAt: z.string().nullable().default(null),
});
export type ConstraintSetMetadata = z.infer<typeof ConstraintSetMetadataSchema>;

/**
 * unresolved — dữ liệu Requirement CÓ tồn tại nhưng compiler CHƯA biên
 * dịch được thành constraint có cấu trúc (No Silent Drop). KHÔNG dùng
 * ConstraintField<T> — "unresolved" không có constraintType đã phân
 * loại (xem Constraint Schema Review Round 2).
 */
export const UnresolvedEntrySchema = z.object({
  sourceField: z.string(), // vd "functional.excludedRooms[2]"
  rawValue: z.unknown(),
  reason: z.string().nullable().default(null),
});
export type UnresolvedEntry = z.infer<typeof UnresolvedEntrySchema>;

// --- site ---
export const SiteConstraintsSchema = z.object({
  landArea: constraintField(z.number().positive()),
  buildingFootprint: constraintField(z.number().positive()),
  totalFloorArea: constraintField(z.number().positive()),
  frontage: constraintField(z.number().positive()),
  depth: constraintField(z.number().positive()),
  roadWidth: constraintField(z.number().positive()),
});

// --- building — functional identity của công trình ---
export const BuildingConstraintsSchema = z.object({
  buildingType: constraintField(BuildingType),
  floors: constraintField(z.number().int().positive()),
  basementLevels: constraintField(z.number().int().nonnegative()),
  constructionScope: constraintField(ConstructionScope),
});

// --- household ---
export const HouseholdConstraintsSchema = z.object({
  hasElderly: constraintField(z.boolean()),
  children: constraintField(z.number().int().nonnegative()),
  accessibilityNeeds: constraintField(z.boolean()),
});

// --- spaces ---
export const SpacesConstraintsSchema = z.object({
  bedrooms: constraintField(z.number().int().nonnegative()),
  bathrooms: constraintField(z.number().int().nonnegative()),
  livingRoom: constraintField(z.boolean()),
  kitchen: constraintField(z.boolean()),
  worshipRoom: constraintField(z.boolean()),
  storage: constraintField(z.boolean()),
  garage: constraintField(z.boolean()),
  garden: constraintField(z.boolean()),
  balcony: constraintField(z.boolean()),
  otherRooms: constraintField(z.array(z.string())),
  // excludedRooms phụ thuộc field cùng tên ở Requirement — CHƯA có
  // trong packages/shared-types/src/requirement.ts (chỉ mới quyết định
  // ở REQ-D3, chưa implement). Giữ ở đây làm phần schema đích; compiler
  // (bước sau) cần Requirement bổ sung field này trước khi map được.
  excludedRooms: constraintField(z.array(z.string())),
});

// --- structure — hệ kết cấu ---
export const StructureConstraintsSchema = z.object({
  foundationType: constraintField(FoundationType),
  roofType: constraintField(RoofType),
});

// --- style ---
export const StyleConstraintsSchema = z.object({
  architecturalStyle: constraintField(ArchitecturalStyle),
});

// --- budget ---
export const BudgetConstraintsSchema = z.object({
  budget: constraintField(RangeValueSchema), // ví dụ value polymorphic: range thay vì scalar
});

// --- ConstraintSet tổng ---
export const ConstraintSetSchema = z.object({
  metadata: ConstraintSetMetadataSchema,
  site: SiteConstraintsSchema.default({}),
  building: BuildingConstraintsSchema.default({}),
  household: HouseholdConstraintsSchema.default({}),
  spaces: SpacesConstraintsSchema.default({}),
  structure: StructureConstraintsSchema.default({}),
  style: StyleConstraintsSchema.default({}),
  budget: BudgetConstraintsSchema.default({}),
  unresolved: z.array(UnresolvedEntrySchema).default([]),
});

export type ConstraintSet = z.infer<typeof ConstraintSetSchema>;
