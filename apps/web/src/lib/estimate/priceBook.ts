import type { MaterialTier, PriceBook, PriceBookEntry } from "./types";

/**
 * Tra đơn giá từ PriceBook do chủ thầu tự quản lý (M3-002 mục 6).
 * KHÔNG scraping, KHÔNG AI sinh giá, KHÔNG tích hợp định mức Nhà nước.
 *
 * Ưu tiên entry khớp đúng materialTier; nếu không có, dùng entry "all".
 * KHÔNG dùng tạm giá của tier khác (vd standard) khi thiếu tier yêu cầu —
 * trả về null để không báo giá sai âm thầm (M3-002 mục 6.3).
 */
export function resolveUnitPrice(
  priceBook: PriceBook,
  itemCode: string,
  materialTier: MaterialTier,
): PriceBookEntry | null {
  const exact = priceBook.entries.find(
    (e) => e.itemCode === itemCode && e.materialTier === materialTier,
  );
  if (exact) return exact;

  const universal = priceBook.entries.find(
    (e) => e.itemCode === itemCode && e.materialTier === "all",
  );
  return universal ?? null;
}
