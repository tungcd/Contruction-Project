import type { Prisma, EstimateDraft as EstimateDraftRow } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/http";
import type { EstimateDraft } from "@/lib/estimate/types";
import type {
  EstimateDraftRecord,
  EstimateDraftSummary,
} from "@/lib/estimate/persistence-types";

/**
 * Truy cập `EstimateDraft` đã lưu DB (Milestone Estimate MVP — Feature 1
 * Persist + Feature 2 History). Chạy phía server (Route Handler), theo
 * đúng pattern `project.repository.ts`.
 */

function toRecord(row: EstimateDraftRow): EstimateDraftRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    version: row.version,
    status: row.status,
    editedBy: row.editedBy,
    generatedFromRequirementVersion:
      row.generatedFromRequirementVersion.toISOString(),
    data: row.data as unknown as EstimateDraft,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toSummary(row: EstimateDraftRow): EstimateDraftSummary {
  return {
    id: row.id,
    version: row.version,
    status: row.status,
    editedBy: row.editedBy,
    generatedFromRequirementVersion:
      row.generatedFromRequirementVersion.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listDraftSummaries(
  projectId: string,
): Promise<EstimateDraftSummary[]> {
  const rows = await prisma.estimateDraft.findMany({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  return rows.map(toSummary);
}

export async function getLatestDraft(
  projectId: string,
): Promise<EstimateDraftRecord | null> {
  const row = await prisma.estimateDraft.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  return row ? toRecord(row) : null;
}

export async function getDraftById(
  projectId: string,
  draftId: string,
): Promise<EstimateDraftRecord> {
  const row = await prisma.estimateDraft.findFirst({
    where: { id: draftId, projectId },
  });
  if (!row) throw notFound("Không tìm thấy bản dự toán");
  return toRecord(row);
}

/**
 * Lưu bản dự toán hiện tại thành 1 version MỚI (KHÔNG ghi đè — Design
 * M3-002 mục 1.3 câu hỏi 4, chốt theo Milestone Estimate MVP Feature 2:
 * cần Estimate History). `editedBy` cố định "Founder" vì MVP không có auth.
 */
export async function saveDraft(
  projectId: string,
  draft: EstimateDraft,
): Promise<EstimateDraftRecord> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { requirement: true },
  });
  if (!project) throw notFound();

  const agg = await prisma.estimateDraft.aggregate({
    where: { projectId },
    _max: { version: true },
  });
  const version = (agg._max.version ?? 0) + 1;

  const created = await prisma.estimateDraft.create({
    data: {
      projectId,
      version,
      editedBy: "Founder",
      generatedFromRequirementVersion:
        project.requirement?.updatedAt ?? new Date(),
      data: draft as unknown as Prisma.InputJsonValue,
    },
  });
  return toRecord(created);
}

/**
 * Demo Polish — Task 1: đánh dấu 1 version đã "Xác nhận". Không tự động
 * bỏ xác nhận version khác — mỗi version giữ trạng thái độc lập, Proposal
 * luôn dùng version confirmed MỚI NHẤT (xem estimate.service.ts).
 */
export async function confirmDraft(
  projectId: string,
  draftId: string,
): Promise<EstimateDraftRecord> {
  const row = await prisma.estimateDraft.findFirst({
    where: { id: draftId, projectId },
  });
  if (!row) throw notFound("Không tìm thấy bản dự toán");

  const updated = await prisma.estimateDraft.update({
    where: { id: draftId },
    data: { status: "confirmed" },
  });
  return toRecord(updated);
}
