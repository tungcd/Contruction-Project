import type { NextRequest } from "next/server";
import { assertUuid, handle, ok } from "@/lib/http";
import { getDraftById } from "@/features/estimate/boqDraft.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; draftId: string }> };

/** Milestone Estimate MVP — Feature 2: xem lại 1 version cụ thể trong lịch sử. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id, draftId } = await params;
    return ok(await getDraftById(assertUuid(id), assertUuid(draftId)));
  });
}
