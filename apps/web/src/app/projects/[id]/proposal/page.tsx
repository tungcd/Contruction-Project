"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { projectService } from "@/services/project.service";
import { estimateService } from "@/services/estimate.service";
import { Button } from "@/components/ui/button";
import { buildProposal, ProposalNotReadyError } from "@/lib/proposal/builder";
import type { ContractorProfile } from "@/lib/proposal/types";
import { ProposalView } from "@/features/proposal/components/ProposalView";

/**
 * Proposal MVP — Web Preview + In/Xuất PDF (`window.print()`, không cần
 * thư viện PDF riêng — xem 16_Architecture-Proposal-MVP.md mục 5).
 *
 * DEMO — ContractorProfile hiện hardcode (chưa có màn hình cài đặt hồ sơ
 * nhà thầu, MVP single-user). Đổi tại đây cho tới khi có Settings riêng.
 */
const DEMO_CONTRACTOR: ContractorProfile = {
  companyName: "[DEMO] Công ty Xây dựng ABC",
  phone: "0900 000 000",
  address: null,
};
const PROPOSAL_SETTINGS = { validityDays: 30 };

export default function ProposalPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.get(id),
    enabled: !!id,
  });

  const { data: draftHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["estimate-drafts", id],
    queryFn: () => estimateService.listDraftHistory(id),
    enabled: !!id,
  });

  const confirmedDraftSummary = useMemo(
    () => draftHistory?.find((d) => d.status === "confirmed") ?? null,
    [draftHistory],
  );

  const { data: confirmedDraft, isLoading: loadingDraft } = useQuery({
    queryKey: ["estimate-draft", id, confirmedDraftSummary?.id],
    queryFn: () => estimateService.getDraftVersion(id, confirmedDraftSummary!.id),
    enabled: !!confirmedDraftSummary,
  });

  const proposalResult = useMemo(() => {
    if (!project || !confirmedDraft) return null;
    try {
      return {
        proposal: buildProposal(
          project.requirement,
          confirmedDraft.data,
          confirmedDraft.status,
          { name: project.customerName, phone: project.customerPhone },
          DEMO_CONTRACTOR,
          PROPOSAL_SETTINGS,
        ),
        error: null,
      };
    } catch (err) {
      return {
        proposal: null,
        error: err instanceof ProposalNotReadyError ? err.message : "Lỗi không xác định",
      };
    }
  }, [project, confirmedDraft]);

  const isLoading = loadingProject || loadingHistory || loadingDraft;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
        </Link>
        {proposalResult?.proposal && (
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> In / Xuất PDF
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}

      {!isLoading && !confirmedDraftSummary && (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
          Chưa có Estimate Draft nào ở trạng thái &ldquo;Đã xác nhận&rdquo; cho dự án này. Vào
          trang Dự toán và xác nhận một phiên bản trước khi tạo Báo giá đề xuất.
        </div>
      )}

      {!isLoading && confirmedDraftSummary && proposalResult?.error && (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700">
          Chưa thể tạo Báo giá đề xuất: {proposalResult.error}
        </div>
      )}

      {!isLoading && project && proposalResult?.proposal && (
        <ProposalView projectName={project.name} proposal={proposalResult.proposal} />
      )}
    </main>
  );
}
