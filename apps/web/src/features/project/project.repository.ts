import type { Prisma, Requirement as RequirementRow, Project } from "@prisma/client";
import {
  computeMissingFields,
  computeReadiness,
  computeScore,
  computeToConfirm,
  emptyRequirement,
  RequirementSchema,
  type ProjectDetail,
  type ProjectStatus,
  type ProjectSummary,
  type Requirement,
} from "@acc/shared-types";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/http";
import { buildQuestionsFromMissing } from "@/lib/ai/question-templates";

/**
 * Truy cập dữ liệu Project. Chạy phía server (Route Handler).
 * Score / missingFields là dữ liệu dẫn xuất, luôn tính tại đây, không lưu DB
 * (03-Data-Model mục 7).
 */

type ProjectWithRequirement = Project & { requirement: RequirementRow | null };

export function parseRequirement(row: RequirementRow | null): Requirement {
  if (!row) return emptyRequirement();
  const parsed = RequirementSchema.safeParse(row.data);
  return parsed.success ? parsed.data : emptyRequirement();
}

export function toSummary(p: ProjectWithRequirement): ProjectSummary {
  const requirement = parseRequirement(p.requirement);
  return {
    id: p.id,
    name: p.name,
    customerName: p.customerName,
    customerPhone: p.customerPhone,
    status: p.status as ProjectStatus,
    score: computeScore(requirement),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const rows = await prisma.project.findMany({
    include: { requirement: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toSummary);
}

export async function createProject(input: {
  name: string;
  customerName?: string;
  customerPhone?: string;
}): Promise<ProjectDetail> {
  const created = await prisma.project.create({
    data: {
      name: input.name,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      requirement: {
        create: {
          data: emptyRequirement() as unknown as Prisma.InputJsonValue,
        },
      },
      histories: { create: { event: "Project Created" } },
    },
    include: { requirement: true },
  });
  const requirement = parseRequirement(created.requirement);
  return {
    ...toSummary(created),
    requirement,
    conversation: [],
    missingFields: computeMissingFields(requirement),
    questions: buildQuestionsFromMissing(requirement),
    readiness: computeReadiness(requirement),
    toConfirm: computeToConfirm(requirement),
  };
}

export async function getProjectDetail(id: string): Promise<ProjectDetail> {
  const p = await prisma.project.findUnique({
    where: { id },
    include: {
      requirement: true,
      conversations: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!p) throw notFound();

  const requirement = parseRequirement(p.requirement);
  return {
    ...toSummary(p),
    requirement,
    missingFields: computeMissingFields(requirement),
    questions: buildQuestionsFromMissing(requirement),
    readiness: computeReadiness(requirement),
    toConfirm: computeToConfirm(requirement),
    conversation: p.conversations.map((c) => ({
      id: c.id,
      role: c.role,
      message: c.message,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export async function updateProject(
  id: string,
  input: { name?: string; customerName?: string; customerPhone?: string },
): Promise<ProjectDetail> {
  await ensureProjectExists(id);
  await prisma.project.update({ where: { id }, data: input });
  return getProjectDetail(id);
}

/**
 * Concept Drawing Stage 1 — Constraint Set Compiler yêu cầu
 * `Requirement.status === "confirmed"` (Explicit Precondition), nhưng
 * chưa từng có action nào trong app đặt field này (chỉ mới thêm vào
 * schema khi build Constraint Set Compiler, dùng qua fixture/script,
 * chưa nối vào UI thật). Đây là phần plumbing bắt buộc để trang
 * `/projects/[id]/design` chạy được trên project thật — không phải mở
 * rộng phạm vi hình học Stage 1.
 */
export async function confirmRequirement(projectId: string): Promise<Requirement> {
  await ensureProjectExists(projectId);
  const row = await prisma.requirement.findUnique({ where: { projectId } });
  const current = parseRequirement(row);
  const confirmed: Requirement = {
    ...current,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
  };
  await prisma.requirement.upsert({
    where: { projectId },
    create: { projectId, data: confirmed as unknown as Prisma.InputJsonValue },
    update: { data: confirmed as unknown as Prisma.InputJsonValue },
  });
  return confirmed;
}

export async function deleteProject(id: string): Promise<{ id: string }> {
  await ensureProjectExists(id);
  await prisma.project.delete({ where: { id } });
  return { id };
}

export async function ensureProjectExists(id: string): Promise<void> {
  const count = await prisma.project.count({ where: { id } });
  if (count === 0) throw notFound();
}
