import type { BriefSection } from "@/features/requirement/brief-view";
import type { EstimateSummary } from "@/features/estimate/estimate-view";

/**
 * Proposal MVP — data contract (xem
 * documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-18/
 * 16_Architecture-Proposal-MVP.md).
 *
 * Proposal KHÔNG persist ở v1 — sinh on-demand từ Requirement +
 * EstimateDraft đã confirmed, không phải bản ghi DB riêng.
 */

export interface PaymentMilestone {
  label: string; // vd "Đặt cọc", "Hoàn thiện phần thô", "Bàn giao"
  percent: number; // 0-100 — KHÔNG auto-validate tổng = 100, contractor tự chịu trách nhiệm nhập
}

/** Settings tĩnh, KHÔNG per-project — một chủ thầu dùng chung 1 profile (MVP single-user). */
export interface ContractorProfile {
  companyName: string;
  phone: string;
  address: string | null;
}

export interface ProposalSettings {
  /** Số ngày hiệu lực báo giá kể từ generatedAt. */
  validityDays: number;
}

export interface Proposal {
  generatedAt: string;
  customerSummary: {
    name: string | null;
    phone: string | null;
  };
  /** Tái dùng nguyên BriefSection[] từ brief-view.ts — không viết lại. */
  projectSummary: BriefSection[];
  proposedScope: BriefSection | null;
  estimateSummary: EstimateSummary;
  /**
   * Mặc định chỉ có 1 dòng tự sinh (nếu có hạng mục cần đo đạc/khảo
   * sát) — phần còn lại để trống, contractor tự điền trước khi gửi
   * khách (giống triết lý `editable: true` của BOQDraftLine).
   */
  assumptions: string[];
  /** Từ requirement.functional.excludedRooms — dữ liệu đã có sẵn. */
  exclusions: string[];
  timeline: {
    expectedStart: string | null;
    expectedFinish: string | null;
  };
  /** Mặc định rỗng — MVP không suy đoán tỷ lệ thanh toán. */
  paymentPlan: PaymentMilestone[];
  validity: {
    validUntil: string; // ISO date, generatedAt + validityDays
  };
  contractorInfo: ContractorProfile;
}
