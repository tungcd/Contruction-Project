import type { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { CreatePriceBookSchema } from "@/features/pricebook/pricebook.schema";
import {
  createPriceBook,
  listPriceBooks,
} from "@/features/pricebook/pricebook.repository";

export const dynamic = "force-dynamic";

/** Milestone Estimate MVP — Feature 5: danh sách PriceBook (để chọn khi tạo dự toán). */
export async function GET() {
  return handle(async () => ok(await listPriceBooks()));
}

/** Milestone Estimate MVP — Feature 5: tạo PriceBook mới. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = CreatePriceBookSchema.parse(await req.json());
    return ok(await createPriceBook(body));
  });
}
