import type { Requirement } from "@acc/shared-types";
import type { EstimateDraft } from "@/lib/estimate/types";
import { request } from "./http";

/**
 * Gọi POST /api/estimate hiện có (Ticket M3-003) — không đổi contract,
 * không lưu DB. `settings`/`priceBook` bỏ qua để API tự dùng mẫu mặc định
 * (DEFAULT_ESTIMATE_SETTINGS / DEMO_PRICE_BOOK).
 */
export const estimateService = {
  generate: (requirement: Requirement) =>
    request<EstimateDraft>("/estimate", {
      method: "POST",
      body: JSON.stringify({ requirement }),
    }),
};
