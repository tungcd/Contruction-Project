import { z } from "zod";
import { RequirementSchema } from "@acc/shared-types";

/**
 * Validate body request cho POST /api/estimate. Đặt riêng trong module
 * estimate (không đụng @acc/shared-types) vì EstimateSettings/PriceBook là
 * input riêng của Module Estimate, không thuộc Requirement đã đóng băng.
 */

const MaterialTierSchema = z.enum(["standard", "mid", "premium"]);

export const EstimateSettingsInputSchema = z.object({
  materialTier: MaterialTierSchema.optional(),
  hasArchitecturalDrawing: z.boolean().optional(),
  hasStructuralDrawing: z.boolean().optional(),
  pricingRegion: z.string().optional(),
  priceBookId: z.string().optional(),
});

const PriceBookEntrySchema = z.object({
  itemCode: z.string(),
  itemName: z.string(),
  unit: z.string(),
  materialTier: z.union([MaterialTierSchema, z.literal("all")]),
  unitPrice: z.number(),
  updatedAt: z.string(),
});

export const PriceBookInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  pricingRegion: z.string(),
  effectiveFrom: z.string(),
  entries: z.array(PriceBookEntrySchema),
  // PriceBook thật do Founder tự gửi lên không cần khai báo field này —
  // mặc định false (không phải demo). Chỉ DEMO_PRICE_BOOK mới = true.
  isDemo: z.boolean().default(false),
});

export const EstimateRequestSchema = z.object({
  requirement: RequirementSchema,
  settings: EstimateSettingsInputSchema.optional(),
  priceBook: PriceBookInputSchema.optional(),
});

export type EstimateRequestInput = z.infer<typeof EstimateRequestSchema>;
