import type { Requirement } from "@acc/shared-types";
import type { EstimateDraft, EstimateSettings, PriceBook } from "./types";
import { buildSections } from "./sections";

/**
 * Estimate Engine — Ticket M3-003.
 *
 * Rule Engine THUẦN TypeScript, KHÔNG gọi AI, KHÔNG lưu DB, KHÔNG xuất
 * Excel/UI. Input: Requirement (đã đóng băng, chỉ đọc) + EstimateSettings +
 * PriceBook. Output: EstimateDraft (JSON thuần, không phải bản ghi DB).
 *
 * Theo đúng Design-M3-002-BOQ-Draft-Schema-Rule-Catalog.md.
 *
 * NỢ KỸ THUẬT ĐÃ GHI NHẬN (Founder Decision, M3-003 completion review —
 * mục "Technical Debt"): các rule hiện là hàm code cứng (rules/*.ts,
 * sections.ts). Khi số lượng rule tăng lên, nên cân nhắc chuyển sang Rule
 * Catalog khai báo (config-driven) thay vì hàm code cứng. Đây CHỈ là cải
 * tiến kiến trúc TƯƠNG LAI — KHÔNG refactor trong Milestone 3. Tiếp tục
 * implement theo đúng cấu trúc hiện tại cho các ticket M3 sau.
 */
export function buildEstimateDraft(
  requirement: Requirement,
  settings: EstimateSettings,
  priceBook: PriceBook,
): EstimateDraft {
  return {
    generatedAt: new Date().toISOString(),
    priceBookId: priceBook.id,
    priceBookIsDemo: priceBook.isDemo,
    sections: buildSections(requirement, settings, priceBook),
  };
}

export * from "./types";
