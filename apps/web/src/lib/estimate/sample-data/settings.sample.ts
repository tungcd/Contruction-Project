import type { EstimateSettings } from "../types";

/**
 * EstimateSettings mặc định khi Founder chỉ paste Requirement mà không
 * truyền settings — dùng cho MVP target case (M3-002 mục 0): nhà ở, mái
 * bằng, không hầm, chưa có bản vẽ.
 */
export const DEFAULT_ESTIMATE_SETTINGS: EstimateSettings = {
  materialTier: "standard",
  hasArchitecturalDrawing: false,
  hasStructuralDrawing: false,
  pricingRegion: "Hà Nội",
  priceBookId: "sample-price-book",
};
