/**
 * Data contract cho Estimate Engine — đúng theo
 * documents/CHATGPT_CONTEXT/Design-M3-002-BOQ-Draft-Schema-Rule-Catalog.md
 *
 * Ticket M3-003 chỉ định "EstimateDraft (JSON)", KHÔNG lưu DB — nên các
 * field thuộc entity `BOQDraft` trong M3-002 (id, projectId, status,
 * generatedFromRequirementVersion...) KHÔNG có ở đây. Đây là bản tính
 * thuần, không phải bản ghi.
 */

export type MaterialTier = "standard" | "mid" | "premium";

/**
 * Input riêng cho Module Estimate — KHÔNG nằm trong Requirement đã đóng
 * băng (Founder Decision M3-002 mục 0).
 */
export interface EstimateSettings {
  materialTier: MaterialTier;
  hasArchitecturalDrawing: boolean;
  hasStructuralDrawing: boolean;
  pricingRegion: string;
  priceBookId: string;
}

export interface PriceBookEntry {
  itemCode: string;
  itemName: string;
  unit: string;
  /** "all" = giá không phân biệt phân khúc (M3-002 mục 6.2). */
  materialTier: MaterialTier | "all";
  unitPrice: number;
  updatedAt: string;
}

export interface PriceBook {
  id: string;
  name: string;
  pricingRegion: string;
  effectiveFrom: string;
  entries: PriceBookEntry[];
  /**
   * Founder Decision (M3-003 completion review): đánh dấu rõ bảng giá demo
   * để tránh dùng nhầm vào báo giá thật. `true` = giá bịa để review Engine,
   * KHÔNG phải giá thị trường.
   */
  isDemo: boolean;
}

export type QuantitySource =
  | "rule_estimated"
  | "needs_measurement"
  | "needs_survey"
  | "user_confirmed";

export type Confidence = "high" | "medium" | "low" | "n/a";

export type SectionCode =
  | "structure"
  | "construction"
  | "finishing"
  | "sanitary_equipment"
  | "plumbing"
  | "electrical";
// air_conditioning: Founder Decision — bỏ hẳn khỏi MVP, chuyển sang backlog
// (không phải gap tạm thời của prototype). Không thêm lại nếu chưa có
// quyết định mới về field/EstimateSettings nào điều khiển nó.

export interface BOQDraftLine {
  code: string;
  category: string;
  itemName: string;
  unit: string;
  /** null = chưa biết. KHÔNG dùng 0 để thay cho "chưa biết" (M3-002 mục 1.5). */
  quantity: number | null;
  unitPrice: number | null;
  /** null nếu quantity hoặc unitPrice là null — KHÔNG tính bằng 0. */
  amount: number | null;
  quantitySource: QuantitySource;
  confidence: Confidence;
  note: string | null;
  /** Luôn true ở MVP (M3-002 mục 1.5). */
  editable: true;
  /** Trỏ về rule nào trong Rule Catalog đã sinh dòng này, null nếu là placeholder cố định. */
  sourceRuleId: string | null;
}

export interface BOQSection {
  code: SectionCode;
  name: string;
  order: number;
  lines: BOQDraftLine[];
}

export interface EstimateDraft {
  generatedAt: string;
  /**
   * Echo lại từ PriceBook đã dùng — để BẤT KỲ AI đọc JSON output cũng thấy
   * ngay có phải giá demo hay không, không phải lục vào PriceBook riêng.
   * Founder Decision (M3-003 completion review, mục 5): "tránh dùng nhầm
   * vào production".
   */
  priceBookId: string;
  priceBookIsDemo: boolean;
  sections: BOQSection[];
}
