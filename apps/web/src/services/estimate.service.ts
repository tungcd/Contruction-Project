import type { Requirement } from "@acc/shared-types";
import type { EstimateDraft, PriceBook } from "@/lib/estimate/types";
import type {
  EstimateDraftRecord,
  EstimateDraftSummary,
} from "@/lib/estimate/persistence-types";
import { request } from "./http";

/**
 * Gọi POST /api/estimate hiện có (Ticket M3-003) — không đổi contract,
 * không lưu DB. `settings`/`priceBook` bỏ qua để API tự dùng mẫu mặc định
 * (DEFAULT_ESTIMATE_SETTINGS / DEMO_PRICE_BOOK).
 *
 * Milestone Estimate MVP — Feature 1/2: persist/history dùng
 * `/api/projects/:id/estimate-drafts` (khác hẳn `/api/estimate` — route đó
 * chỉ là Rule Engine thuần, không lưu DB).
 */
export const estimateService = {
  // Milestone Estimate MVP — Feature 5: cho phép chọn PriceBook thay vì luôn
  // dùng DEMO_PRICE_BOOK mặc định phía server.
  generate: (requirement: Requirement, priceBook?: PriceBook) =>
    request<EstimateDraft>("/estimate", {
      method: "POST",
      body: JSON.stringify({ requirement, priceBook }),
    }),

  listDraftHistory: (projectId: string) =>
    request<EstimateDraftSummary[]>(`/projects/${projectId}/estimate-drafts`),

  getDraftVersion: (projectId: string, draftId: string) =>
    request<EstimateDraftRecord>(
      `/projects/${projectId}/estimate-drafts/${draftId}`,
    ),

  saveDraft: (projectId: string, draft: EstimateDraft) =>
    request<EstimateDraftRecord>(`/projects/${projectId}/estimate-drafts`, {
      method: "POST",
      body: JSON.stringify({ data: draft }),
    }),

  /** Demo Polish — Task 1: Draft -> Confirmed. Proposal chỉ đọc bản confirmed. */
  confirmDraft: (projectId: string, draftId: string) =>
    request<EstimateDraftRecord>(
      `/projects/${projectId}/estimate-drafts/${draftId}`,
      { method: "PATCH", body: JSON.stringify({ status: "confirmed" }) },
    ),

  /**
   * Feature 6 — response thành công là file nhị phân (xlsx), không phải
   * `{ success, data, message }` như `request()` giả định, nên gọi fetch
   * trực tiếp thay vì dùng helper `request()`.
   */
  exportExcel: async (draft: EstimateDraft, projectName: string): Promise<Blob> => {
    const res = await fetch("/api/estimate/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, projectName }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Lỗi xuất Excel (${res.status})`);
    }
    return res.blob();
  },
};
