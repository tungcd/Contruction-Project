import type { NextRequest } from "next/server";
import { assertUuid, handle, ok } from "@/lib/http";
import { setDefaultPriceBook } from "@/features/pricebook/pricebook.repository";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Đặt PriceBook này làm mặc định — trang Estimate tự chọn khi mở lần đầu. */
export async function POST(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    await setDefaultPriceBook(assertUuid(id));
    return ok({ id });
  });
}
