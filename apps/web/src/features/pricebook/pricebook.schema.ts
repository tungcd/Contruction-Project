import { z } from "zod";

/**
 * Milestone Estimate MVP — Feature 5: PriceBook CRUD. Validate body request,
 * đặt riêng trong feature (không đụng @acc/shared-types) vì PriceBook không
 * thuộc Requirement đã đóng băng, giống cách `lib/estimate/schema.ts` làm.
 */

const MaterialTierSchema = z.enum(["standard", "mid", "premium", "all"]);

export const PriceBookEntryInputSchema = z.object({
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string().min(1),
  materialTier: MaterialTierSchema,
  unitPrice: z.number().nonnegative(),
});

export const CreatePriceBookSchema = z.object({
  name: z.string().min(1, "Tên bảng giá không được rỗng"),
  pricingRegion: z.string().min(1),
  effectiveFrom: z.string(),
  entries: z.array(PriceBookEntryInputSchema).default([]),
});
export type CreatePriceBookInput = z.infer<typeof CreatePriceBookSchema>;

// Không cho sửa `isDemo` qua API — chỉ DEMO_PRICE_BOOK (seed) mới là demo.
export const UpdatePriceBookSchema = z.object({
  name: z.string().min(1).optional(),
  pricingRegion: z.string().min(1).optional(),
  effectiveFrom: z.string().optional(),
  entries: z.array(PriceBookEntryInputSchema).optional(),
});
export type UpdatePriceBookInput = z.infer<typeof UpdatePriceBookSchema>;

export const DuplicatePriceBookSchema = z.object({
  name: z.string().min(1).optional(),
});
