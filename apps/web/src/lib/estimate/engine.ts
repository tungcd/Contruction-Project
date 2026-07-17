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
 */
export function buildEstimateDraft(
  requirement: Requirement,
  settings: EstimateSettings,
  priceBook: PriceBook,
): EstimateDraft {
  return {
    generatedAt: new Date().toISOString(),
    sections: buildSections(requirement, settings, priceBook),
  };
}

export * from "./types";
