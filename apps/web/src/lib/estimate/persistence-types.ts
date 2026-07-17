import type { EstimateDraft } from "./types";

/**
 * View model cho `EstimateDraft` đã lưu DB (Milestone Estimate MVP —
 * Feature 1 Persist + Feature 2 History). Khác `EstimateDraft` (JSON thuần,
 * types.ts) ở chỗ có id/version/status — đây là bản ghi, không phải JSON
 * tính toán tạm thời.
 */

export type EstimateDraftStatus = "draft" | "confirmed";

export interface EstimateDraftRecord {
  id: string;
  projectId: string;
  version: number;
  status: EstimateDraftStatus;
  editedBy: string | null;
  /** ISO timestamp — snapshot Requirement.updatedAt lúc lưu (Design M3-002 mục 2.3). */
  generatedFromRequirementVersion: string;
  data: EstimateDraft;
  createdAt: string;
  updatedAt: string;
}

/** Dùng cho danh sách lịch sử (Feature 2) — không cần gửi `data` đầy đủ. */
export interface EstimateDraftSummary {
  id: string;
  version: number;
  status: EstimateDraftStatus;
  editedBy: string | null;
  generatedFromRequirementVersion: string;
  createdAt: string;
  updatedAt: string;
}
