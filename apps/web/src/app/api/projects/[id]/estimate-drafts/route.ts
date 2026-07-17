import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertUuid, handle, ok } from "@/lib/http";
import { listDraftSummaries, saveDraft } from "@/features/estimate/boqDraft.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const SaveDraftSchema = z.object({
  // Không validate chi tiết cấu trúc EstimateDraft ở đây — dữ liệu đã được
  // sinh/sửa từ đúng contract phía client (lib/estimate/types.ts), tương
  // tự cách Requirement.data lưu Json không parse lại (project.repository.ts).
  data: z.record(z.string(), z.unknown()),
});

/** Milestone Estimate MVP — Feature 2: danh sách lịch sử bản dự toán. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return ok(await listDraftSummaries(assertUuid(id)));
  });
}

/** Milestone Estimate MVP — Feature 1: lưu bản dự toán hiện tại thành version mới. */
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const body = SaveDraftSchema.parse(await req.json());
    return ok(await saveDraft(assertUuid(id), body.data as never));
  });
}
