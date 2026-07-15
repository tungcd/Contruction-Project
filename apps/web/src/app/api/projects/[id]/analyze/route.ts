import type { NextRequest } from "next/server";
import { CreateMessageSchema } from "@acc/shared-types";
import { assertUuid, fail, handle, ok } from "@/lib/http";
import { AIInvalidOutputError } from "@/lib/ai/provider";
import { analyzeMessage } from "@/features/requirement/analyze.service";

export const dynamic = "force-dynamic";
// Gọi AI có thể lâu hơn mặc định.
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const projectId = assertUuid(id);
    const { message } = CreateMessageSchema.parse(await req.json());

    try {
      return ok(await analyzeMessage(projectId, message));
    } catch (err) {
      // Lỗi AI -> thông báo thân thiện, không lộ chi tiết kỹ thuật (05 mục 11).
      if (err instanceof AIInvalidOutputError) {
        return fail(err.message, 502);
      }
      throw err;
    }
  });
}
