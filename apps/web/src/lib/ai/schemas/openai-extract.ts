import { z } from "zod";

/**
 * Schema dành RIÊNG cho OpenAI Structured Output (strict mode).
 *
 * Vì sao không dùng thẳng RequirementSchema trong @acc/shared-types:
 * strict mode của OpenAI KHÔNG cho phép optional field và .default().
 * Mọi field phải required; "chưa biết" phải biểu diễn bằng null.
 *
 * null = AI không tìm thấy thông tin -> mergeRequirement() sẽ bỏ qua,
 * giữ nguyên giá trị cũ. Đúng quy tắc "không xoá dữ liệu cũ" (05 mục 6).
 */

const nn = <T extends z.ZodTypeAny>(s: T) => s.nullable();

export const OpenAIRequirementSchema = z.object({
  project: z.object({
    projectType: nn(z.enum(["new_build", "renovation", "interior"])),
    buildingType: nn(z.enum(["townhouse", "villa", "apartment", "other"])),
    location: nn(z.string()),
  }),
  site: z.object({
    landArea: nn(z.number()),
    constructionArea: nn(z.number()),
    frontage: nn(z.number()),
    depth: nn(z.number()),
    roadWidth: nn(z.number()),
  }),
  building: z.object({
    floors: nn(z.number()),
    roofType: nn(z.string()),
    architecturalStyle: nn(z.string()),
  }),
  household: z.object({
    adults: nn(z.number()),
    children: nn(z.number()),
    elderly: nn(z.boolean()),
    cars: nn(z.number()),
  }),
  functional: z.object({
    bedrooms: nn(z.number()),
    bathrooms: nn(z.number()),
    livingRoom: nn(z.boolean()),
    kitchen: nn(z.boolean()),
    worshipRoom: nn(z.boolean()),
    storage: nn(z.boolean()),
    garage: nn(z.boolean()),
    garden: nn(z.boolean()),
    balcony: nn(z.boolean()),
  }),
  budget: z.object({
    budget: nn(z.number()),
    constructionScope: nn(z.enum(["rough", "turnkey", "interior"])),
  }),
  timeline: z.object({
    expectedStart: nn(z.string()),
    expectedFinish: nn(z.string()),
  }),
  notes: nn(z.string()),
});

export const OpenAIExtractSchema = z.object({
  requirement: OpenAIRequirementSchema,
  questions: z.array(z.string()),
  assumptions: z.array(z.string()),
  summary: z.string(),
  confidence: z.number(),
});

export type OpenAIExtract = z.infer<typeof OpenAIExtractSchema>;
