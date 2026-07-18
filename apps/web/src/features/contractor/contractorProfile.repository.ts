import type { Prisma, ContractorProfile as ContractorProfileRow } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ContractorProfile, PaymentMilestone } from "@/lib/proposal/types";

/**
 * ContractorProfile — Demo Polish Task 2. Singleton: luôn thao tác trên
 * dòng ĐẦU TIÊN tìm thấy, tạo mới với giá trị mặc định nếu chưa có dòng
 * nào (MVP không có auth/tổ chức, 1 chủ thầu = 1 profile duy nhất).
 */

const DEFAULT_COMPANY_NAME = "Công ty của bạn";

function toDto(row: ContractorProfileRow): ContractorProfile {
  return {
    companyName: row.companyName,
    logoUrl: row.logoUrl,
    address: row.address,
    phone: row.phone,
    email: row.email,
    website: row.website,
    warrantyNote: row.warrantyNote,
    defaultProposalValidityDays: row.defaultProposalValidityDays,
    defaultPaymentPlan: row.defaultPaymentPlan as unknown as PaymentMilestone[],
  };
}

export async function getContractorProfile(): Promise<ContractorProfile> {
  const existing = await prisma.contractorProfile.findFirst();
  if (existing) return toDto(existing);

  const created = await prisma.contractorProfile.create({
    data: { companyName: DEFAULT_COMPANY_NAME },
  });
  return toDto(created);
}

export async function updateContractorProfile(
  patch: Partial<ContractorProfile>,
): Promise<ContractorProfile> {
  const existing = await prisma.contractorProfile.findFirst();

  const data = {
    ...(patch.companyName !== undefined && { companyName: patch.companyName }),
    ...(patch.logoUrl !== undefined && { logoUrl: patch.logoUrl }),
    ...(patch.address !== undefined && { address: patch.address }),
    ...(patch.phone !== undefined && { phone: patch.phone }),
    ...(patch.email !== undefined && { email: patch.email }),
    ...(patch.website !== undefined && { website: patch.website }),
    ...(patch.warrantyNote !== undefined && { warrantyNote: patch.warrantyNote }),
    ...(patch.defaultProposalValidityDays !== undefined && {
      defaultProposalValidityDays: patch.defaultProposalValidityDays,
    }),
    ...(patch.defaultPaymentPlan !== undefined && {
      defaultPaymentPlan: patch.defaultPaymentPlan as unknown as Prisma.InputJsonValue,
    }),
  };

  if (!existing) {
    const created = await prisma.contractorProfile.create({
      data: { companyName: DEFAULT_COMPANY_NAME, ...data },
    });
    return toDto(created);
  }

  const updated = await prisma.contractorProfile.update({
    where: { id: existing.id },
    data,
  });
  return toDto(updated);
}
