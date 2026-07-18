import type { Requirement } from "@acc/shared-types";
import type { EstimateDraft } from "@/lib/estimate/types";
import { buildCoreSections, buildScopeSection } from "@/features/requirement/brief-view";
import { buildEstimateSummary } from "@/features/estimate/estimate-view";
import type { ContractorProfile, Proposal, ProposalSettings } from "./types";

/**
 * Proposal Builder — Pure Function, Deterministic, No AI (v1). Ghép
 * Requirement + EstimateDraft đã có sẵn thành tài liệu khách hàng đọc
 * được. Không tính lại Estimate, không gọi AI, không ghi DB (xem
 * documents/CHATGPT_CONTEXT/2026-07/2026-W29/2026-07-18/
 * 16_Architecture-Proposal-MVP.md).
 */

export class ProposalNotReadyError extends Error {
  constructor(reason: string) {
    super(`Không thể tạo Proposal: ${reason} (Explicit Precondition).`);
    this.name = "ProposalNotReadyError";
  }
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function buildProposal(
  requirement: Requirement,
  estimateDraft: EstimateDraft,
  estimateStatus: "draft" | "confirmed",
  customer: { name: string | null; phone: string | null },
  contractorInfo: ContractorProfile,
  settings: ProposalSettings,
): Proposal {
  if (requirement.status !== "confirmed") {
    throw new ProposalNotReadyError(
      `Requirement chưa confirmed (đang ở trạng thái "${requirement.status}")`,
    );
  }
  if (estimateStatus !== "confirmed") {
    throw new ProposalNotReadyError(
      `EstimateDraft chưa confirmed (đang ở trạng thái "${estimateStatus}")`,
    );
  }

  const generatedAt = new Date().toISOString();
  const estimateSummary = buildEstimateSummary(estimateDraft);

  const assumptions: string[] = [];
  if (estimateSummary.needsSurveyOrMeasurementCount > 0) {
    assumptions.push(
      `${estimateSummary.needsSurveyOrMeasurementCount} hạng mục cần đo đạc/khảo sát thực tế trước khi thi công.`,
    );
  }

  return {
    generatedAt,
    customerSummary: { name: customer.name, phone: customer.phone },
    projectSummary: buildCoreSections(requirement),
    proposedScope: buildScopeSection(requirement),
    estimateSummary,
    assumptions,
    exclusions: requirement.functional.excludedRooms,
    timeline: {
      expectedStart: requirement.timeline.expectedStart,
      expectedFinish: requirement.timeline.expectedFinish,
    },
    paymentPlan: [],
    validity: { validUntil: addDays(generatedAt, settings.validityDays) },
    contractorInfo,
  };
}
