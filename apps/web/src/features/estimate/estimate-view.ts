import type { Confidence, QuantitySource } from "@/lib/estimate/types";

export const quantitySourceLabel: Record<QuantitySource, string> = {
  rule_estimated: "Ước lượng theo rule",
  needs_measurement: "Cần đo đạc",
  needs_survey: "Cần khảo sát",
  user_confirmed: "Đã xác nhận",
};

export const quantitySourceBadgeClass: Record<QuantitySource, string> = {
  rule_estimated: "border-blue-200 bg-blue-50 text-blue-700",
  needs_measurement: "border-amber-200 bg-amber-50 text-amber-700",
  needs_survey: "border-red-200 bg-red-50 text-red-700",
  user_confirmed: "border-green-200 bg-green-50 text-green-700",
};

export const confidenceLabel: Record<Confidence, string> = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  "n/a": "—",
};

export const confidenceBadgeClass: Record<Confidence, string> = {
  high: "border-green-200 bg-green-50 text-green-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-red-200 bg-red-50 text-red-700",
  "n/a": "border-muted-foreground/20 bg-muted text-muted-foreground",
};

export function formatVnd(v: number | null): string {
  if (v === null) return "—";
  return `${v.toLocaleString("vi-VN")} đ`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** amount = null nếu thiếu quantity hoặc unitPrice — KHÔNG tính bằng 0 (giữ đúng quy ước M3-002). */
export function recomputeAmount(
  quantity: number | null,
  unitPrice: number | null,
): number | null {
  if (quantity === null || unitPrice === null) return null;
  return round2(quantity * unitPrice);
}
