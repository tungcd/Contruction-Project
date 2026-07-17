import type { NextRequest } from "next/server";
import { assertUuid, handle, ok } from "@/lib/http";
import { DuplicatePriceBookSchema } from "@/features/pricebook/pricebook.schema";
import { duplicatePriceBook } from "@/features/pricebook/pricebook.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Milestone Estimate MVP — Feature 5: nhân bản PriceBook (bắt đầu từ 1 bảng có sẵn để sửa thành giá thật). */
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const body = DuplicatePriceBookSchema.parse(await req.json().catch(() => ({})));
    return ok(await duplicatePriceBook(assertUuid(id), body.name));
  });
}
