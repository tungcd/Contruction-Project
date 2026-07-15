import { z } from "zod";
import {
  BudgetInfoSchema,
  BuildingInfoSchema,
  FunctionalNeedsSchema,
  HouseholdInfoSchema,
  ProjectInfoSchema,
  SiteInfoSchema,
  TimelineInfoSchema,
} from "@acc/shared-types";

/**
 * Schema output của AI. Mọi thứ AI trả về PHẢI đi qua đây trước khi
 * chạm tới business logic hay database (05-Prompt-and-AI-Contract mục 2).
 *
 * Requirement dùng lại các sub-schema trong @acc/shared-types — đó là
 * Source of Truth duy nhất, không định nghĩa lại field ở đây.
 *
 * Lưu ý: không dùng RequirementSchema.deepPartial() được, vì các nhóm trong
 * RequirementSchema bị bọc .default({}) nên deepPartial không xuyên qua để
 * làm field bên trong thành optional.
 */

/** AI chỉ trả về field nó đọc được -> nhóm optional, field bên trong optional. */
export const PartialRequirementSchema = z.object({
  project: ProjectInfoSchema.partial().optional(),
  site: SiteInfoSchema.partial().optional(),
  building: BuildingInfoSchema.partial().optional(),
  household: HouseholdInfoSchema.partial().optional(),
  functional: FunctionalNeedsSchema.partial().optional(),
  budget: BudgetInfoSchema.partial().optional(),
  timeline: TimelineInfoSchema.partial().optional(),
  notes: z.string().nullable().optional(),
});
export type PartialRequirement = z.infer<typeof PartialRequirementSchema>;

export const ExtractResultSchema = z.object({
  requirement: PartialRequirementSchema,
  /** Câu hỏi AI muốn hỏi tiếp. Code sẽ lọc lại theo missingFields. */
  questions: z.array(z.string()).default([]),
  /** Giả định AI tự suy ra — hiển thị riêng để chủ thầu xác nhận. */
  assumptions: z.array(z.string()).default([]),
  /** Câu tóm tắt ngắn AI phản hồi lại người dùng. */
  summary: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0.5),
});
export type ExtractResult = z.infer<typeof ExtractResultSchema>;
