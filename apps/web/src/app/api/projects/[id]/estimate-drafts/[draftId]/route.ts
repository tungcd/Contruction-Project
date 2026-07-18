import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertUuid, handle, ok } from "@/lib/http";
import { confirmDraft, getDraftById } from "@/features/estimate/boqDraft.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; draftId: string }> };

/** Milestone Estimate MVP — Feature 2: xem lại 1 version cụ thể trong lịch sử. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id, draftId } = await params;
    return ok(await getDraftById(assertUuid(id), assertUuid(draftId)));
  });
}

const PatchDraftSchema = z.object({
  status: z.literal("confirmed"),
});

/** Demo Polish — Task 1: Draft -> Confirmed. Chỉ hỗ trợ chuyển sang "confirmed". */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id, draftId } = await params;
    PatchDraftSchema.parse(await req.json());
    return ok(await confirmDraft(assertUuid(id), assertUuid(draftId)));
  });
}
