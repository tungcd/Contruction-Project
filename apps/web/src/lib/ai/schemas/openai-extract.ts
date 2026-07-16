import { z } from "zod";

/**
 * Schema dành RIÊNG cho OpenAI Structured Output (strict mode).
 *
 * Vì sao không dùng thẳng RequirementSchema: strict mode KHÔNG cho optional
 * và .default(). Mọi field phải required; "chưa biết" = null.
 * null -> mergeRequirement() bỏ qua, giữ giá trị cũ (05 mục 6).
 *
 * Điều kiện 6: enum được ENFORCE ở đây. Model KHÔNG được tự ý coerce style lạ
 * về giá trị gần nhất — nó phải chọn "other" và ghi nguyên văn vào *Note.
 */

const nn = <T extends z.ZodTypeAny>(s: T) => s.nullable();

export const OpenAIRequirementSchema = z.object({
  project: z.object({
    projectType: nn(z.enum(["new_build", "renovation", "interior", "extension"])),
    buildingType: nn(
      z.enum(["townhouse", "villa", "apartment", "level4", "shophouse", "other"]),
    ),
    buildingTypeNote: nn(z.string()),
    province: nn(z.string()),
    district: nn(z.string()),
    addressDetail: nn(z.string()),
  }),
  site: z.object({
    landArea: nn(z.number()),
    buildingFootprint: nn(z.number()),
    totalFloorArea: nn(z.number()),
    frontage: nn(z.number()),
    depth: nn(z.number()),
    roadWidth: nn(z.number()),
  }),
  building: z.object({
    floors: nn(z.number()),
    basementLevels: nn(z.number()),
    roofType: nn(z.enum(["flat", "japanese", "thai", "tile", "metal", "sloped", "other"])),
    roofTypeNote: nn(z.string()),
    architecturalStyle: nn(
      z.enum([
        "modern",
        "neoclassical",
        "classical",
        "minimalist",
        "indochine",
        "tropical",
        "scandinavian",
        "other",
      ]),
    ),
    architecturalStyleNote: nn(z.string()),
    foundationType: nn(z.enum(["single", "strip", "raft", "pile", "unknown"])),
  }),
  household: z.object({
    adults: nn(z.number()),
    children: nn(z.number()),
    hasElderly: nn(z.boolean()),
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
    otherRooms: z.array(z.string()),
  }),
  budget: z.object({
    budgetMin: nn(z.number()),
    budgetMax: nn(z.number()),
    budgetNote: nn(z.string()),
    constructionScope: nn(
      z.enum([
        "labor_only",
        "rough_and_finishing_labor",
        "turnkey",
        "turnkey_with_interior",
      ]),
    ),
    constructionScopeNote: nn(z.string()),
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
