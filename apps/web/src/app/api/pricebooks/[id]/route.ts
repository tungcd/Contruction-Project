import type { NextRequest } from "next/server";
import { assertUuid, handle, ok } from "@/lib/http";
import { UpdatePriceBookSchema } from "@/features/pricebook/pricebook.schema";
import {
  getPriceBook,
  updatePriceBook,
} from "@/features/pricebook/pricebook.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Milestone Estimate MVP — Feature 5: xem 1 PriceBook đầy đủ (kèm entries). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return ok(await getPriceBook(assertUuid(id)));
  });
}

/** Milestone Estimate MVP — Feature 5: sửa PriceBook (thông tin chung + toàn bộ entries). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const body = UpdatePriceBookSchema.parse(await req.json());
    return ok(await updatePriceBook(assertUuid(id), body));
  });
}
