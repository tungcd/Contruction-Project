import type { NextRequest } from "next/server";
import { assertUuid, handle, ok } from "@/lib/http";
import { confirmRequirement } from "@/features/project/project.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Concept Drawing Stage 1 — bắt buộc để Constraint Set Compiler chạy được trên project thật. */
export async function POST(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return ok(await confirmRequirement(assertUuid(id)));
  });
}
