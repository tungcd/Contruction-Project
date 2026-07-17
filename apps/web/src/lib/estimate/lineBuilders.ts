import type {
  BOQDraftLine,
  EstimateSettings,
  PriceBook,
  QuantitySource,
} from "./types";
import { resolveUnitPrice } from "./priceBook";

/**
 * Dòng placeholder: quantity/amount luôn null (M3-002 mục 1.5 — "không biết
 * thì để trống"). unitPrice VẪN cố tra nếu có trong PriceBook, để chủ thầu
 * chỉ cần điền quantity là ra amount ngay (M3-002 mục 5.2).
 */
export function buildPlaceholderLine(params: {
  code: string;
  category: string;
  itemName: string;
  unit: string;
  quantitySource: Extract<QuantitySource, "needs_measurement" | "needs_survey">;
  note: string;
  priceBook: PriceBook;
  settings: EstimateSettings;
}): BOQDraftLine {
  const priceEntry = resolveUnitPrice(
    params.priceBook,
    params.code,
    params.settings.materialTier,
  );
  return {
    code: params.code,
    category: params.category,
    itemName: params.itemName,
    unit: params.unit,
    quantity: null,
    unitPrice: priceEntry?.unitPrice ?? null,
    amount: null,
    quantitySource: params.quantitySource,
    confidence: "n/a",
    note: params.note,
    editable: true,
    sourceRuleId: null,
  };
}

/**
 * Dòng do Rule Engine ước lượng: có quantity, amount tính nếu có unitPrice.
 * amount = null nếu KHÔNG tìm thấy giá — KHÔNG tính bằng 0 (M3-002 mục 1.5).
 */
export function buildRuleEstimatedLine(params: {
  code: string;
  category: string;
  itemName: string;
  unit: string;
  quantity: number;
  confidence: "high" | "medium" | "low";
  note: string | null;
  sourceRuleId: string;
  priceBook: PriceBook;
  settings: EstimateSettings;
}): BOQDraftLine {
  const priceEntry = resolveUnitPrice(
    params.priceBook,
    params.code,
    params.settings.materialTier,
  );
  const unitPrice = priceEntry?.unitPrice ?? null;
  const amount = unitPrice !== null ? params.quantity * unitPrice : null;

  return {
    code: params.code,
    category: params.category,
    itemName: params.itemName,
    unit: params.unit,
    quantity: params.quantity,
    unitPrice,
    amount,
    quantitySource: "rule_estimated",
    confidence: params.confidence,
    note: params.note,
    editable: true,
    sourceRuleId: params.sourceRuleId,
  };
}
