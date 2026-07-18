import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok } from "@/lib/http";
import {
  getContractorProfile,
  updateContractorProfile,
} from "@/features/contractor/contractorProfile.repository";

export const dynamic = "force-dynamic";

/** Demo Polish — Task 2: hồ sơ nhà thầu (singleton, không per-project). */
export async function GET() {
  return handle(async () => ok(await getContractorProfile()));
}

const PaymentMilestoneSchema = z.object({
  label: z.string().min(1),
  percent: z.number(),
});

const UpdateContractorProfileSchema = z.object({
  companyName: z.string().min(1).optional(),
  logoUrl: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  warrantyNote: z.string().nullable().optional(),
  defaultProposalValidityDays: z.number().int().positive().optional(),
  defaultPaymentPlan: z.array(PaymentMilestoneSchema).optional(),
});

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const patch = UpdateContractorProfileSchema.parse(await req.json());
    return ok(await updateContractorProfile(patch));
  });
}
